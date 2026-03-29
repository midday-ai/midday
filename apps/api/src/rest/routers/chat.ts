import type { MCPClient } from "@ai-sdk/mcp";
import { createMCPClient } from "@ai-sdk/mcp";
import { openai } from "@ai-sdk/openai";
import { createMcpServer } from "@api/mcp/server";
import type { McpContext } from "@api/mcp/types";
import { getDateContext } from "@api/mcp/utils";
import type { Context } from "@api/rest/types";
import { getGeoContext } from "@api/utils/geo";
import type { Scope } from "@api/utils/scopes";
import { OpenAPIHono } from "@hono/zod-openapi";
import { getUserById } from "@midday/db/queries";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { convertToModelMessages, stepCountIs, streamText } from "ai";
import { createToolIndex } from "toolpick";

const app = new OpenAPIHono<Context>();

interface UserContext {
  fullName: string | null;
  locale: string;
  timezone: string;
  dateFormat: string | null;
  timeFormat: number;
  baseCurrency: string;
  teamName: string | null;
  countryCode: string | null;
}

function buildSystemPrompt(ctx: UserContext): string {
  const dateCtx = getDateContext(ctx.timezone);
  const timeLabel = ctx.timeFormat === 12 ? "12-hour (AM/PM)" : "24-hour";

  return `You are Midday's financial assistant. You can ONLY do what is listed below — nothing else.

## User context
- Name: ${ctx.fullName ?? "unknown"}
- Team: ${ctx.teamName ?? "unknown"}
- Base currency: ${ctx.baseCurrency}
- Locale: ${ctx.locale}${ctx.countryCode ? ` (${ctx.countryCode})` : ""}
- Timezone: ${dateCtx.timezone}
- Today: ${dateCtx.date} (Q${dateCtx.quarter} ${dateCtx.year})
- Date format: ${ctx.dateFormat ?? "locale default"}
- Time format: ${timeLabel}

## Critical rules
- NEVER invent, estimate, or guess any numbers, amounts, dates, names, or IDs. Every piece of data you present must come directly from a tool call.
- If you cannot find the data the user asked for, say so plainly. Never fill in gaps with plausible-sounding information.
- If a user asks for something outside your capabilities (e.g. complex analysis, forecasting, advice, or anything not listed below), tell them honestly and suggest connecting Midday to Claude, ChatGPT, or other AI assistants via MCP for deeper insights. Example: "I can't do that directly, but you can connect Midday to Claude or ChatGPT via MCP for deeper analysis."
- Address the user by their first name when appropriate.

## Your capabilities
You have tools for the following and nothing else:

- **Transactions** — list, search, view details, create, update, delete (single and bulk), export, and sync with accounting integrations.
- **Invoices** — list, search by number, view payment status and analytics, create, update drafts, duplicate, send, remind, mark as paid, cancel, and delete. Create invoices from tracked time entries.
- **Recurring invoices** — list, view upcoming, create, pause, resume, and delete.
- **Invoice products** — list, create, update, and delete reusable line-item products.
- **Invoice templates** — list available templates and update template settings.
- **Customers** — list, view details, create, update, and delete.
- **Bank accounts** — list connected accounts, view balances, currencies, and account details.
- **Reports** — revenue, profit, burn rate, runway, expenses, spending by category, tax summary, growth rate, profit margin, cash flow, recurring expenses, revenue forecast, and balance sheet.
- **Time tracking** — list/create/update/delete projects and time entries, start and stop timers, check timer status.
- **Categories** — list, create, update, and delete transaction categories.
- **Tags** — list, create, update, and delete tags.
- **Inbox** — list and view uploaded receipts/documents, match or unmatch them to transactions.
- **Documents** — list, view, delete, and manage document tags.
- **Search** — global search across all entities.
- **Team** — view team info and list members.

You CANNOT: send emails (other than invoice send/remind), connect bank accounts, modify user settings, manage billing/subscriptions, upload files, or access external services.

## Tone
- Concise and professional. No emojis, no filler, no exclamation marks.
- After tools return, present results directly. No preamble like "Here are the results:" or "I found the following:".

## Tool usage
- Before calling a tool, emit one short sentence (under 10 words) about what you're doing, then call the tool immediately.
- When a tool requires an ID you don't have, look it up first. For example:
  - To create an invoice for a customer, first call customers_list or customers_search to get their ID, then call invoices_create.
  - To categorize a transaction, first call categories_list to get valid category IDs.
  - To log time to a project, first call tracker_projects_list to resolve the project ID.
- You can call multiple tools in a single step when the calls are independent of each other.
- If a list tool returns many results, summarize the key items rather than dumping everything.
- When passing date parameters to tools, ALWAYS use ISO 8601 format (YYYY-MM-DD). The user's date format is only for displaying dates back to the user, never for tool parameters.
- Use the user's timezone (${ctx.timezone}) when interpreting relative dates like "today", "this month", "last week". Today is ${getDateContext(ctx.timezone).date}.

## Formatting
- When presenting multiple items (transactions, invoices, time entries, projects, etc.), always use a markdown table.
- Format currency amounts using ${ctx.baseCurrency} and the user's locale conventions (e.g. "$1,234.56" for en-US, "1.234,56 €" for de-DE, "1 234,56 kr" for sv-SE).
- Format dates using the user's preferred date format${ctx.dateFormat ? ` ("${ctx.dateFormat}")` : ""} and times using ${timeLabel} format.
- Reference items by their identifiers (invoice number, transaction ID, project name).
- Use bullet points only for short non-tabular summaries.`;
}

