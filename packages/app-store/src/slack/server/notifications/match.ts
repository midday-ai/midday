import type { Database } from "@midday/db/client";
import { getAppByAppId } from "@midday/db/queries";
import { createLoggerWithContext } from "@midday/logger";
import { format } from "date-fns";
import { createSlackWebClient, ensureBotInChannel } from "../client";

const logger = createLoggerWithContext("slack:match-notification");

export type MatchNotificationParams = {
  teamId: string;
  inboxId: string;
  transactionId: string;
  documentName: string;
  documentAmount: number;
  documentCurrency: string;
  documentDate?: string;
  transactionName: string;
  transactionAmount: number;
  transactionCurrency: string;
  transactionDate?: string;
  confidenceScore: number;
  matchType: "auto_matched" | "high_confidence" | "suggested";
  slackChannelId: string;
  slackThreadTs?: string;
  db: Database;
};

export async function sendSlackMatchNotification({
  teamId,
  inboxId,
  transactionId,
  documentName,
  documentAmount,
  documentCurrency,
  documentDate,
  transactionName,
  transactionAmount,
  transactionCurrency,
  transactionDate,
  confidenceScore,
  matchType,
  slackChannelId,
  slackThreadTs,
  db,
}: MatchNotificationParams) {
  // Get Slack app config using Drizzle
  const slackApp = await getAppByAppId(db, {
    appId: "slack",
    teamId,
  });

  if (!slackApp?.config) {
    logger.debug("Slack app not found for team", { teamId });
    return;
  }

  const accessToken = slackApp.config.access_token;

  if (!accessToken) {
    logger.debug("Slack access token not found", { teamId });
    return;
  }

  const client = createSlackWebClient({
    token: accessToken,
  });

  // Ensure bot is in channel before sending message (auto-joins public channels)
  await ensureBotInChannel({ client, channelId: slackChannelId });

  const formattedTransactionAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: transactionCurrency,
  }).format(Math.abs(transactionAmount));

  const formattedDocumentAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: documentCurrency,
  }).format(documentAmount);

  const isAutoMatched = matchType === "auto_matched";
  const confidencePercentage = Math.round(confidenceScore * 100);

  // Format dates
  const formattedDocumentDate = documentDate
    ? format(new Date(documentDate), "MMM d, yyyy")
    : "N/A";
  const formattedTransactionDate = transactionDate
    ? format(new Date(transactionDate), "MMM d, yyyy")
    : "N/A";

  // Calculate amount difference for highlighting
  const amountDiff = Math.abs(
    Math.abs(documentAmount) - Math.abs(transactionAmount),
  );
  const amountDiffPercent =
    documentAmount !== 0
      ? Math.round((amountDiff / Math.abs(documentAmount)) * 100)
      : 0;
  const hasAmountDifference = amountDiff > 0.01; // More than 1 cent difference

  // Check date difference
  let dateDiffText = "";
  if (documentDate && transactionDate) {
    const docDate = new Date(documentDate);
    const transDate = new Date(transactionDate);
    const daysDiff = Math.abs(
      Math.floor(
        (transDate.getTime() - docDate.getTime()) / (1000 * 60 * 60 * 24),
      ),
    );
    if (daysDiff > 0) {
      dateDiffText = ` (${daysDiff} day${daysDiff > 1 ? "s" : ""} difference)`;
    }
  }

  try {
    if (isAutoMatched) {
      // Auto-matched: Just inform the user, no buttons needed
      await client.chat.postMessage({
        channel: slackChannelId,
        thread_ts: slackThreadTs,
        text: "Your receipt has been automatically matched to a transaction",
        unfurl_links: false,
        unfurl_media: false,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "*Auto-matched*\n\nYour document has been automatically linked to a transaction.",
            },
          },
          {
            type: "divider",
          },
          {
            type: "section",
            fields: [
              {
                type: "mrkdwn",
                text: `*Document*\n${documentName}\n${formattedDocumentAmount}\n${formattedDocumentDate}`,
              },
              {
                type: "mrkdwn",
                text: `*Transaction*\n${transactionName}\n${formattedTransactionAmount}\n${formattedTransactionDate}`,
              },
            ],
          },
          {
            type: "actions",
            elements: [
              {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "View transaction",
                  emoji: false,
                },
                url: `https://app.midday.ai/transactions?id=${encodeURIComponent(transactionId)}`,
                action_id: "view_transaction",
              },
            ],
          },
        ],
      });
    } else {
      // Suggestion: Show approve/decline buttons
      const matchLabel =
        matchType === "high_confidence"
          ? "High confidence match"
          : "Potential match";

      // Build comparison text highlighting differences
      let comparisonNote = "";
      if (hasAmountDifference || dateDiffText) {
        const differences: string[] = [];
        if (hasAmountDifference) {
          differences.push(
            `Amount differs by ${amountDiffPercent}% (${formattedDocumentAmount} vs ${formattedTransactionAmount})`,
          );
        }
        if (dateDiffText) {
          differences.push(`Date${dateDiffText}`);
        }
        if (differences.length > 0) {
          comparisonNote = `\n\n_Note: ${differences.join("; ")}_`;
        }
      }

      await client.chat.postMessage({
        channel: slackChannelId,
        thread_ts: slackThreadTs,
        text: `Found a ${matchLabel.toLowerCase()} for your receipt`,
        unfurl_links: false,
        unfurl_media: false,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*${matchLabel}*\n\nWe found a potential match for your document.${comparisonNote}`,
            },
          },
          {
            type: "divider",
          },
          {
            type: "section",
            fields: [
              {
                type: "mrkdwn",
                text: `*Document*\n${documentName}\n${formattedDocumentAmount}\n${formattedDocumentDate}`,
              },
              {
                type: "mrkdwn",
                text: `*Transaction*\n${transactionName}\n${formattedTransactionAmount}\n${formattedTransactionDate}`,
              },
            ],
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Match confidence:* ${confidencePercentage}%`,
            },
          },
          {
            type: "actions",
            elements: [
              {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "Approve",
                  emoji: false,
                },
                style: "primary",
                action_id: `approve_match_${inboxId}_${transactionId}`,
                value: JSON.stringify({ inboxId, transactionId, teamId }),
              },
              {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "Decline",
                  emoji: false,
                },
                style: "danger",
                action_id: `decline_match_${inboxId}_${transactionId}`,
                value: JSON.stringify({ inboxId, transactionId, teamId }),
              },
              {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "View in Midday",
                  emoji: false,
                },
                url: `https://app.midday.ai/inbox?id=${encodeURIComponent(inboxId)}`,
                action_id: "view_inbox",
              },
            ],
          },
        ],
      });
    }
  } catch (error) {
    logger.error("Failed to send Slack match notification", {
      error: error instanceof Error ? error.message : String(error),
      teamId,
      inboxId,
      transactionId,
    });
  }
}
