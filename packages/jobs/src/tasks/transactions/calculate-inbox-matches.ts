import { getDb } from "@jobs/init";
import { calculateTransactionSuggestions } from "@midday/db/queries/inbox-matching";
import { logger, schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";

export const calculateInboxMatches = schemaTask({
  id: "calculate-inbox-matches",
  schema: z.object({
    teamId: z.string().uuid(),
    transactionId: z.string().uuid(),
  }),
  machine: "micro",
  maxDuration: 30,
  queue: { concurrencyLimit: 20 },
  run: async ({ teamId, transactionId }) => {
    const db = getDb();

    logger.info("Calculating inbox matches for transaction", {
      teamId,
      transactionId,
    });

    try {
      const result = await calculateTransactionSuggestions(db, {
        teamId,
        transactionId,
      });

      switch (result.action) {
        case "auto_matched":
          logger.info("Auto-matched transaction to inbox item", {
            teamId,
            transactionId,
            inboxId: result.suggestion?.inboxId,
            confidence: result.suggestion?.confidenceScore,
          });
          break;

        case "suggestion_created":
          logger.info("Created inbox match suggestion for transaction", {
            teamId,
            transactionId,
            inboxId: result.suggestion?.inboxId,
            confidence: result.suggestion?.confidenceScore,
            matchType: result.suggestion?.matchType,
          });
          break;

        case "no_match":
          logger.info("No suitable inbox match found for transaction", {
            teamId,
            transactionId,
          });
          break;
      }

      return result;
    } catch (error) {
      logger.error("Failed to calculate inbox matches", {
        teamId,
        transactionId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  },
});
