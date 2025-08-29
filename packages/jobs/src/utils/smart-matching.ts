import { getDb } from "@jobs/init";
import { getPendingInboxForMatching } from "@midday/db/queries";
import { tasks } from "@trigger.dev/sdk";

/**
 * Smart matching utility that chooses the most efficient approach based on workload
 */
export async function triggerSmartMatching(params: {
  teamId: string;
  newTransactionIds?: string[];
  specificInboxIds?: string[];
}) {
  const { teamId, newTransactionIds, specificInboxIds } = params;

  // If we have specific inbox IDs, process them directly
  if (specificInboxIds && specificInboxIds.length > 0) {
    if (specificInboxIds.length <= 10) {
      // Small batch - use batch processing
      await tasks.trigger("batch-process-matching", {
        teamId,
        inboxIds: specificInboxIds,
      });
    } else {
      // Large batch - split into multiple batch jobs
      const BATCH_SIZE = 10;
      const batches = [];
      for (let i = 0; i < specificInboxIds.length; i += BATCH_SIZE) {
        batches.push(specificInboxIds.slice(i, i + BATCH_SIZE));
      }

      await Promise.all(
        batches.map((batch) =>
          tasks.trigger("batch-process-matching", {
            teamId,
            inboxIds: batch,
          }),
        ),
      );
    }
    return;
  }

  // If we have new transactions, use bidirectional matching
  if (newTransactionIds && newTransactionIds.length > 0) {
    await tasks.trigger("match-transactions-bidirectional", {
      teamId,
      newTransactionIds,
    });
    return;
  }

  // Fallback: check pending items and decide approach
  const pendingItems = await getPendingInboxForMatching(getDb(), {
    teamId,
    limit: 50,
  });

  if (pendingItems.length === 0) {
    return; // Nothing to process
  }

  // Always use batch processing for consistency
  await tasks.trigger("batch-process-matching", {
    teamId,
    inboxIds: pendingItems.map((item) => item.id),
  });
}
