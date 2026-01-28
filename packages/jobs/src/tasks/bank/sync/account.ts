import { trpc } from "@jobs/client/trpc";
import { parseAPIError } from "@jobs/utils/parse-error";
import { getClassification } from "@jobs/utils/transform";
import { createClient } from "@midday/supabase/job";
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
    manualSync,
  }) => {
    const supabase = createClient();
    const classification = getClassification(accountType);

    // Get the balance
    try {
      const balanceData = await trpc.bankingService.getAccountBalance.query({
        provider,
        accountId,
        accessToken,
        accountType,
      });

      const balance = balanceData?.amount ?? null;

      // Update balance (including zero/negative for overdrafts) and reset errors
      // Only skip update if balance is null (provider didn't return a balance)
      if (balance !== null) {
        await supabase
          .from("bank_accounts")
          .update({
            balance,
            available_balance: balanceData?.available_balance ?? null,
            credit_limit: balanceData?.credit_limit ?? null,
            error_details: null,
            error_retries: null,
          })
          .eq("id", id);
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
      const transactionsData = await trpc.bankingService.getTransactions.query({
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

      if (!transactionsData || transactionsData.length === 0) {
        logger.info(`No transactions to upsert for account ${accountId}`);
        return;
      }

      // Map transactions to ensure merchant_name is included (default to null if missing)
      const mappedTransactions = transactionsData.map((tx: any) => ({
        ...tx,
        merchant_name: tx.merchant_name ?? null,
      }));

      // Upsert transactions in batches of 500
      // This is to avoid memory issues with the DB
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
