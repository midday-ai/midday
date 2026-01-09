import { getAppByAppId } from "@midday/db/queries";
import { getWorkerDb } from "@midday/db/worker-client";
import { createLoggerWithContext } from "@midday/logger";
import { format, parseISO } from "date-fns";
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
  matchType: "auto_matched" | "high_confidence" | "suggested";
  slackChannelId: string;
  slackThreadTs?: string;
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
  matchType,
  slackChannelId,
  slackThreadTs,
}: MatchNotificationParams) {
  const db = getWorkerDb();

  const slackApp = await getAppByAppId(db, {
    appId: "slack",
    teamId,
  });

  if (!slackApp?.config) {
    logger.debug("Slack app not found for team", { teamId });
    return;
  }

  const config = slackApp.config as {
    access_token?: string;
    channel_id?: string;
    team_id?: string;
    team_name?: string;
  };

  const accessToken = config.access_token;

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

  // Format dates
  const formattedDocumentDate = documentDate
    ? format(parseISO(documentDate), "MMM d, yyyy")
    : "N/A";
  const formattedTransactionDate = transactionDate
    ? format(parseISO(transactionDate), "MMM d, yyyy")
    : "N/A";

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
      await client.chat.postMessage({
        channel: slackChannelId,
        thread_ts: slackThreadTs,
        text: "Found a match for your receipt",
        unfurl_links: false,
        unfurl_media: false,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "*Match found*\n\nWe found a potential match for your document.",
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
                url: `https://app.midday.ai/inbox?inboxId=${encodeURIComponent(inboxId)}`,
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
