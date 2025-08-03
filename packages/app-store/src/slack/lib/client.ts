import { LogLevel, App as SlackApp } from "@slack/bolt";
import { InstallProvider } from "@slack/oauth";
import { WebClient } from "@slack/web-api";

const SLACK_CLIENT_ID = process.env.NEXT_PUBLIC_SLACK_CLIENT_ID;
const SLACK_CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET;
const SLACK_OAUTH_REDIRECT_URL =
  process.env.NEXT_PUBLIC_SLACK_OAUTH_REDIRECT_URL;
const SLACK_STATE_SECRET = process.env.NEXT_PUBLIC_SLACK_STATE_SECRET;
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
      stateSecret: SLACK_STATE_SECRET,
      logLevel:
        process.env.NODE_ENV === "development" ? LogLevel.DEBUG : undefined,
    });
  }
  return slackInstaller;
};

export const createSlackApp = ({
  token,
  botId,
}: { token: string; botId: string }) => {
  return new SlackApp({
    signingSecret: SLACK_SIGNING_SECRET,
    token,
    botId,
  });
};

export const createSlackWebClient = ({
  token,
}: {
  token: string;
}) => {
  return new WebClient(token);
};

export const getInstallUrl = ({
  teamId,
  userId,
}: { teamId: string; userId: string }) => {
  return getSlackInstaller().generateInstallUrl({
    scopes: [
      "incoming-webhook",
      "chat:write",
      "chat:write.public",
      "team:read",
      "assistant:write",
      "im:history",
      "commands",
      "files:read",
    ],
    redirectUri: SLACK_OAUTH_REDIRECT_URL,
    metadata: JSON.stringify({ teamId, userId }),
  });
};

export const downloadFile = async ({
  privateDownloadUrl,
  token,
}: { privateDownloadUrl: string; token: string }) => {
  const response = await fetch(privateDownloadUrl, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.arrayBuffer();
};
