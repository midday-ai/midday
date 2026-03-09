import type { Database } from "@midday/db/client";
import type { MatchResult } from "@midday/db/queries";
import {
  getInboxById,
  getTransactionById,
  hasSuggestion,
} from "@midday/db/queries";
import { createLoggerWithContext } from "@midday/logger";
import { Notifications } from "@midday/notifications";
import { sendToProviders } from "./provider-notifications";

const logger = createLoggerWithContext("inbox-matching-notifications");

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
      logger.warn("Missing data for notification", {
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

    // Build common payload for both notification types
    const matchPayload = {
      inboxId,
      transactionId: result.suggestion.transactionId,
      documentName,
      documentAmount: inboxItem.amount || 0,
      documentCurrency: inboxItem.currency || "USD",
      transactionAmount: transactionItem.amount || 0,
      transactionCurrency: transactionItem.currency || "USD",
      transactionName,
      confidenceScore: result.suggestion.confidenceScore,
      isCrossCurrency,
    };

    // Get inbox metadata for provider-specific channel info
    const inboxMeta = inboxItem.meta as
      | {
          source?: string;
          sourceMetadata?: {
            channelId?: string;
            threadTs?: string;
            messageTs?: string;
            phoneNumber?: string;
          };
        }
      | undefined;

    if (result.action === "auto_matched") {
      // Trigger auto-matched notification
      await notifications.create("inbox_auto_matched", teamId, {
        ...matchPayload,
        matchType: "auto_matched",
      });

      // Send to external providers (Slack)
      await sendToProviders(
        db,
        teamId,
        "match",
        {
          ...matchPayload,
          matchType: "auto_matched" as const,
        },
        { inboxMeta },
      );
    } else if (result.action === "suggestion_created") {
      const matchType =
        result.suggestion.matchType === "high_confidence"
          ? "high_confidence"
          : "suggested";

      // All suggestions use inbox_needs_review, but with different matchType
      await notifications.create("inbox_needs_review", teamId, {
        ...matchPayload,
        matchType,
      });

      // Send to external providers (Slack)
      await sendToProviders(
        db,
        teamId,
        "match",
        {
          ...matchPayload,
          matchType: matchType as "high_confidence" | "suggested",
        },
        { inboxMeta },
      );
    }
  } catch (error) {
    logger.error("Failed to trigger matching notification", {
      teamId,
      inboxId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    // Don't throw - notifications shouldn't break the matching process
  }
}
