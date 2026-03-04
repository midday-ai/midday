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
import type { Job } from "bullmq";
import type { MatchTransactionsBidirectionalPayload } from "../../schemas/inbox";
import { getDb } from "../../utils/db";
import { triggerMatchingNotification } from "../../utils/inbox-matching-notifications";
import { BaseProcessor } from "../base";

export class MatchTransactionsBidirectionalProcessor extends BaseProcessor<MatchTransactionsBidirectionalPayload> {
  async process(job: Job<MatchTransactionsBidirectionalPayload>): Promise<{
    processed: number;
    autoMatched: number;
    suggestions: number;
    noMatches: number;
    forwardMatches: number;
    reverseMatches: number;
  }> {
    const { teamId, newTransactionIds } = job.data;
    const db = getDb();

    this.logger.info("Starting bidirectional transaction matching", {
      teamId,
      newTransactionCount: newTransactionIds.length,
    });

    // PHASE 1: Forward matching - Find inbox items for new transactions
    const forwardMatches = new Map<string, string>(); // transactionId -> inboxId
    const claimedInboxIds = new Set<string>();
    let forwardMatchCount = 0;
    let forwardSuggestionCount = 0;

    for (let i = 0; i < newTransactionIds.length; i++) {
      const transactionId = newTransactionIds[i];
      if (!transactionId) continue;
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

          this.logger.info("Persisted inbox suggestion workflow", {
            teamId,
            transactionId,
            inboxId: inboxMatch.inboxId,
            action,
          });

          workflowPersisted = true;

          if (action === "auto_matched") {
            forwardMatchCount++;

            this.logger.info("Auto-matched transaction to inbox", {
              teamId,
              transactionId,
              inboxId: inboxMatch.inboxId,
              confidence: inboxMatch.confidenceScore,
            });
          } else {
            forwardSuggestionCount++;

            this.logger.info("Created forward match suggestion", {
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
        // Only release the in-memory claim when the DB workflow was NOT persisted.
        // If workflowPersisted is true the match/suggestion is committed — releasing
        // the claim would let Phase 2 reprocess an already-matched inbox item.
        if (!workflowPersisted) {
          forwardMatches.delete(transactionId);
          if (processingInboxId) {
            claimedInboxIds.delete(processingInboxId);
          }
        }

        // If persistence did not complete, avoid leaving the inbox stuck in "analyzing".
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
            this.logger.error(
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

        this.logger.error("Failed to process forward match", {
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
      limit: 50,
    });

    // Filter out inbox items that were already matched in Phase 1
    const matchedInboxIds = new Set(forwardMatches.values());
    const unmatchedInboxItems = pendingInboxItems.filter(
      (item) => !matchedInboxIds.has(item.id),
    );

    this.logger.info("Processing reverse matching for unmatched inbox items", {
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
            this.logger.info("Auto-matched inbox item to transaction", {
              teamId,
              inboxId: inboxItem.id,
              transactionId: result.suggestion?.transactionId,
              confidence: result.suggestion?.confidenceScore,
            });
            break;

          case "suggestion_created":
            reverseSuggestionCount++;
            this.logger.info("Created reverse match suggestion", {
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
        this.logger.error("Failed to process reverse match", {
          teamId,
          inboxId: inboxItem.id,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Final summary
    const totalProcessed =
      newTransactionIds.length + unmatchedInboxItems.length;
    const totalMatched = forwardMatchCount + reverseMatchCount;
    const totalSuggestions = forwardSuggestionCount + reverseSuggestionCount;

    this.logger.info("Completed bidirectional transaction matching", {
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
  }
}
