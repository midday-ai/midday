import * as crypto from "node:crypto";
import * as http from "node:http";
import chalk from "chalk";
import escapeHtml from "escape-html";
import open from "open";
import {
  clearCredentials,
  getCredentials,
  saveCredentials,
} from "../config/store.js";
import { getApiUrl, getDashboardUrl } from "../utils/env.js";

const CLIENT_NAME = "Midday CLI";
const SCOPES = [
  "transactions.read",
  "transactions.write",
  "invoices.read",
  "invoices.write",
  "customers.read",
  "customers.write",
  "bank-accounts.read",
  "tracker-projects.read",
  "tracker-projects.write",
  "tracker-entries.read",
  "tracker-entries.write",
  "documents.read",
  "documents.write",
  "inbox.read",
  "inbox.write",
  "tags.read",
  "tags.write",
  "reports.read",
  "teams.read",
  "users.read",
  "search.read",
];

function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString("base64url");
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const hash = crypto.createHash("sha256").update(verifier).digest();
  return hash.toString("base64url");
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type: string;
}

async function registerClient(
  apiUrl: string,
  redirectUri: string,
): Promise<{ clientId: string }> {
  const response = await fetch(`${apiUrl}/oauth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_name: CLIENT_NAME,
      redirect_uris: [redirectUri],
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Client registration failed: ${response.statusText} — ${body}`,
    );
  }

  const data = (await response.json()) as { client_id: string };
  return { clientId: data.client_id };
}

function startCallbackServer(expectedState: string): Promise<{
  port: number;
  codePromise: Promise<{ code: string; close: () => void }>;
}> {
  return new Promise((resolveServer, rejectServer) => {
    let resolveCode: (value: { code: string; close: () => void }) => void;
    let rejectCode: (reason: Error) => void;
    const codePromise = new Promise<{ code: string; close: () => void }>(
      (res, rej) => {
        resolveCode = res;
        rejectCode = rej;
      },
    );

    const server = http.createServer((req, res) => {
      const url = new URL(req.url || "/", `http://localhost`);

      if (url.pathname !== "/callback") {
        res.writeHead(404);
        res.end();
        return;
      }

      const code = url.searchParams.get("code");
      const error = url.searchParams.get("error");
      const returnedState = url.searchParams.get("state");

      if (error) {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(errorPage(error));
        rejectCode(new Error(`OAuth error: ${error}`));
        return;
      }

      if (!returnedState || returnedState !== expectedState) {
        res.writeHead(400, { "Content-Type": "text/html" });
        res.end(errorPage("Invalid state parameter — possible CSRF attack"));
        rejectCode(new Error("OAuth state mismatch — callback rejected"));
        return;
      }

      if (!code) {
        res.writeHead(400, { "Content-Type": "text/html" });
        res.end(errorPage("Missing authorization code"));
        rejectCode(new Error("Missing authorization code"));
        return;
      }

      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(successPage());
      resolveCode({
        code,
        close: () => {
          clearTimeout(timeout);
          server.close();
        },
      });
    });

    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      if (!addr || typeof addr === "string") {
        rejectServer(new Error("Failed to start callback server"));
        return;
      }
      resolveServer({ port: addr.port, codePromise });
    });

    server.on("error", rejectServer);

    const timeout = setTimeout(() => {
      server.close();
      rejectCode(new Error("OAuth login timed out after 120 seconds"));
    }, 120_000);
  });
}

async function exchangeCode(
  apiUrl: string,
  clientId: string,
  code: string,
  codeVerifier: string,
  redirectUri: string,
): Promise<TokenResponse> {
  const response = await fetch(`${apiUrl}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Token exchange failed: ${response.status} ${body}`);
  }

  return (await response.json()) as TokenResponse;
}

export async function loginWithBrowser(
  opts: { noBrowser?: boolean } = {},
): Promise<void> {
  const apiUrl = getApiUrl();
  const dashboardUrl = getDashboardUrl();

  const state = crypto.randomBytes(16).toString("hex");
  const { port, codePromise } = await startCallbackServer(state);

  const redirectUri = `http://localhost:${port}/callback`;

  const { clientId } = await registerClient(apiUrl, redirectUri);

  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  const authUrl = new URL(`${dashboardUrl}/oauth/authorize`);
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", SCOPES.join(" "));
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("code_challenge", codeChallenge);
  authUrl.searchParams.set("code_challenge_method", "S256");

  if (opts.noBrowser) {
    console.log(`\n  Open this URL in your browser:\n`);
    console.log(`  ${chalk.cyan(authUrl.toString())}\n`);
  } else {
    console.log(`\n  ${chalk.dim("Opening browser for authentication...")}`);
    await open(authUrl.toString());
  }

  console.log(`  ${chalk.dim("Waiting for authorization...")}\n`);

  const { code, close } = await codePromise;

  const tokens = await exchangeCode(
    apiUrl,
    clientId,
    code,
    codeVerifier,
    redirectUri,
  );

  const expiresAt = tokens.expires_in
    ? Date.now() + tokens.expires_in * 1000
    : undefined;

  saveCredentials({
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt,
  });

  close();

  try {
    const userRes = await fetch(`${apiUrl}/users/me`, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (userRes.ok) {
      const user = (await userRes.json()) as {
        id?: string;
        email?: string;
        fullName?: string;
        team?: { id?: string; name?: string } | null;
      };
      saveCredentials({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt,
        email: user.email,
        teamName: user.team?.name,
        teamId: user.team?.id,
        userId: user.id,
      });
    }
  } catch {
    // User info is optional for the credential store
  }
}

export async function loginWithToken(token: string): Promise<void> {
  const apiUrl = getApiUrl();

  const response = await fetch(`${apiUrl}/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Invalid token: ${response.status} ${response.statusText}`);
  }

  const user = (await response.json()) as {
    id?: string;
    email?: string;
    fullName?: string;
    team?: { id?: string; name?: string } | null;
  };

  saveCredentials({
    accessToken: token,
    email: user.email,
    teamName: user.team?.name,
    teamId: user.team?.id,
    userId: user.id,
  });
}

export function logout(): void {
  clearCredentials();
}

export function getAuthStatus(): {
  loggedIn: boolean;
  email?: string;
  teamName?: string;
} {
  const creds = getCredentials();
  if (!creds) return { loggedIn: false };
  return {
    loggedIn: true,
    email: creds.email,
    teamName: creds.teamName,
  };
}

function successPage(): string {
  return `<!DOCTYPE html><html><head><title>Midday CLI</title>
<style>body{font-family:system-ui;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#0a0a0a;color:#fafafa}
.container{text-align:center}.check{font-size:48px;margin-bottom:16px}h1{font-size:24px;font-weight:500}p{color:#888;margin-top:8px}</style>
</head><body><div class="container"><div class="check">&#10003;</div><h1>Authenticated</h1><p>You can close this window and return to your terminal.</p></div></body></html>`;
}

function errorPage(error: string): string {
  const safeError = escapeHtml(error);
  return `<!DOCTYPE html><html><head><title>Midday CLI</title>
<style>body{font-family:system-ui;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#0a0a0a;color:#fafafa}
.container{text-align:center}h1{font-size:24px;font-weight:500;color:#f87171}p{color:#888;margin-top:8px}</style>
</head><body><div class="container"><h1>Authentication Failed</h1><p>${safeError}</p><p>Please try again in your terminal.</p></div></body></html>`;
}
