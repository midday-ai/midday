import { logger } from "@midday/logger";
import { LogLevel, App as SlackApp } from "@slack/bolt";
import { InstallProvider } from "@slack/oauth";
import { WebClient } from "@slack/web-api";

const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID;
const SLACK_CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET;
const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET;

let slackInstaller: InstallProvider | null = null;

export const getSlackInstaller = (): InstallProvider => {
  if (!slackInstaller) {
    if (!SLACK_CLIENT_ID || !SLACK_CLIENT_SECRET) {
      throw new Error("Slack client credentials are required but not provided");
    }

    slackInstaller = new InstallProvider({
      clientId: SLACK_CLIENT_ID,
      clientSecret: SLACK_CLIENT_SECRET,
      stateSecret: process.env.SLACK_STATE_SECRET,
      logLevel:
        process.env.NODE_ENV === "development" ? LogLevel.DEBUG : undefined,
    });
  }
  return slackInstaller;
};

export const createSlackApp = ({
  token,
  botId,
}: {
  token: string;
  botId: string;
}) => {
  if (!SLACK_SIGNING_SECRET) {
    throw new Error("SLACK_SIGNING_SECRET is required");
  }

  return new SlackApp({
    signingSecret: SLACK_SIGNING_SECRET,
    token,
    botId,
  });
};

export const createSlackWebClient = ({ token }: { token: string }) => {
  return new WebClient(token);
};

export const downloadFile = async ({
  privateDownloadUrl,
  token,
}: {
  privateDownloadUrl: string;
  token: string;
}) => {
  const response = await fetch(privateDownloadUrl, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(
      `Failed to download file from Slack: ${response.status} ${response.statusText}. ${errorText}`,
    );
  }

  return response.arrayBuffer();
};

/**
 * Ensures the bot is a member of the channel before sending messages.
 * Auto-joins public channels (channel ID starts with "C").
 * For private channels, the bot must be manually invited.
 */
export async function ensureBotInChannel({
  client,
  channelId,
}: {
  client: WebClient;
  channelId: string;
}): Promise<void> {
  // Only auto-join public channels (channel ID starts with "C")
  const isPublicChannel = channelId.startsWith("C");

  if (!isPublicChannel) {
    // For private channels (G) or DMs (D), bot must be invited manually
    return;
  }

  try {
    await client.conversations.join({ channel: channelId });
  } catch (joinError: unknown) {
    // Extract error message
    let errorMessage: string;
    if (
      joinError &&
      typeof joinError === "object" &&
      "data" in joinError &&
      joinError.data &&
      typeof joinError.data === "object" &&
      "error" in joinError.data
    ) {
      errorMessage = String(joinError.data.error);
    } else if (joinError instanceof Error) {
      errorMessage = joinError.message;
    } else {
      errorMessage = String(joinError);
    }

    // If already in channel, that's fine - continue
    if (errorMessage === "already_in_channel") {
      return;
    }

    // For other errors (e.g., channel_not_found, not_authed), log but don't throw
    // The message sending will handle these errors appropriately
    if (errorMessage !== "channel_not_found") {
      // Log unexpected errors but don't fail - let chat.postMessage handle it
      logger.warn(
        "Failed to auto-join channel (will try to send message anyway)",
        {
          channel: channelId,
          error: errorMessage,
        },
      );
    }
  }
}
