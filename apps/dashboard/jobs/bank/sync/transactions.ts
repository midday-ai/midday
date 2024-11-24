import { client } from "@midday/engine/client";
import { createClient } from "@midday/supabase/job";
import { logger, schemaTask } from "@trigger.dev/sdk/v3";
import { parseAPIError } from "jobs/utils/parse-error";
import { z } from "zod";
import { getClassification, transformTransaction } from "../../utils/transform";

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
    manual: z.boolean().optional(),
  }),
  run: async ({
    teamId,
    accountId,
    accountType,
    accessToken,
    provider,
    manual,
  }) => {
    const supabase = createClient();

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
          // TODO: Fix boolean type (check invoice preview)
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

      // Transform transactions to match our DB schema
      const formattedTransactions = transactionsData.map((transaction) => {
        return transformTransaction({
          transaction,
          teamId,
          bankAccountId: accountId,
        });
      });

      // Upsert transactions, ignoring duplicates based on internal_id
      await supabase.from("transactions").upsert(formattedTransactions, {
        onConflict: "internal_id",
        ignoreDuplicates: true,
      });
    } catch (error) {
      const parsedError = parseAPIError(error);
      // TODO: Handle error (disconnect, expired, etc.)

      throw error;
    }
  },
});
