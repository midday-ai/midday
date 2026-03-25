import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerPrompts } from "./prompts";
import { registerResources } from "./resources";
import {
  registerBankAccountTools,
  registerCustomerTools,
  registerDocumentTools,
  registerInboxTools,
  registerInvoiceTools,
  registerReportTools,
  registerSearchTools,
  registerTagTools,
  registerTeamTools,
  registerTrackerTools,
  registerTransactionTools,
} from "./tools";
import type { McpContext } from "./types";
import { getDateContext } from "./utils";

function getServerInstructions(timezone: string | null): string {
  const ctx = getDateContext(timezone);

  return `Midday is a financial operating system for small businesses. This MCP server provides access to financial data including transactions, invoices, customers, time tracking, documents, and reports.

## Current Date & Timezone

Today is ${ctx.date} in the user's timezone (${ctx.timezone}). The current year is ${ctx.year}, current quarter is Q${ctx.quarter}. Use these for default date ranges:
- This month: from ${ctx.monthStart} to ${ctx.date}
- This quarter: from ${ctx.quarterStart} to ${ctx.date}
- This year: from ${ctx.yearStart} to ${ctx.date}

## Tool Organization

Tools are namespaced by domain:
- transactions_* — Bank transactions (income and expenses)
- invoices_* — Invoice management (create, send, track payments)
- customers_* — Customer CRM data
- tracker_* — Time tracking projects and entries
- reports_* — Financial reports and analytics (revenue, profit, burn rate, runway, etc.)
- documents_* — File vault for receipts and documents
- inbox_* — Incoming receipts and documents pending processing
- bank_accounts_* — Connected bank account information
- tags_* / team_* — Organization metadata
- search_global — Full-text search across all data types

## Key Patterns

- All monetary amounts use the team's base currency unless a currency parameter is provided.
- Date parameters use ISO 8601 format (YYYY-MM-DD for dates, full ISO for timestamps).
- List tools support cursor-based pagination; pass the returned cursor to fetch the next page.
- Report tools require date ranges (from/to) and return aggregated data with period comparisons.
- Use search_global for quick lookups across all data types instead of listing each type separately.
- The team_get tool returns the team's base currency and settings — call it first when currency context is needed.
`;
}

export function createMcpServer(ctx: McpContext): McpServer {
  const server = new McpServer(
    {
      name: "midday",
      version: "1.0.0",
      title: "Midday",
      description:
        "Financial operating system for small businesses — transactions, invoices, time tracking, and reports",
      websiteUrl: "https://midday.ai",
      icons: [
        {
          src: "https://midday.ai/images/midday-icon.svg",
          mimeType: "image/svg+xml",
        },
      ],
    },
    {
      instructions: getServerInstructions(ctx.timezone),
    },
  );

  // Register resources (static/semi-static data)
  registerResources(server, ctx);

  // Register prompts (analysis templates)
  registerPrompts(server);

  // Register tools by domain
  registerTransactionTools(server, ctx);
  registerInvoiceTools(server, ctx);
  registerCustomerTools(server, ctx);
  registerBankAccountTools(server, ctx);
  registerDocumentTools(server, ctx);
  registerTrackerTools(server, ctx);
  registerReportTools(server, ctx);
  registerSearchTools(server, ctx);
  registerInboxTools(server, ctx);

  registerTagTools(server, ctx);
  registerTeamTools(server, ctx);

  return server;
}
