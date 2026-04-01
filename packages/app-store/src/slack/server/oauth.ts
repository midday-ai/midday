import { getSlackInstaller } from "./client";

const SLACK_OAUTH_REDIRECT_URL = process.env.SLACK_OAUTH_REDIRECT_URL;

export const getInstallUrl = ({
  teamId,
  userId,
}: {
  teamId: string;
  userId: string;
}) => {
  if (!SLACK_OAUTH_REDIRECT_URL) {
    throw new Error("SLACK_OAUTH_REDIRECT_URL is required");
  }

  return getSlackInstaller().generateInstallUrl({
    scopes: [
      "app_mentions:read", // Required for @mentions that start assistant threads
      "assistant:write", // Required for Slack assistant status and titles
      "incoming-webhook", // Fallback for private channels when bot can't post
      "chat:write", // Required for posting messages
      "chat:write.public", // Required for posting to public channels
      "groups:history", // Required for message.groups event subscription and to read messages in private channels
      "groups:read", // Required for private channel metadata
      "channels:history", // Required for message.channels event subscription and to read messages in public channels
      "channels:read", // Required for public channel metadata
      "channels:join", // Required to auto-join public channels to receive message events
      "files:read", // Required to download files via url_private_download URLs
      "im:history", // Required for direct-message assistant chats
      "im:read", // Required for DM metadata
      "mpim:history", // Required for multi-person DM assistant chats
      "mpim:read", // Required for MPIM metadata
      "reactions:read", // Required to react to and inspect thread state
      "reactions:write", // Required to add/remove emoji reactions to messages
      "users:read", // Required for views.publish to publish App Home views
    ],
    redirectUri: SLACK_OAUTH_REDIRECT_URL,
    metadata: JSON.stringify({ teamId, userId }),
  });
};
