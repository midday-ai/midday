import { getDb } from "@jobs/init";
import { triggerMatchingNotification } from "@jobs/utils/inbox-matching-notifications";
import {
  calculateInboxSuggestions,
  getPendingInboxForMatching,
  updateInbox,
} from "@midday/db/queries";
import { findInboxMatches } from "@midday/db/queries";
import { logger, schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";

export const matchTransactionsBidirectional = schemaTask({
  id: "match-transactions-bidirectional",
  schema: z.object({
    teamId: z.string().uuid(),
    newTransactionIds: z.array(z.string().uuid()),
  }),
  maxDuration: 120,
  queue: { concurrencyLimit: 5 },
  run: async ({ teamId, newTransactionIds }) => {
    const db = getDb();

    logger.info("Starting bidirectional transaction matching", {
      teamId,
      newTransactionCount: newTransactionIds.length,
    });

    // PHASE 1: Forward matching - Find inbox items for new transactions
    const forwardMatches = new Map<string, string>(); // transactionId -> inboxId
    let forwardMatchCount = 0;
    let forwardSuggestionCount = 0;

    for (const transactionId of newTransactionIds) {
      try {
        const inboxMatch = await findInboxMatches(db, {
          teamId,
          transactionId,
        });

        if (inboxMatch) {
          forwardMatches.set(transactionId, inboxMatch.inboxId);

          // Determine if this should be auto-matched or suggested
          const shouldAutoMatch = inboxMatch.matchType === "auto_matched";

          if (shouldAutoMatch) {
            // Auto-match the transaction to inbox
            await updateInbox(db, {
              id: inboxMatch.inboxId,
              teamId,
              status: "done",
              transactionId: transactionId,
            });

            forwardMatchCount++;

            logger.info("Auto-matched transaction to inbox", {
              teamId,
              transactionId,
              inboxId: inboxMatch.inboxId,
              confidence: inboxMatch.confidenceScore,
            });

            // Send notification for auto-match
            await triggerMatchingNotification({
              db,
              teamId,
              inboxId: inboxMatch.inboxId,
              result: {
                action: "auto_matched",
                suggestion: {
                  transactionId,
                  confidenceScore: inboxMatch.confidenceScore,
                  matchType: "auto_matched",
                  amountScore: inboxMatch.amountScore,
                  currencyScore: inboxMatch.currencyScore,
                  dateScore: inboxMatch.dateScore,
                  embeddingScore: inboxMatch.embeddingScore,
                },
              },
            });
          } else {
            // Create suggestion for manual review
            forwardSuggestionCount++;

            logger.info("Created forward match suggestion", {
              teamId,
              transactionId,
              inboxId: inboxMatch.inboxId,
              confidence: inboxMatch.confidenceScore,
            });
          }
        }
      } catch (error) {
        logger.error("Failed to process forward match", {
          teamId,
          transactionId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // PHASE 2: Reverse matching - Find transactions for pending inbox items
    // Only process inbox items that weren't already matched in Phase 1
    const pendingInboxItems = await getPendingInboxForMatching(db, {
      teamId,
      limit: 50, // Reduced limit since we're processing more efficiently
    });

    // Filter out inbox items that were already matched in Phase 1
    const matchedInboxIds = new Set(forwardMatches.values());
    const unmatchedInboxItems = pendingInboxItems.filter(
      (item) => !matchedInboxIds.has(item.id),
    );

    logger.info("Processing reverse matching for unmatched inbox items", {
      teamId,
      totalPendingItems: pendingInboxItems.length,
      alreadyMatchedInPhase1: matchedInboxIds.size,
      toProcessInPhase2: unmatchedInboxItems.length,
    });

    let reverseMatchCount = 0;
    let reverseSuggestionCount = 0;
    let noMatchCount = 0;

    // Process inbox items in smaller batches for better performance
    const BATCH_SIZE = 10;
    for (let i = 0; i < unmatchedInboxItems.length; i += BATCH_SIZE) {
      const batch = unmatchedInboxItems.slice(i, i + BATCH_SIZE);

      await Promise.allSettled(
        batch.map(async (inboxItem) => {
          try {
            const result = await calculateInboxSuggestions(db, {
              teamId,
              inboxId: inboxItem.id,
            });

            // Send notifications based on matching result
            if (result.action !== "no_match_yet" && result.suggestion) {
              await triggerMatchingNotification({
                db,
                teamId,
                inboxId: inboxItem.id,
                result,
              });
            }

            switch (result.action) {
              case "auto_matched":
                reverseMatchCount++;
                logger.info("Auto-matched inbox item to transaction", {
                  teamId,
                  inboxId: inboxItem.id,
                  transactionId: result.suggestion?.transactionId,
                  confidence: result.suggestion?.confidenceScore,
                });
                break;

              case "suggestion_created":
                reverseSuggestionCount++;
                logger.info("Created reverse match suggestion", {
                  teamId,
                  inboxId: inboxItem.id,
                  transactionId: result.suggestion?.transactionId,
                  confidence: result.suggestion?.confidenceScore,
                });
                break;

              case "no_match_yet":
                noMatchCount++;
                break;
            }
          } catch (error) {
            logger.error("Failed to process reverse match", {
              teamId,
              inboxId: inboxItem.id,
              error: error instanceof Error ? error.message : "Unknown error",
            });
          }
        }),
      );
    }

    // Final summary
    const totalProcessed =
      newTransactionIds.length + unmatchedInboxItems.length;
    const totalMatched = forwardMatchCount + reverseMatchCount;
    const totalSuggestions = forwardSuggestionCount + reverseSuggestionCount;

    logger.info("Completed bidirectional transaction matching", {
      teamId,
      summary: {
        newTransactions: newTransactionIds.length,
        pendingInboxItems: unmatchedInboxItems.length,
        totalProcessed,
        forwardMatches: forwardMatchCount,
        reverseMatches: reverseMatchCount,
        totalAutoMatches: totalMatched,
        forwardSuggestions: forwardSuggestionCount,
        reverseSuggestions: reverseSuggestionCount,
        totalSuggestions,
        noMatches: noMatchCount,
      },
    });

    return {
      processed: totalProcessed,
      autoMatched: totalMatched,
      suggestions: totalSuggestions,
      noMatches: noMatchCount,
      forwardMatches: forwardMatchCount,
      reverseMatches: reverseMatchCount,
    };
  },
});
