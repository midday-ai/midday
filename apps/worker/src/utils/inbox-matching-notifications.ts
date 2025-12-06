import type { Database } from "@midday/db/client";
import {
  getInboxById,
  getTransactionById,
  hasSuggestion,
} from "@midday/db/queries";
import type { MatchResult } from "@midday/db/queries";
import { Notifications } from "@midday/notifications";

export async function triggerMatchingNotification(params: {
  db: Database;
  teamId: string;
  inboxId: string;
  result:
    | {
        action: "auto_matched";
        suggestion: MatchResult;
      }
    | {
        action: "suggestion_created";
        suggestion: MatchResult;
      };
}): Promise<void> {
  const { db, teamId, inboxId, result } = params;

  // Only send notifications if there's a suggestion
  if (!hasSuggestion(result)) {
    return;
  }

  try {
    // Get inbox and transaction details
    const [inboxItem, transactionItem] = await Promise.all([
      getInboxById(db, { id: inboxId, teamId }),
      getTransactionById(db, {
        id: result.suggestion.transactionId,
        teamId,
      }),
    ]);

    if (!inboxItem || !transactionItem) {
      console.warn("Missing data for notification", {
        hasInbox: !!inboxItem,
        hasTransaction: !!transactionItem,
      });
      return;
    }

    const documentName =
      inboxItem.displayName || inboxItem.fileName || "Document";
    const transactionName = transactionItem.name || "Transaction";

    // Check if this is a cross-currency match
    const isCrossCurrency = Boolean(
      inboxItem.currency &&
        transactionItem.currency &&
        inboxItem.currency !== transactionItem.currency,
    );

    const notifications = new Notifications(db);

    if (result.action === "auto_matched") {
      // Trigger auto-matched notification
      await notifications.create("inbox_auto_matched", teamId, {
        inboxId,
        transactionId: result.suggestion.transactionId,
        documentName,
        documentAmount: inboxItem.amount || 0,
        documentCurrency: inboxItem.currency || "USD",
        transactionAmount: transactionItem.amount || 0,
        transactionCurrency: transactionItem.currency || "USD",
        transactionName,
        confidenceScore: result.suggestion.confidenceScore,
        matchType: "auto_matched",
        isCrossCurrency,
      });
    } else if (result.action === "suggestion_created") {
      // All suggestions use inbox_needs_review, but with different matchType
      await notifications.create("inbox_needs_review", teamId, {
        inboxId,
        transactionId: result.suggestion.transactionId,
        documentName,
        documentAmount: inboxItem.amount || 0,
        documentCurrency: inboxItem.currency || "USD",
        transactionAmount: transactionItem.amount || 0,
        transactionCurrency: transactionItem.currency || "USD",
        transactionName,
        confidenceScore: result.suggestion.confidenceScore,
        matchType:
          result.suggestion.matchType === "high_confidence"
            ? "high_confidence"
            : "suggested",
        isCrossCurrency,
      });
    }
  } catch (error) {
    console.error("Failed to trigger matching notification", {
      teamId,
      inboxId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    // Don't throw - notifications shouldn't break the matching process
  }
}
