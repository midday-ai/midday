import { anthropic } from "@ai-sdk/anthropic";
import { createMCPClient } from "@ai-sdk/mcp";
import { createMcpServer } from "@api/mcp/server";
import type { McpContext } from "@api/mcp/types";
import type { Context } from "@api/rest/types";
import { getGeoContext } from "@api/utils/geo";
import type { Scope } from "@api/utils/scopes";
import { OpenAPIHono } from "@hono/zod-openapi";
import { getUserById } from "@midday/db/queries";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { convertToModelMessages, stepCountIs, streamText } from "ai";

const app = new OpenAPIHono<Context>();

const SYSTEM_PROMPT = `You are Midday's financial assistant.

CRITICAL: Never produce ANY text before or between tool calls. Do not narrate, announce, or describe what you are doing. No "Let me search...", "I'll look that up...", "Searching for...", or any similar phrasing. Execute tools silently. Only produce text AFTER all tool calls are complete, to present the final result.

Rules:
- Be concise and professional. No emojis, no filler, no exclamation marks.
- Only speak to present results or ask for clarification.
- Use bullet points for lists. Format currency amounts clearly.
- Reference items by their identifiers (invoice number, transaction ID).
- Never fabricate data — always use tools.`;

app.post("/", async (c) => {
  const db = c.get("db");
  const teamId = c.get("teamId");
  const session = c.get("session");
  const scopes = (c.get("scopes") as Scope[] | undefined) ?? [];
  const geo = getGeoContext(c.req);
  const user = c.get("user") ?? (await getUserById(db, session.user.id));

  const { messages: uiMessages } = await c.req.json();
  const modelMessages = await convertToModelMessages(uiMessages);

  const mcpCtx: McpContext = {
    db,
    teamId,
    userId: user?.id ?? session.user.id,
    userEmail: user?.email ?? session.user.email ?? null,
    scopes,
    apiUrl: process.env.MIDDAY_API_URL || "https://api.midday.ai",
    timezone: user?.timezone || geo.timezone,
    locale: user?.locale || geo.locale,
    countryCode: geo.country,
    dateFormat: user?.dateFormat ?? null,
    timeFormat: user?.timeFormat ?? null,
  };

  const mcpServer = createMcpServer(mcpCtx);
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  await mcpServer.connect(serverTransport);

  const mcpClient = await createMCPClient({
    transport: clientTransport,
    name: "midday-chat",
  });

  const mcpTools = await mcpClient.tools();

  const deferredTools: Record<string, unknown> = {};
  for (const [name, tool] of Object.entries(mcpTools)) {
    deferredTools[name] = {
      ...tool,
      providerOptions: {
        ...((tool as Record<string, unknown>).providerOptions as
          | Record<string, unknown>
          | undefined),
        anthropic: { deferLoading: true },
      },
    };
  }

  const result = streamText({
    model: anthropic("claude-sonnet-4-6"),
    system: SYSTEM_PROMPT,
    messages: modelMessages,
    tools: {
      toolSearch: anthropic.tools.toolSearchBm25_20251119(),
      ...deferredTools,
    },
    stopWhen: stepCountIs(5),
    onFinish: async () => {
      await mcpClient.close();
    },
  });

  return result.toUIMessageStreamResponse();
});

export const chatRouter = app;
