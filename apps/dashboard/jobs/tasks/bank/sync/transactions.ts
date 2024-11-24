import { client } from "@midday/engine/client";
import { logger, schemaTask } from "@trigger.dev/sdk/v3";
import { parseAPIError } from "jobs/utils/parse-error";
import { getClassification } from "jobs/utils/transform";
import { z } from "zod";
import { upsertTransactions } from "../transactions/upsert";

const BATCH_SIZE = 500;

export const syncTransactions = schemaTask({
  id: "sync-transactions",
  retry: {
    maxAttempts: 2,
  },
  schema: z.object({
    teamId: z.string().uuid(),
    accountId: z.string(),
    accountType: z.enum([
      "credit",
      "other_asset",
      "other_liability",
      "depository",
      "loan",
    ]),
    accessToken: z.string().optional(),
    provider: z.enum(["gocardless", "plaid", "teller"]),
    manualSync: z.boolean().optional(),
  }),
  run: async ({
    teamId,
    accountId,
    accountType,
    accessToken,
    provider,
    manualSync,
  }) => {
    const classification = getClassification(accountType);

    logger.info(`Syncing transactions for account ${accountId}`, {
      classification,
    });

    try {
      const transactionsResponse = await client.transactions.$get({
        query: {
          provider,
          accountId,
          accountType: classification,
          accessToken,
          latest: true,
        },
      });

      if (!transactionsResponse.ok) {
        throw new Error("Failed to get transactions");
      }

      const { data: transactionsData } = await transactionsResponse.json();

      if (!transactionsData) {
        logger.info(`No transactions to upsert for account ${accountId}`);
        return;
      }

      // Upsert transactions in batches of 500
      // This is to avoid memory issues with the DB
      // Also the task has a queue limit of 10
      for (let i = 0; i < transactionsData.length; i += BATCH_SIZE) {
        const transactionBatch = transactionsData.slice(i, i + BATCH_SIZE);
        await upsertTransactions.trigger({
          transactions: transactionBatch,
          teamId,
          bankAccountId: accountId,
          manualSync: Boolean(manualSync),
        });
      }
    } catch (error) {
      const parsedError = parseAPIError(error);
      // TODO: Handle error (disconnect, expired, etc.)

      logger.error("Failed to sync transactions", {
        error: parsedError,
      });

      throw error;
    }
  },
});
