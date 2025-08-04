import { getDb } from "@jobs/init";
import { calculateInboxSuggestions } from "@midday/db/queries/inbox-matching";
import { logger, schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";

export const calculateSuggestions = schemaTask({
  id: "calculate-suggestions",
  schema: z.object({
    teamId: z.string().uuid(),
    inboxId: z.string().uuid(),
  }),
  machine: "micro",
  maxDuration: 30,
  queue: { concurrencyLimit: 20 },
  run: async ({ teamId, inboxId }) => {
    const db = getDb();

    logger.info("Calculating match suggestions", { teamId, inboxId });

    try {
      const result = await calculateInboxSuggestions(db, { teamId, inboxId });

      switch (result.action) {
        case "auto_matched":
          logger.info("Auto-matched inbox item", {
            teamId,
            inboxId,
            transactionId: result.suggestion?.transactionId,
            confidence: result.suggestion?.confidenceScore,
          });
          break;

        case "suggestion_created":
          logger.info("Created match suggestion", {
            teamId,
            inboxId,
            transactionId: result.suggestion?.transactionId,
            confidence: result.suggestion?.confidenceScore,
            matchType: result.suggestion?.matchType,
          });
          break;

        case "no_match_yet":
          logger.info(
            "No suitable match found yet - will retry when new transactions arrive",
            { teamId, inboxId },
          );
          break;
      }

      return result;
    } catch (error) {
      logger.error("Failed to calculate suggestions", {
        teamId,
        inboxId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  },
});
