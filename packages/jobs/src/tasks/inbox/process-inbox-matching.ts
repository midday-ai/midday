import { getDb } from "@jobs/init";
import { calculateInboxSuggestions } from "@midday/db/queries";
import { logger, schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";

export const processInboxMatching = schemaTask({
  id: "process-inbox-matching",
  schema: z.object({
    teamId: z.string().uuid(),
    inboxId: z.string().uuid(),
  }),
  machine: "micro",
  maxDuration: 30,
  queue: { concurrencyLimit: 20 },
  run: async ({ teamId, inboxId }) => {
    const db = getDb();

    logger.info("Processing inbox matching", { teamId, inboxId });

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
      logger.error("Failed to process inbox matching", {
        teamId,
        inboxId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  },
});
