import { InboxConnector } from "@midday/inbox/connector";
import type { Database } from "@midday/db/client";

export const getInstallUrl = async ({
  teamId,
  userId,
  db,
  redirectUrl,
}: {
  teamId: string;
  userId: string;
  db: Database;
  redirectUrl?: string;
}) => {
  const connector = new InboxConnector("gmail", db);
  const authUrl = await connector.connect();

  // Parse the auth URL and replace state parameter with our custom state
  // that includes teamId, userId, and optional redirectUrl for the callback
  const url = new URL(authUrl);
  const state = JSON.stringify({
    teamId,
    userId,
    provider: "gmail",
    redirectUrl,
  });
  url.searchParams.set("state", state);

  return url.toString();
};

