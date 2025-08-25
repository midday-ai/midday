import { getDb } from "@jobs/init";
import { getPendingInboxForMatching } from "@midday/db/queries";
import { logger, schemaTask, tasks } from "@trigger.dev/sdk";
import { z } from "zod";

export const matchPendingInbox = schemaTask({
  id: "match-pending-inbox",
  schema: z.object({
    teamId: z.string().uuid(),
    newTransactionIds: z.array(z.string().uuid()),
  }),
  machine: "micro",
  maxDuration: 30,
  queue: { concurrencyLimit: 10 },
  run: async ({ teamId, newTransactionIds }) => {
    logger.info("Starting pending inbox matching", {
      teamId,
      newTransactionCount: newTransactionIds.length,
    });

    // Get pending inbox items that are available for matching
    // Since we have new transactions available, any pending item could potentially match
    const relevantPendingItems = await getPendingInboxForMatching(getDb(), {
      teamId,
      limit: 100, // Reasonable limit to prevent job overload
    });

    logger.info("Found pending inbox items to recheck", {
      teamId,
      newTransactionCount: newTransactionIds.length,
      pendingItemsToCheck: relevantPendingItems.length,
    });

    // Batch trigger calculate-suggestions jobs for all pending items
    if (relevantPendingItems.length > 0) {
      const batchJobs = relevantPendingItems.map((inboxItem) => ({
        payload: {
          teamId,
          inboxId: inboxItem.id,
        },
      }));

      await tasks.batchTrigger("process-inbox-matching", batchJobs);

      logger.info("Batch triggered inbox matching jobs", {
        teamId,
        newTransactionCount: newTransactionIds.length,
        batchSize: batchJobs.length,
      });
    }

    logger.info("Completed pending inbox matching", {
      teamId,
      newTransactionCount: newTransactionIds.length,
      pendingItemsTriggered: relevantPendingItems.length,
    });
  },
});
