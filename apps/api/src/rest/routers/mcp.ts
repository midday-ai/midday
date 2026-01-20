import { createMcpServer } from "@api/mcp/server";
import type { Context } from "@api/rest/types";
import type { Scope } from "@api/utils/scopes";
import { StreamableHTTPTransport } from "@hono/mcp";
import { OpenAPIHono } from "@hono/zod-openapi";

const app = new OpenAPIHono<Context>();

app.all("/", async (c) => {
  const transport = new StreamableHTTPTransport();
  const db = c.get("db");
  const teamId = c.get("teamId");
  const session = c.get("session");
  const userId = session.user.id;
  const scopes = (c.get("scopes") as Scope[] | undefined) ?? [];

  const server = createMcpServer({ db, teamId, userId, scopes });

  await server.connect(transport);

  return transport.handleRequest(c);
});

export const mcpRouter = app;
