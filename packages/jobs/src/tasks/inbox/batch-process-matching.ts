import { getDb } from "@jobs/init";
import { triggerMatchingNotification } from "@jobs/utils/inbox-matching-notifications";
import { calculateInboxSuggestions, hasSuggestion } from "@midday/db/queries";
import { logger, schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";

export const batchProcessMatching = schemaTask({
  id: "batch-process-matching",
  schema: z.object({
    teamId: z.string().uuid(),
    inboxIds: z.array(z.string().uuid()),
  }),
  machine: "micro",
  maxDuration: 180,
  queue: { concurrencyLimit: 3 },
  run: async ({ teamId, inboxIds }) => {
    const db = getDb();

    logger.info("Starting batch inbox matching", {
      teamId,
      inboxCount: inboxIds.length,
    });

    let autoMatchCount = 0;
    let suggestionCount = 0;
    let noMatchCount = 0;
    let errorCount = 0;

    const BATCH_SIZE = 5;
    for (let i = 0; i < inboxIds.length; i += BATCH_SIZE) {
      const batch = inboxIds.slice(i, i + BATCH_SIZE);

      const results = await Promise.allSettled(
        batch.map(async (inboxId) => {
          try {
            const result = await calculateInboxSuggestions(db, {
              teamId,
              inboxId,
            });

            if (hasSuggestion(result)) {
              await triggerMatchingNotification({
                db,
                teamId,
                inboxId,
                result,
              });
            }

            switch (result.action) {
              case "auto_matched":
                autoMatchCount++;
                logger.info("Auto-matched inbox item", {
                  teamId,
                  inboxId,
                  transactionId: result.suggestion?.transactionId,
                  confidence: result.suggestion?.confidenceScore,
                });
                break;

              case "suggestion_created":
                suggestionCount++;
                logger.info("Created match suggestion", {
                  teamId,
                  inboxId,
                  transactionId: result.suggestion?.transactionId,
                  confidence: result.suggestion?.confidenceScore,
                });
                break;

              case "no_match_yet":
                noMatchCount++;
                break;
            }

            return result;
          } catch (error) {
            errorCount++;
            logger.error("Failed to process inbox matching", {
              teamId,
              inboxId,
              error: error instanceof Error ? error.message : "Unknown error",
            });
            throw error;
          }
        }),
      );

      const batchErrors = results.filter((r) => r.status === "rejected").length;
      logger.info("Completed batch processing", {
        teamId,
        batchIndex: Math.floor(i / BATCH_SIZE) + 1,
        batchSize: batch.length,
        errors: batchErrors,
      });
    }

    logger.info("Completed batch inbox matching", {
      teamId,
      summary: {
        totalProcessed: inboxIds.length,
        autoMatches: autoMatchCount,
        suggestions: suggestionCount,
        noMatches: noMatchCount,
        errors: errorCount,
      },
    });

    return {
      processed: inboxIds.length,
      autoMatched: autoMatchCount,
      suggestions: suggestionCount,
      noMatches: noMatchCount,
      errors: errorCount,
    };
  },
});
