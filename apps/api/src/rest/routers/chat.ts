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
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateText,
  stepCountIs,
  streamText,
} from "ai";
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

  return `You are Midday's financial assistant. You help SMB owners understand their finances and take action.

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
- NEVER invent or guess numbers, amounts, dates, names, or IDs. Every data point must come from a tool call (internal or web search).
- When you combine data from multiple sources (e.g. a product price from web search + the user's bank balance), clearly state where each number comes from.
- If you truly cannot answer even after using tools and web search, say so and suggest connecting Midday to Claude, ChatGPT, or other AI assistants via MCP for deeper analysis.
- Address the user by their first name when appropriate.

## Your capabilities

### Internal tools
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

### Web search
You can search the internet for real-time external information. Use it for:
- Prices of products, services, or assets the user asks about (e.g. "Can I afford a Tesla?", "How much does Figma cost?")
- Current exchange rates, market data, or commodity prices
- Tax rules, regulations, VAT rates, or compliance requirements
- Industry benchmarks or standard rates
- News or events relevant to the user's business
- Information about a specific company, product, or service

### Combining sources
When a question involves both external information and the user's finances, use BOTH web search and internal tools in the same response. For example:
- "Can I afford X?" → search for the price of X, then check bank balances or runway, and give a clear answer.
- "What's the VAT rate for my country?" → search for the rate, then check relevant transactions if needed.
- "How does my revenue compare to industry average?" → search for benchmarks, then pull the user's revenue data.

You CANNOT: send emails (other than invoice send/remind), connect bank accounts, modify user settings, manage billing/subscriptions, or upload files.

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

    const firstUserText = uiMessages
      .filter((m: any) => m.role === "user")
      .map((m: any) =>
        Array.isArray(m.parts)
          ? m.parts
              .filter((p: any) => p.type === "text")
              .map((p: any) => p.text)
              .join("")
          : typeof m.content === "string"
            ? m.content
            : "",
      )
      .at(-1) as string | undefined;

    const stream = createUIMessageStream({
      execute: ({ writer }) => {
        const result = streamText({
          model: openai("gpt-4o"),
          system: systemPrompt,
          messages: modelMessages,
          tools: {
            ...mcpTools,
            web_search: openai.tools.webSearch({
              searchContextSize: "medium",
              userLocation: {
                type: "approximate",
                country: mcpCtx.countryCode ?? undefined,
                timezone: mcpCtx.timezone ?? undefined,
              },
            }),
          },
          prepareStep: toolIndex!.prepareStep({ maxTools: 10 }) as any,
          stopWhen: stepCountIs(8),
          experimental_download: async (options) =>
            options.map(({ url }) => {
              if (url.protocol === "data:") {
                const [header, base64] = url.href.split(",");
                const mediaType =
                  header?.match(/data:([^;]+)/)?.[1] ??
                  "application/octet-stream";
                return {
                  data: Uint8Array.from(atob(base64 ?? ""), (c) =>
                    c.charCodeAt(0),
                  ),
                  mediaType,
                };
              }
              return null;
            }),
          onFinish: async () => {
            if (firstUserText?.trim()) {
              const { text: raw } = await generateText({
                model: openai("gpt-4o-mini"),
                prompt: `Generate a concise 3-5 word title for this conversation. Output ONLY the title, no quotes, no punctuation at the end.\n\nUser: ${firstUserText.trim()}`,
              });

              const title = raw.trim().replace(/^["']+|["']+$/g, "");

              if (title) {
                writer.write({
                  type: "data-title" as any,
                  id: "chat-title",
                  data: { title },
                });
              }
            }

            await mcpClient.close();
          },
        });

        writer.merge(result.toUIMessageStream({ sendSources: true }));
      },
    });

    return createUIMessageStreamResponse({ stream });
  } catch (err) {
    console.error("[chat] Error:", err);
    return c.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      500,
    );
  }
});

export const chatRouter = app;
