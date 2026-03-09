import { getDb } from "@jobs/init";
import { triggerMatchingNotification } from "@jobs/utils/inbox-matching-notifications";
import {
  calculateInboxSuggestions,
  findInboxMatches,
  getInboxById,
  getPendingInboxForMatching,
  getTransactionById,
  hasSuggestion,
  persistInboxSuggestionWorkflow,
  shouldResetInboxToPendingAfterSuggestionFailure,
  updateInbox,
} from "@midday/db/queries";
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
    const forwardMatches = new Map<string, string>();
    const claimedInboxIds = new Set<string>();
    let forwardMatchCount = 0;
    let forwardSuggestionCount = 0;

    for (const transactionId of newTransactionIds) {
      let processingInboxId: string | null = null;
      let workflowPersisted = false;

      try {
        const inboxMatch = await findInboxMatches(db, {
          teamId,
          transactionId,
          excludeInboxIds: claimedInboxIds,
        });

        if (inboxMatch) {
          processingInboxId = inboxMatch.inboxId;
          forwardMatches.set(transactionId, inboxMatch.inboxId);
          claimedInboxIds.add(inboxMatch.inboxId);

          await updateInbox(db, {
            id: inboxMatch.inboxId,
            teamId,
            status: "analyzing",
          });

          const { action } = await persistInboxSuggestionWorkflow(db, {
            teamId,
            inboxId: inboxMatch.inboxId,
            candidate: {
              transactionId,
              confidenceScore: inboxMatch.confidenceScore,
              amountScore: inboxMatch.amountScore,
              currencyScore: inboxMatch.currencyScore,
              dateScore: inboxMatch.dateScore,
              nameScore: inboxMatch.nameScore,
              matchType: inboxMatch.matchType,
            },
            source: "forward_match",
          });

          workflowPersisted = true;

          if (action === "auto_matched") {
            forwardMatchCount++;

            logger.info("Auto-matched transaction to inbox", {
              teamId,
              transactionId,
              inboxId: inboxMatch.inboxId,
              confidence: inboxMatch.confidenceScore,
            });
          } else {
            forwardSuggestionCount++;

            logger.info("Created forward match suggestion", {
              teamId,
              transactionId,
              inboxId: inboxMatch.inboxId,
              confidence: inboxMatch.confidenceScore,
            });
          }

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
                action,
                suggestion: {
                  transactionId,
                  name: transaction.name,
                  amount: transaction.amount,
                  currency: transaction.currency,
                  date: transaction.date,
                  confidenceScore: inboxMatch.confidenceScore,
                  matchType:
                    action === "auto_matched"
                      ? "auto_matched"
                      : inboxMatch.matchType,
                  amountScore: inboxMatch.amountScore,
                  currencyScore: inboxMatch.currencyScore,
                  dateScore: inboxMatch.dateScore,
                  nameScore: inboxMatch.nameScore,
                  isAlreadyMatched: false,
                },
              },
            });
          }
        }
      } catch (error) {
        forwardMatches.delete(transactionId);
        if (processingInboxId) {
          claimedInboxIds.delete(processingInboxId);
        }

        if (processingInboxId && !workflowPersisted) {
          try {
            const inboxState = await getInboxById(db, {
              id: processingInboxId,
              teamId,
            });

            if (
              shouldResetInboxToPendingAfterSuggestionFailure(
                inboxState
                  ? {
                      status: inboxState.status,
                      transactionId: inboxState.transactionId,
                    }
                  : null,
              )
            ) {
              await updateInbox(db, {
                id: processingInboxId,
                teamId,
                status: "pending",
              });
            }
          } catch (rollbackError) {
            logger.error(
              "Failed to reset inbox status after forward match error",
              {
                teamId,
                transactionId,
                inboxId: processingInboxId,
                error:
                  rollbackError instanceof Error
                    ? rollbackError.message
                    : "Unknown error",
              },
            );
          }
        }

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
      limit: 20,
    });

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

    const claimedTransactionIds = new Set<string>();

    for (const inboxItem of unmatchedInboxItems) {
      try {
        const result = await calculateInboxSuggestions(db, {
          teamId,
          inboxId: inboxItem.id,
          excludeTransactionIds: claimedTransactionIds,
        });

        if (hasSuggestion(result)) {
          claimedTransactionIds.add(result.suggestion.transactionId);
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
    }

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
