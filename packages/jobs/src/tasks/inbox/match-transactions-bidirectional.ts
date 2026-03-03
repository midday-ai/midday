import { getDb } from "@jobs/init";
import { triggerMatchingNotification } from "@jobs/utils/inbox-matching-notifications";
import {
  calculateInboxSuggestions,
  findInboxMatches,
  getPendingInboxForMatching,
  getTransactionById,
  hasSuggestion,
  matchTransaction,
} from "@midday/db/queries";
import { logger, schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";

const BATCH_SIZE = 10;

/**
 * Temporary bridge: kept alive for the Trigger.dev embed-transaction chain
 * until bank transaction tasks are also migrated to the worker.
 * The worker has its own equivalent at apps/worker/src/processors/inbox/match-transactions-bidirectional.ts
 */
export const matchTransactionsBidirectional = schemaTask({
  id: "match-transactions-bidirectional",
  schema: z.object({
    teamId: z.string().uuid(),
    newTransactionIds: z.array(z.string().uuid()),
  }),
  maxDuration: 120,
  queue: {
    concurrencyLimit: 5,
  },
  run: async ({ teamId, newTransactionIds }) => {
    const db = getDb();

    logger.info("Starting bidirectional transaction matching", {
      teamId,
      newTransactionCount: newTransactionIds.length,
    });

    let forwardMatchCount = 0;
    let forwardSuggestionCount = 0;
    const forwardMatchedInboxIds = new Set<string>();

    // PHASE 1: Forward matching - Find inbox items for new transactions
    for (const transactionId of newTransactionIds) {
      try {
        const inboxMatch = await findInboxMatches(db, {
          teamId,
          transactionId,
        });

        if (inboxMatch) {
          forwardMatchedInboxIds.add(inboxMatch.inboxId);
          const shouldAutoMatch = inboxMatch.matchType === "auto_matched";

          if (shouldAutoMatch) {
            await matchTransaction(db, {
              id: inboxMatch.inboxId,
              teamId,
              transactionId,
            });
            forwardMatchCount++;

            const transaction = await getTransactionById(db, {
              id: transactionId,
              teamId,
            });

            if (transaction) {
              await triggerMatchingNotification({
                db,
                teamId,
                inboxId: inboxMatch.inboxId,
                result: {
                  action: "auto_matched",
                  suggestion: {
                    transactionId,
                    name: transaction.name,
                    amount: transaction.amount,
                    currency: transaction.currency,
                    date: transaction.date,
                    confidenceScore: inboxMatch.confidenceScore,
                    matchType: "auto_matched",
                    amountScore: inboxMatch.amountScore,
                    currencyScore: inboxMatch.currencyScore,
                    dateScore: inboxMatch.dateScore,
                    embeddingScore: inboxMatch.embeddingScore,
                    isAlreadyMatched: false,
                  },
                },
              });
            }
          } else {
            forwardSuggestionCount++;
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
    const pendingInboxItems = await getPendingInboxForMatching(db, {
      teamId,
      limit: 50,
    });

    const unmatchedInboxItems = pendingInboxItems.filter(
      (item) => !forwardMatchedInboxIds.has(item.id),
    );

    let reverseMatchCount = 0;
    let reverseSuggestionCount = 0;
    let noMatchCount = 0;

    for (let i = 0; i < unmatchedInboxItems.length; i += BATCH_SIZE) {
      const batch = unmatchedInboxItems.slice(i, i + BATCH_SIZE);

      await Promise.allSettled(
        batch.map(async (inboxItem) => {
          try {
            const result = await calculateInboxSuggestions(db, {
              teamId,
              inboxId: inboxItem.id,
            });

            if (hasSuggestion(result)) {
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
                break;
              case "suggestion_created":
                reverseSuggestionCount++;
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

    logger.info("Completed bidirectional transaction matching", {
      teamId,
      forwardMatches: forwardMatchCount,
      forwardSuggestions: forwardSuggestionCount,
      reverseMatches: reverseMatchCount,
      reverseSuggestions: reverseSuggestionCount,
      noMatches: noMatchCount,
    });
  },
});