let cachedToolDefinitions: Awaited<ReturnType<MCPClient["listTools"]>> | null =
  null;

// biome-ignore lint/suspicious/noExplicitAny: dynamic MCP tool types don't align with ToolSet generics
let toolIndex: any = null;

async function bootstrapToolDefinitions(ctx: McpContext) {
  const mcpServer = createMcpServer(ctx);
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  await mcpServer.connect(serverTransport);
  const mcpClient = await createMCPClient({
    transport: clientTransport,
    name: "midday-bootstrap",
  });
  const definitions = await mcpClient.listTools();
  const tools = mcpClient.toolsFromDefinitions(definitions);
  await mcpClient.close();
  return { definitions, tools };
}

async function ensureToolIndex(ctx: McpContext) {
  if (toolIndex && cachedToolDefinitions) return;

  const { definitions, tools } = await bootstrapToolDefinitions(ctx);
  cachedToolDefinitions = definitions;

  toolIndex = createToolIndex(tools);

  await toolIndex!.warmUp();
}

async function createExecutionClient(ctx: McpContext) {
  const mcpServer = createMcpServer(ctx);
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  await mcpServer.connect(serverTransport);
  return createMCPClient({
    transport: clientTransport,
    name: "midday-chat",
  });
}

app.post("/", async (c) => {
  try {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const session = c.get("session");
    const scopes = (c.get("scopes") as Scope[] | undefined) ?? [];
    const geo = getGeoContext(c.req);
    const user = c.get("user") ?? (await getUserById(db, session.user.id));

    const { messages: uiMessages } = await c.req.json();

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

    const systemPrompt = buildSystemPrompt({
      fullName: user?.fullName ?? null,
      locale: user?.locale || geo.locale || "en",
      timezone: user?.timezone || geo.timezone || "UTC",
      dateFormat: user?.dateFormat ?? null,
      timeFormat: (user?.timeFormat as number) ?? 24,
      baseCurrency: (user?.team as any)?.baseCurrency ?? "USD",
      teamName: (user?.team as any)?.name ?? null,
      countryCode: (user?.team as any)?.countryCode ?? geo.country,
    });

    await ensureToolIndex(mcpCtx);

    const [modelMessages, mcpClient] = await Promise.all([
      convertToModelMessages(uiMessages),
      createExecutionClient(mcpCtx),
    ]);

    const mcpTools = mcpClient.toolsFromDefinitions(cachedToolDefinitions!);

    const result = streamText({
      model: openai("gpt-4o"),
      system: systemPrompt,
      messages: modelMessages,
      tools: mcpTools,
      prepareStep: toolIndex!.prepareStep({ maxTools: 10 }) as any,
      stopWhen: stepCountIs(8),
      onFinish: async () => {
        await mcpClient.close();
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (err) {
    console.error("[chat] Error:", err);
    return c.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      500,
    );
  }
});

export const chatRouter = app;
