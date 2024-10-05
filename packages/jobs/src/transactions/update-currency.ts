import { eventTrigger } from "@trigger.dev/sdk";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { client, supabase } from "../client";
import { Events, Jobs } from "../constants";
import { processBatch } from "../utils/process";

const BATCH_LIMIT = 500;

/**
 * Parameters for calculating the account balance in the base currency.
 */
type GetAccountBalanceParams = {
  currency: string;
  balance: number;
  baseCurrency: string;
  rate: number | null;
};

/**
 * Calculates the account balance in the base currency.
 * @param params - The parameters for the calculation.
 * @returns The account balance in the base currency.
 */
function getAccountBalance({
  currency,
  balance,
  baseCurrency,
  rate,
}: GetAccountBalanceParams) {
  if (currency === baseCurrency) {
    return balance;
  }

  return +(balance * (rate ?? 1)).toFixed(2);
}

/**
 * Parameters for calculating the transaction amount in the base currency.
 */
type GetTransactionAmountParams = {
  amount: number;
  currency: string;
  baseCurrency: string;
  rate: number | null;
};

/**
 * Calculates the transaction amount in the base currency.
 * @param params - The parameters for the calculation.
 * @returns The transaction amount in the base currency.
 */
function getTransactionAmount({
  amount,
  currency,
  baseCurrency,
  rate,
}: GetTransactionAmountParams) {
  if (currency === baseCurrency) {
    return amount;
  }

  return +(amount * (rate ?? 1)).toFixed(2);
}

/**
 * Defines a job to update the base currency for a team's accounts and transactions.
 *
 * This job is triggered when a team changes their base currency. It performs the following tasks:
 * 1. Updates the base balance for all enabled bank accounts.
 * 2. Updates the base amount for all transactions associated with these accounts.
 * 3. Revalidates various cache tags to ensure up-to-date data in the UI.
 *
 * @remarks
 * The job processes accounts and transactions in batches to handle large datasets efficiently.
 * It uses exchange rates stored in the database to perform currency conversions.
 */
client.defineJob({
  id: Jobs.UPDATE_CURRENCY,
  name: "Transactions - Update Base Currency",
  version: "0.0.1",
  trigger: eventTrigger({
    name: Events.UPDATE_CURRENCY,
    schema: z.object({
      teamId: z.string(),
      baseCurrency: z.string(),
    }),
  }),
  integrations: { supabase },
  run: async (payload, io) => {
    const supabase = io.supabase.client;

    const { teamId, baseCurrency } = payload;

    // Get all enabled accounts
    const { data: accounts } = await supabase
      .from("bank_accounts")
      .select("id, currency, balance")
      .eq("team_id", teamId)
      .eq("enabled", true);

    const promises = accounts?.map(async (account) => {
      // Fetch the exchange rate for the account's currency to the new base currency
      const { data: exchangeRate } = await supabase
        .from("exchange_rates")
        .select("rate")
        .eq("base", account.currency)
        .eq("target", baseCurrency)
        .single();

      // Update account base balance and base currency
      await supabase
        .from("bank_accounts")
        .update({
          base_balance: getAccountBalance({
            currency: account.currency,
            balance: account.balance,
            baseCurrency,
            rate: exchangeRate?.rate,
          }),
          base_currency: baseCurrency,
        })
        .eq("id", account.id);

      // Fetch all transactions for the account
      const { data: transactions } = await supabase.rpc(
        "get_all_transactions_by_account",
        {
          account_id: account.id,
        },
      );

      // Format transactions with updated base amount and currency
      const formattedTransactions = transactions?.map(
        ({ fts_vector, ...transaction }) => ({
          ...transaction,
          base_amount: getTransactionAmount({
            amount: transaction.amount,
            currency: transaction.currency,
            baseCurrency,
            rate: exchangeRate?.rate,
          }),
          base_currency: baseCurrency,
        }),
      );

      // Process transactions in batches
      await processBatch(
        formattedTransactions ?? [],
        BATCH_LIMIT,
        async (batch) => {
          await supabase.from("transactions").upsert(batch, {
            onConflict: "internal_id",
            ignoreDuplicates: false,
          });
        },
      );
    });

    // Wait for all account and transaction updates to complete
    if (promises) {
      await Promise.all(promises);
    }

    // Revalidate cache tags to ensure fresh data in the UI
    revalidateTag(`spending_${teamId}`);
    revalidateTag(`metrics_${teamId}`);
    revalidateTag(`insights_${teamId}`);
    revalidateTag(`runway_${teamId}`);
    revalidateTag(`burn_rate_${teamId}`);
    revalidateTag(`expenses_${teamId}`);

    return;
  },
});
