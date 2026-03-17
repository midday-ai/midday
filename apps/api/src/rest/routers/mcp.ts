import { createMcpServer } from "@api/mcp/server";
import type { Context } from "@api/rest/types";
import type { Scope } from "@api/utils/scopes";
import { StreamableHTTPTransport } from "@hono/mcp";
import { OpenAPIHono } from "@hono/zod-openapi";

const app = new OpenAPIHono<Context>();

const apiUrl = process.env.MIDDAY_API_URL || "https://api.midday.ai";

const REQUIRED_ACCEPT = "application/json, text/event-stream";

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
