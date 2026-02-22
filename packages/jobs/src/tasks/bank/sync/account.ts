import { parseAPIError } from "@jobs/utils/parse-error";
import { getClassification } from "@jobs/utils/transform";
import { createClient } from "@midday/supabase/job";
import { trpc } from "@midday/trpc";
import { logger, schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";
import { upsertTransactions } from "../transactions/upsert";

const BATCH_SIZE = 500;

export const syncAccount = schemaTask({
  id: "sync-account",
  maxDuration: 120,
  retry: {
    maxAttempts: 2,
  },
  schema: z.object({
    id: z.string().uuid(),
    teamId: z.string(),
    accountId: z.string(),
    accessToken: z.string().optional(),
    errorRetries: z.number().optional(),
    provider: z.enum(["gocardless", "plaid", "teller", "enablebanking"]),
    manualSync: z.boolean().optional(),
    currency: z.string().optional(),
    accountType: z.enum([
      "credit",
      "other_asset",
      "other_liability",
      "depository",
      "loan",
    ]),
  }),
  run: async ({
    id,
    teamId,
    accountId,
    accountType,
    accessToken,
    errorRetries,
    provider,
    currency: storedCurrency,
    manualSync,
  }) => {
    const supabase = createClient();
    const classification = getClassification(accountType);

    // Only heal currency when we know for certain it's "XXX".
    // If the caller didn't pass the currency, query the DB so we don't guess.
    let currentCurrency = storedCurrency;
    if (!currentCurrency) {
      const { data: accountData } = await supabase
        .from("bank_accounts")
        .select("currency")
        .eq("id", id)
        .single();
      currentCurrency = accountData?.currency ?? undefined;
    }

    const needsCurrencyHeal = currentCurrency?.toUpperCase() === "XXX";
    let currencyHealed = false;

    // Get the balance
    try {
      const balanceResult = await trpc.banking.getBalance.query({
        provider,
        id: accountId,
        accessToken,
        accountType,
      });

      const balanceData = balanceResult.data as {
        amount: number;
        currency: string;
        available_balance?: number | null;
        credit_limit?: number | null;
      } | null;

      const balance = balanceData?.amount ?? null;

      const balanceCurrencyValid =
        balanceData?.currency && balanceData.currency.toUpperCase() !== "XXX";

      // Update balance (including zero/negative for overdrafts) and reset errors
      // Only skip update if balance is null (provider didn't return a balance)
      if (balance !== null) {
        const updatePayload: Record<string, unknown> = {
          balance,
          available_balance: balanceData?.available_balance ?? null,
          credit_limit: balanceData?.credit_limit ?? null,
          error_details: null,
          error_retries: null,
        };

        if (needsCurrencyHeal && balanceCurrencyValid) {
          updatePayload.currency = balanceData.currency;
          currencyHealed = true;
          logger.info("Healing account currency from balance", {
            accountId,
            from: currentCurrency,
            to: balanceData.currency,
          });
        }

        await supabase.from("bank_accounts").update(updatePayload).eq("id", id);
      } else {
        // Reset error details and retries even if balance is null
        await supabase
          .from("bank_accounts")
          .update({
            error_details: null,
            error_retries: null,
          })
          .eq("id", id);
      }
    } catch (error) {
      const parsedError = parseAPIError(error);

      logger.error("Failed to sync account balance", { error: parsedError });

      if (parsedError.code === "disconnected") {
        const retries = errorRetries ? errorRetries + 1 : 1;

        // Update the account with the error details and retries
        await supabase
          .from("bank_accounts")
          .update({
            error_details: parsedError.message,
            error_retries: retries,
          })
          .eq("id", id);

        throw error;
      }
    }

    // Get the transactions
    try {
      const transactionsResult =
        await trpc.banking.getProviderTransactions.query({
          provider,
          accountId,
          accountType: classification,
          accessToken,
          // If the transactions are being synced manually, we want to get all transactions
          latest: !manualSync,
        });

      // Reset error details and retries if we successfully got the transactions
      await supabase
        .from("bank_accounts")
        .update({
          error_details: null,
          error_retries: null,
        })
        .eq("id", id);

      const transactionsData = transactionsResult.data;

      if (!transactionsData) {
        logger.info(`No transactions to upsert for account ${accountId}`);
        return;
      }

      // Map transactions to ensure merchant_name is included (default to null if missing)
      const mappedTransactions = transactionsData.map((tx: any) => ({
        ...tx,
        merchant_name: tx.merchant_name ?? null,
      }));

      // If currency still needs healing and balance didn't provide one,
      // derive from the first transaction with a valid currency
      if (
        needsCurrencyHeal &&
        !currencyHealed &&
        mappedTransactions.length > 0
      ) {
        const txCurrency = mappedTransactions.find(
          (tx: any) => tx.currency && tx.currency.toUpperCase() !== "XXX",
        )?.currency;

        if (txCurrency) {
          await supabase
            .from("bank_accounts")
            .update({ currency: txCurrency })
            .eq("id", id);

          logger.info("Healing account currency from transaction", {
            accountId,
            from: currentCurrency,
            to: txCurrency,
          });
        }
      }

      // Upsert transactions in batches of 500
      for (let i = 0; i < mappedTransactions.length; i += BATCH_SIZE) {
        const transactionBatch = mappedTransactions.slice(i, i + BATCH_SIZE);
        await upsertTransactions.triggerAndWait({
          transactions: transactionBatch,
          teamId,
          bankAccountId: id,
          manualSync,
        });
      }
    } catch (error) {
      logger.error("Failed to sync transactions", { error });

      throw error;
    }
  },
});
