import {
  calculateInboxSuggestions,
  findInboxMatches,
  getPendingInboxForMatching,
  getTransactionById,
  hasSuggestion,
  matchTransaction,
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

    this.logger.info(
      {
        teamId,
        newTransactionCount: newTransactionIds.length,
      },
      "Starting bidirectional transaction matching",
    );

    await this.updateProgress(job, 0);

    // PHASE 1: Forward matching - Find inbox items for new transactions
    const forwardMatches = new Map<string, string>(); // transactionId -> inboxId
    let forwardMatchCount = 0;
    let forwardSuggestionCount = 0;

    const phase1Progress = 40; // 40% for phase 1

    for (let i = 0; i < newTransactionIds.length; i++) {
      const transactionId = newTransactionIds[i];
      if (!transactionId) continue;

      const progress = Math.round(
        (i / newTransactionIds.length) * phase1Progress,
      );
      await this.updateProgress(job, progress);

      try {
        const inboxMatch = await findInboxMatches(db, {
          teamId,
          transactionId,
        });

        if (inboxMatch) {
          forwardMatches.set(transactionId, inboxMatch.inboxId);

          // Determine if this should be auto-matched or suggested
          const shouldAutoMatch = inboxMatch.matchType === "auto_matched";

          if (shouldAutoMatch && transactionId) {
            // Auto-match the transaction to inbox
            await matchTransaction(db, {
              id: inboxMatch.inboxId,
              teamId,
              transactionId,
            });

            forwardMatchCount++;

            this.logger.info(
              {
                teamId,
                transactionId,
                inboxId: inboxMatch.inboxId,
                confidence: inboxMatch.confidenceScore,
              },
              "Auto-matched transaction to inbox",
            );

            // Send notification for auto-match
            // Get transaction data to create complete MatchResult
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
            // Create suggestion for manual review
            forwardSuggestionCount++;

            this.logger.info(
              {
                teamId,
                transactionId,
                inboxId: inboxMatch.inboxId,
                confidence: inboxMatch.confidenceScore,
              },
              "Created forward match suggestion",
            );
          }
        }
      } catch (error) {
        this.logger.error(
          {
            teamId,
            transactionId,
            error: error instanceof Error ? error.message : "Unknown error",
          },
          "Failed to process forward match",
        );
      }
    }

    await this.updateProgress(job, phase1Progress);

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

    this.logger.info(
      {
        teamId,
        totalPendingItems: pendingInboxItems.length,
        alreadyMatchedInPhase1: matchedInboxIds.size,
        toProcessInPhase2: unmatchedInboxItems.length,
      },
      "Processing reverse matching for unmatched inbox items",
    );

    let reverseMatchCount = 0;
    let reverseSuggestionCount = 0;
    let noMatchCount = 0;

    // Process inbox items in smaller batches for better performance
    const BATCH_SIZE = 10;
    const phase2StartProgress = phase1Progress;
    const phase2ProgressRange = 60; // 60% for phase 2

    for (let i = 0; i < unmatchedInboxItems.length; i += BATCH_SIZE) {
      const batch = unmatchedInboxItems.slice(i, i + BATCH_SIZE);
      const batchIndex = Math.floor(i / BATCH_SIZE);
      const totalBatches = Math.ceil(unmatchedInboxItems.length / BATCH_SIZE);
      const progress =
        phase2StartProgress +
        Math.round(((batchIndex + 1) / totalBatches) * phase2ProgressRange);
      await this.updateProgress(job, progress);

      await Promise.allSettled(
        batch.map(async (inboxItem) => {
          try {
            const result = await calculateInboxSuggestions(db, {
              teamId,
              inboxId: inboxItem.id,
            });

            // Send notifications based on matching result
            if (hasSuggestion(result)) {
              // Type guard narrows the type here
              const resultWithSuggestion = result;
              await triggerMatchingNotification({
                db,
                teamId,
                inboxId: inboxItem.id,
                result: resultWithSuggestion,
              });
            }

            switch (result.action) {
              case "auto_matched":
                reverseMatchCount++;
                this.logger.info(
                  {
                    teamId,
                    inboxId: inboxItem.id,
                    transactionId: result.suggestion?.transactionId,
                    confidence: result.suggestion?.confidenceScore,
                  },
                  "Auto-matched inbox item to transaction",
                );
                break;

              case "suggestion_created":
                reverseSuggestionCount++;
                this.logger.info(
                  {
                    teamId,
                    inboxId: inboxItem.id,
                    transactionId: result.suggestion?.transactionId,
                    confidence: result.suggestion?.confidenceScore,
                  },
                  "Created reverse match suggestion",
                );
                break;

              case "no_match_yet":
                noMatchCount++;
                break;
            }
          } catch (error) {
            this.logger.error(
              {
                teamId,
                inboxId: inboxItem.id,
                error: error instanceof Error ? error.message : "Unknown error",
              },
              "Failed to process reverse match",
            );
          }
        }),
      );
    }

    await this.updateProgress(job, 100);

    // Final summary
    const totalProcessed =
      newTransactionIds.length + unmatchedInboxItems.length;
    const totalMatched = forwardMatchCount + reverseMatchCount;
    const totalSuggestions = forwardSuggestionCount + reverseSuggestionCount;

    this.logger.info(
      {
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
      },
      "Completed bidirectional transaction matching",
    );

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
