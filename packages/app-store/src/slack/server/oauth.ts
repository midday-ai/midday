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
      "incoming-webhook", // Fallback for private channels when bot can't post
      "chat:write", // Required for posting messages
      "chat:write.public", // Required for posting to public channels
      "groups:history", // Required for message.groups event subscription and to read messages in private channels
      "channels:history", // Required for message.channels event subscription and to read messages in public channels
      "channels:join", // Required to auto-join public channels to receive message events
      "files:read", // Required to download files via url_private_download URLs
      "reactions:write", // Required to add/remove emoji reactions to messages
      "users:read", // Required for views.publish to publish App Home views
    ],
    redirectUri: SLACK_OAUTH_REDIRECT_URL,
    metadata: JSON.stringify({ teamId, userId }),
  });
};
