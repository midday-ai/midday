import {
  getAccountBalance,
  getTransactionAmount,
} from "@jobs/utils/base-currency";
import { processBatch } from "@jobs/utils/process-batch";
import { createClient } from "@midday/supabase/job";
import { logger, schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";

const BATCH_LIMIT = 500;

export const updateAccountBaseCurrency = schemaTask({
  id: "update-account-base-currency",
  schema: z.object({
    accountId: z.string().uuid(),
    currency: z.string(),
    balance: z.number(),
    baseCurrency: z.string(),
  }),
  maxDuration: 120,
  queue: {
    concurrencyLimit: 10,
  },
  run: async ({ accountId, currency, balance, baseCurrency }) => {
    const supabase = createClient();

    const { data: exchangeRate } = await supabase
      .from("exchange_rates")
      .select("rate")
      .eq("base", currency)
      .eq("target", baseCurrency)
      .single();

    if (!exchangeRate) {
      logger.info("No exchange rate found", {
        currency,
        baseCurrency,
      });

      return;
    }

    // Update account base balance and base currency
    // based on the new currency exchange rate
    await supabase
      .from("bank_accounts")
      .update({
        base_balance: getAccountBalance({
          currency: currency,
          balance,
          baseCurrency,
          rate: exchangeRate.rate,
        }),
        base_currency: baseCurrency,
      })
      .eq("id", accountId);

    const { data: transactionsData } = await supabase.rpc(
      "get_all_transactions_by_account",
      {
        account_id: accountId,
      },
    );

    const formattedTransactions = transactionsData?.map(
      // Exclude fts_vector from the transaction object because it's a generated column
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

    await processBatch(
      formattedTransactions ?? [],
      BATCH_LIMIT,
      async (batch) => {
        await supabase.from("transactions").upsert(batch, {
          onConflict: "internal_id",
          ignoreDuplicates: false,
        });

        return batch;
      },
    );
  },
});
