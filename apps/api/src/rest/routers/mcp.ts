import { createMcpServer } from "@api/mcp/server";
import { withAuth } from "@api/rest/middleware/auth";
import { withDatabase } from "@api/rest/middleware/db";
import { withClientIp } from "@api/rest/middleware/ip";
import { withPrimaryReadAfterWrite } from "@api/rest/middleware/primary-read-after-write";
import type { Context } from "@api/rest/types";
import { getGeoContext } from "@api/utils/geo";
import type { Scope } from "@api/utils/scopes";
import { StreamableHTTPTransport } from "@hono/mcp";
import { OpenAPIHono } from "@hono/zod-openapi";
import { getUserById } from "@midday/db/queries";
import * as Sentry from "@sentry/bun";
import { rateLimiter } from "hono-rate-limiter";

const app = new OpenAPIHono<Context>();

const apiUrl = process.env.MIDDAY_API_URL || "https://api.midday.ai";

const mcpRateLimitEnv = process.env.MCP_API_RATE_LIMIT;
const parsedMcpLimit =
  mcpRateLimitEnv !== undefined && mcpRateLimitEnv !== ""
    ? Number(mcpRateLimitEnv)
    : NaN;
const mcpRateLimit =
  Number.isFinite(parsedMcpLimit) && parsedMcpLimit > 0
    ? parsedMcpLimit
    : Number(process.env.API_RATE_LIMIT) || 1000;

const REQUIRED_ACCEPT = "application/json, text/event-stream";

app.use("/*", withClientIp, withDatabase);

app.use("/*", async (c, next) => {
  const accept = c.req.header("Accept") ?? "";
  if (
    !accept.includes("application/json") ||
    !accept.includes("text/event-stream")
  ) {
    c.req.raw.headers.set("Accept", REQUIRED_ACCEPT);
  }
  await next();
});

// MCP-specific auth: returns WWW-Authenticate header per MCP authorization spec
app.use("/*", async (c, next) => {
  try {
    await withAuth(c, next);
  } catch {
    const resourceMetadataUrl = `${apiUrl}/.well-known/oauth-protected-resource`;
    return c.json(
      {
        error: "unauthorized",
        error_description: "Bearer token required. Use OAuth to authenticate.",
      },
      401,
      {
        "WWW-Authenticate": `Bearer resource_metadata="${resourceMetadataUrl}"`,
      },
    );
  }
});

app.use(
  "/*",
  rateLimiter({
    windowMs: 10 * 60 * 1000,
    limit: mcpRateLimit,
    keyGenerator: (c) =>
      c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown",
    statusCode: 429,
    message: "Rate limit exceeded",
  }),
  withPrimaryReadAfterWrite,
);

app.all("/", async (c) => {
  if (process.env.SENTRY_DSN) {
    Sentry.setTag("mcp", "true");
    Sentry.setTag("api.route", "mcp");
  }

  const transport = new StreamableHTTPTransport();
  const db = c.get("db");
  const teamId = c.get("teamId");
  const session = c.get("session");
  const scopes = (c.get("scopes") as Scope[] | undefined) ?? [];
  const geo = getGeoContext(c.req);

  const user = c.get("user") ?? (await getUserById(db, session.user.id));

  const server = createMcpServer({
    db,
    teamId,
    userId: user?.id ?? session.user.id,
    userEmail: user?.email ?? session.user.email ?? null,
    scopes,
    apiUrl,
    timezone: user?.timezone || geo.timezone,
    locale: user?.locale || geo.locale,
    countryCode: geo.country,
    dateFormat: user?.dateFormat ?? null,
    timeFormat: user?.timeFormat ?? null,
  });

  await server.connect(transport);

  return transport.handleRequest(c);
});

export const mcpRouter = app;
