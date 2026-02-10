import type { Database } from "@midday/db/client";
import { getTeamById } from "@midday/db/queries";
import { logger } from "@midday/logger";
import type { WebClient } from "@slack/web-api";

export async function publishAppHome({
  client,
  userId,
  db,
  teamId,
  slackApp,
}: {
  client: WebClient;
  userId: string;
  db: Database;
  teamId: string;
  slackApp: {
    config: any;
    settings?: any;
  };
}) {
  try {
    const _team = await getTeamById(db, teamId);
    const config = slackApp.config || {};
    const settings = slackApp.settings || {};

    // Get notification channel info
    const channelId = config.channel_id;
    let channelName = "Not configured";

    // Try to get channel name from Slack API
    if (channelId) {
      try {
        const channelInfo = await client.conversations.info({
          channel: channelId,
        });
        if (channelInfo.channel && "name" in channelInfo.channel) {
          channelName = `#${channelInfo.channel.name}`;
        }
      } catch (error) {
        // If we can't get channel name, use the stored name or fallback
        channelName = config.channel_name || channelId;
        logger.debug("Failed to get channel name from Slack API", {
          error: error instanceof Error ? error.message : String(error),
          channelId,
        });
      }
    }

    const notificationsEnabled = settings.transactions !== false;

    // Build the home view
    const blocks = [
      // Header
      {
        type: "header" as const,
        text: {
          type: "plain_text" as const,
          text: "Midday",
          emoji: false,
        },
      },
      {
        type: "divider" as const,
      },

      // Status Section
      {
        type: "section" as const,
        text: {
          type: "mrkdwn" as const,
          text: "*Status*\nConnected and ready",
        },
        accessory: {
          type: "button" as const,
          text: {
            type: "plain_text" as const,
            text: "Settings",
            emoji: false,
          },
          url: "https://app.midday.ai/apps?app=slack&settings=true",
          action_id: "open_settings",
        },
      },

      {
        type: "divider" as const,
      },

      // Features Overview
      {
        type: "section" as const,
        text: {
          type: "mrkdwn" as const,
          text: "*Features*\n\n• *Transaction Notifications* - Get notified when new transactions are added\n• *Receipt Upload* - Upload receipts and invoices directly in Slack\n• *Smart Matching* - Automatically match receipts to transactions\n• *Quick Actions* - Approve or decline matches with one click",
        },
      },

      {
        type: "divider" as const,
      },

      // Configuration Section
      {
        type: "section" as const,
        fields: [
          {
            type: "mrkdwn" as const,
            text: `*Notification Channel*\n${channelName}`,
          },
          {
            type: "mrkdwn" as const,
            text: `*Notifications*\n${notificationsEnabled ? "Enabled" : "Disabled"}`,
          },
        ],
      },

      {
        type: "divider" as const,
      },

      // Quick Actions
      {
        type: "section" as const,
        text: {
          type: "mrkdwn" as const,
          text: "*Quick Actions*",
        },
      },
      {
        type: "actions" as const,
        elements: [
          {
            type: "button" as const,
            text: {
              type: "plain_text" as const,
              text: "Open Midday",
              emoji: false,
            },
            url: "https://app.midday.ai",
            action_id: "open_midday",
          },
          {
            type: "button" as const,
            text: {
              type: "plain_text" as const,
              text: "Settings",
              emoji: false,
            },
            url: "https://app.midday.ai/apps?app=slack&settings=true",
            action_id: "view_settings",
          },
        ],
      },

      {
        type: "divider" as const,
      },

      // Getting Started
      {
        type: "section" as const,
        text: {
          type: "mrkdwn" as const,
          text: "*Getting Started*\n\n1. *Upload a receipt*: Share a file in any channel where Midday is added\n2. *Configure notifications*: Set up your notification channel in settings\n3. *Review matches*: Approve or decline suggested matches directly in Slack",
        },
      },

      {
        type: "divider" as const,
      },

      // Footer
      {
        type: "context" as const,
        elements: [
          {
            type: "mrkdwn" as const,
            text: "Upload receipts by sharing files in channels where Midday is added. Data will be automatically extracted and matched to your transactions.",
          },
        ],
      },
    ];

    await client.views.publish({
      user_id: userId,
      view: {
        type: "home" as const,
        blocks,
      },
    });

    logger.debug("Successfully published App Home", {
      userId,
      teamId,
      channelName,
      notificationsEnabled,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isNotEnabled = errorMessage.includes("not_enabled");

    // App Home is optional - if it's not enabled in Slack app config, log as debug
    if (isNotEnabled) {
      logger.debug(
        "App Home not enabled for this Slack app (this is optional)",
        {
          userId,
          teamId,
        },
      );
      return; // Don't throw - App Home is non-critical
    }

    // For other errors, log and throw
    logger.error("Failed to publish App Home", {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      userId,
      teamId,
    });
    throw new Error(`Failed to publish App Home: ${errorMessage}`);
  }
}
