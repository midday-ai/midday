import "../setup";
import { describe, expect, test } from "bun:test";
import { OpenAPIHono } from "@hono/zod-openapi";
import { createMcpServer } from "../../mcp/server";
import type { McpContext } from "../../mcp/types";
import { mcpRouter } from "../../rest/routers/mcp";

describe("MCP server", () => {
  test("createMcpServer registers transaction write tools when scopes include write", () => {
    const server = createMcpServer({
      db: {} as McpContext["db"],
      teamId: "test-team-id",
      userId: "test-user-id",
      scopes: [
        "transactions.read",
        "transactions.write",
        "tags.read",
        "tags.write",
        "invoices.read",
        "reports.read",
        "search.read",
        "teams.read",
        "customers.read",
        "bank-accounts.read",
        "documents.read",
        "inbox.read",
        "tracker-projects.read",
        "tracker-entries.read",
      ],
      apiUrl: "https://api.midday.ai",
      timezone: "UTC",
      locale: "en",
      countryCode: "US",
      dateFormat: null,
      timeFormat: 24,
    });

    const names = Object.keys(
      (server as unknown as { _registeredTools: Record<string, unknown> })
        ._registeredTools,
    );

    expect(names).toContain("transactions_list");
    expect(names).toContain("transactions_create");
    expect(names).toContain("tags_create");
  });

  test("mcp router returns 401 when Authorization is missing", async () => {
    const app = new OpenAPIHono();
    app.route("/mcp", mcpRouter);

    const res = await app.request("http://test/mcp", {
      method: "POST",
      headers: {
        Accept: "application/json, text/event-stream",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-03-26",
          capabilities: {},
          clientInfo: { name: "test", version: "1.0" },
        },
      }),
    });

    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("unauthorized");
  });
});
