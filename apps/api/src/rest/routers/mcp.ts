import { createMcpServer } from "@api/mcp/server";
import type { Context } from "@api/rest/types";
import { StreamableHTTPTransport } from "@hono/mcp";
import { OpenAPIHono } from "@hono/zod-openapi";

const app = new OpenAPIHono<Context>();

app.all("/", async (c) => {
  const transport = new StreamableHTTPTransport();
  const db = c.get("db");
  const teamId = c.get("teamId");

  const server = createMcpServer({ db, teamId });

  await server.connect(transport);

  return transport.handleRequest(c);
});

export const mcpRouter = app;
