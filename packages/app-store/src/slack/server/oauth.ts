import { getSlackInstaller } from "./client";

const SLACK_OAUTH_REDIRECT_URL = process.env.SLACK_OAUTH_REDIRECT_URL;

export const getInstallUrl = ({
  teamId,
  userId,
}: { teamId: string; userId: string }) => {
  if (!SLACK_OAUTH_REDIRECT_URL) {
    throw new Error("SLACK_OAUTH_REDIRECT_URL is required");
  }

  return getSlackInstaller().generateInstallUrl({
    scopes: [
      "incoming-webhook",
      "chat:write",
      "chat:write.public",
      "team:read",
      "im:history",
      "im:read", // Required to access files in DMs
      "groups:read", // Required to access files in private channels
      "groups:history", // Required for message.groups event subscription and to read messages in private channels
      "channels:read", // Required to access files in public channels
      "channels:history", // Required for message.channels event subscription and to read messages in public channels
      "channels:join", // Required to auto-join public channels to receive message events
      "commands",
      "files:read",
      "reactions:write", // Required to add emoji reactions to messages
    ],
    redirectUri: SLACK_OAUTH_REDIRECT_URL,
    metadata: JSON.stringify({ teamId, userId }),
  });
};
