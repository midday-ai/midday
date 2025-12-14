import {
  createSlackApp,
  createSlackWebClient,
  ensureBotInChannel,
} from "@midday/app-store/slack/server";
import { logger } from "@midday/logger";

/**
 * Returns the welcome message content for Slack
 */
export function getWelcomeMessage(isPrivateChannel = false) {
  const blocks: any[] = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "Hello there! 👋 I'm your new *Midday* bot. I'll send notifications about new transactions and receipt matches in this channel.",
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*Share receipts or invoices* in this channel by uploading files. I'll automatically extract the data and match them to your transactions.",
      },
    },
  ];

  // Add note for private channels
  if (isPrivateChannel) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: "⚠️ *Important:* This is a private channel. To enable full functionality, please invite the Midday bot to this channel by typing `/invite @Midday` or adding it through the channel settings.",
      },
    });
  }

  blocks.push({
    type: "actions",
    elements: [
      {
        type: "button",
        text: {
          type: "plain_text",
          text: "⚙️ Notification Settings",
          emoji: true,
        },
        url: "https://app.midday.ai/apps?app=slack&settings=true",
        action_id: "view_settings",
      },
    ],
  });

  return {
    unfurl_links: false,
    unfurl_media: false,
    blocks,
  };
}

/**
 * Sends a welcome message to Slack channel using bot API or webhook fallback
 */
export async function sendWelcomeMessage({
  channelId,
  accessToken,
  botUserId,
  webhookUrl,
}: {
  channelId: string;
  accessToken: string;
  botUserId: string;
  webhookUrl: string;
}): Promise<void> {
  // Check if channel is private (private channels start with "G", public with "C")
  const isPrivateChannel = channelId.startsWith("G");
  const welcomeMessage = getWelcomeMessage(isPrivateChannel);

  try {
    // Ensure bot is in channel before sending message (auto-joins public channels)
    const client = createSlackWebClient({ token: accessToken });
    await ensureBotInChannel({ client, channelId: channelId });

    // Try using bot API first (supports rich blocks and more features)
    const slackApp = createSlackApp({
      token: accessToken,
      botId: botUserId,
    });

    await slackApp.client.chat.postMessage({
      channel: channelId,
      ...welcomeMessage,
    });
  } catch (err: unknown) {
    // Check if error is due to channel access (e.g., private channel)
    const isChannelNotFound =
      err &&
      typeof err === "object" &&
      "data" in err &&
      err.data &&
      typeof err.data === "object" &&
      "error" in err.data &&
      err.data.error === "channel_not_found";

    if (isChannelNotFound) {
      // Fall back to webhook URL for private channels
      // Webhooks work without requiring bot invitation
      try {
        const response = await fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(welcomeMessage),
        });

        if (!response.ok) {
          throw new Error(`Webhook request failed: ${response.statusText}`);
        }
      } catch (webhookErr) {
        logger.warn("Failed to send welcome message via webhook", {
          error:
            webhookErr instanceof Error
              ? webhookErr.message
              : String(webhookErr),
          channelId,
        });
        // Don't throw - welcome message is non-critical
      }
    } else {
      // Log other errors but don't fail the OAuth flow
      logger.error("Failed to send welcome message to Slack", {
        error: err instanceof Error ? err.message : String(err),
        channelId,
      });
    }
  }
}
