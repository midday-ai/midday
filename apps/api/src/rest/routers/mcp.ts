import { createMcpServer } from "@api/mcp/server";
import { withAuth } from "@api/rest/middleware/auth";
import { withDatabase } from "@api/rest/middleware/db";
import { withClientIp } from "@api/rest/middleware/ip";
import { withPrimaryReadAfterWrite } from "@api/rest/middleware/primary-read-after-write";
import type { Context } from "@api/rest/types";
import type { Scope } from "@api/utils/scopes";
import { StreamableHTTPTransport } from "@hono/mcp";
import { OpenAPIHono } from "@hono/zod-openapi";
import { rateLimiter } from "hono-rate-limiter";

const app = new OpenAPIHono<Context>();

const apiUrl = process.env.MIDDAY_API_URL || "https://api.midday.ai";

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
    limit: Number(process.env.API_RATE_LIMIT) || 1000,
    keyGenerator: (c) => {
      return c.get("session")?.user?.id ?? "unknown";
    },
    statusCode: 429,
    message: "Rate limit exceeded",
  }),
  withPrimaryReadAfterWrite,
);

app.all("/", async (c) => {
  const transport = new StreamableHTTPTransport();
  const db = c.get("db");
  const teamId = c.get("teamId");
  const session = c.get("session");
  const userId = session.user.id;
  const scopes = (c.get("scopes") as Scope[] | undefined) ?? [];

  const server = createMcpServer({ db, teamId, userId, scopes, apiUrl });

  await server.connect(transport);

  return transport.handleRequest(c);
});

export const mcpRouter = app;
