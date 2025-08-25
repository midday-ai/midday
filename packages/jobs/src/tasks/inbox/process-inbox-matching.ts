import { getDb } from "@jobs/init";
import { triggerMatchingNotification } from "@jobs/utils/inbox-matching-notifications";
import { calculateInboxSuggestions, updateInbox } from "@midday/db/queries";
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
    logger.info("Processing inbox matching", { teamId, inboxId });

    // Set status to analyzing at job level to ensure it's always set
    await updateInbox(getDb(), {
      id: inboxId,
      teamId,
      status: "analyzing",
    });

    try {
      const result = await calculateInboxSuggestions(getDb(), {
        teamId,
        inboxId,
      });

      console.log("result", result);

      // Send notifications based on matching result
      if (result.action !== "no_match_yet" && result.suggestion) {
        await triggerMatchingNotification({
          db: getDb(),
          teamId,
          inboxId,
          result,
        });
      }

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

      // Reset status to pending if matching fails
      try {
        await updateInbox(getDb(), {
          id: inboxId,
          teamId,
          status: "pending",
        });
      } catch (statusError) {
        logger.error("Failed to reset inbox status after error", {
          teamId,
          inboxId,
          statusError:
            statusError instanceof Error
              ? statusError.message
              : "Unknown error",
        });
      }

      throw error;
    }
  },
});
