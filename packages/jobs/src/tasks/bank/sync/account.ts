import { parseAPIError } from "@jobs/utils/parse-error";
import { getClassification } from "@jobs/utils/transform";
import { client } from "@midday/engine-client";
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
      const balanceResponse = await client.accounts.balance.$get({
        query: {
          provider,
          id: accountId,
          accessToken,
        },
      });

      if (!balanceResponse.ok) {
        throw new Error("Failed to get balance");
      }

      const { data: balanceData } = await balanceResponse.json();

      // Only update the balance if it's greater than 0
      const balance = balanceData?.amount ?? 0;

      if (balance > 0) {
        // Reset error details and retries if we successfully got the balance
        await supabase
          .from("bank_accounts")
          .update({
            balance,
            error_details: null,
            error_retries: null,
          })
          .eq("id", id);
      } else {
        // Reset error details and retries if we successfully got the balance
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
      const transactionsResponse = await client.transactions.$get({
        query: {
          provider,
          accountId,
          accountType: classification,
          accessToken,
          // If the transactions are being synced manually, we want to get all transactions
          latest: manualSync ? "false" : "true",
        },
      });

      if (!transactionsResponse.ok) {
        throw new Error("Failed to get transactions");
      }

      // Reset error details and retries if we successfully got the transactions
      await supabase
        .from("bank_accounts")
        .update({
          error_details: null,
          error_retries: null,
        })
        .eq("id", id);

      const { data: transactionsData } = await transactionsResponse.json();

      if (!transactionsData) {
        logger.info(`No transactions to upsert for account ${accountId}`);
        return;
      }

      // Upsert transactions in batches of 500
      // This is to avoid memory issues with the DB
      for (let i = 0; i < transactionsData.length; i += BATCH_SIZE) {
        const transactionBatch = transactionsData.slice(i, i + BATCH_SIZE);
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
