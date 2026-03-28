import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerMcpApps } from "./apps";
import { registerPrompts } from "./prompts";
import { registerResources } from "./resources";
import {
  registerBankAccountTools,
  registerCategoryTools,
  registerCustomerTools,
  registerDocumentTools,
  registerInboxTools,
  registerInvoiceProductTools,
  registerInvoiceRecurringTools,
  registerInvoiceTemplateTools,
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

const MCP_SERVER_VERSION =
  process.env.RAILWAY_GIT_COMMIT_SHA?.slice(0, 7) || "1.0.0";

function getServerInstructions(ctx: McpContext): string {
  const dateCtx = getDateContext(ctx.timezone);
  const userLocale = ctx.locale || "en";
  const userCountry = ctx.countryCode || null;
  const dateFormat = ctx.dateFormat || null;
  const timeFormat = ctx.timeFormat ?? 24;

  return `Midday is a financial operating system for small businesses. This MCP server provides access to financial data including transactions, invoices, customers, time tracking, documents, and reports.

## Current Date & Timezone

Today is ${dateCtx.date} in the user's timezone (${dateCtx.timezone}). The current year is ${dateCtx.year}, current quarter is Q${dateCtx.quarter}. Use these for default date ranges:
- This month: from ${dateCtx.monthStart} to ${dateCtx.date}
- This quarter: from ${dateCtx.quarterStart} to ${dateCtx.date}
- This year: from ${dateCtx.yearStart} to ${dateCtx.date}

## Locale & Formatting

The user's locale is "${userLocale}"${userCountry ? ` (country: ${userCountry})` : ""}${dateFormat ? `, preferred date format: "${dateFormat}"` : ""}. Time format: ${timeFormat === 12 ? "12-hour (AM/PM)" : "24-hour"}. When presenting data to the user:
- Format currency amounts according to the locale (e.g. "$1,234.56" for en-US, "1.234,56 €" for de-DE, "1 234,56 kr" for sv-SE).
- Use the team's baseCurrency from team_get for the currency code unless amounts already specify a currency.
- Format dates using the user's preferred date format when set, otherwise use the locale's conventional format.
- Use the locale for number formatting (decimal and thousands separators).
- Use the user's preferred time format (12-hour or 24-hour) when displaying times.

## Tool Organization

Tools are namespaced by domain — use the prefix to discover related tools:
- transactions_* — Bank transactions (income and expenses)
- invoices_* — Invoice lifecycle management
- customers_* — Customer CRM data
- tracker_* — Time tracking projects and entries
- reports_* — Financial reports and analytics
- documents_* — File vault for receipts and documents
- inbox_* — Incoming receipts and documents pending processing
- bank_accounts_* — Connected bank account information
- categories_* — Transaction categories (create, update, delete custom categories)
- invoice_template_* — Invoice template labels and settings (title, customerLabel, vatLabel, currency, etc.)
- invoice_products_* — Reusable line item product catalog
- invoice_recurring_* — Recurring invoice schedules
- tags_* — Reusable labels for organizing records
- team_* — Team metadata and member information
- search_global — Full-text search across all data types

## Key Patterns

- All monetary amounts use the team's base currency unless a currency parameter is provided.
- Date parameters use ISO 8601 format (YYYY-MM-DD for dates, full ISO for timestamps).
- Most list tools support cursor-based pagination; pass the returned cursor to fetch the next page. Some tools (tags_list, bank_accounts_list, team_members) return full results without pagination.
- Most report tools require date ranges (from/to). Exceptions: reports_runway (currency only), reports_balance_sheet (optional asOf date), reports_recurring_expenses (optional from/to).
- Use search_global for quick lookups across all data types instead of listing each type separately.
- Call team_get first when you need the team's base currency, locale, or settings.
- Transaction statuses differ between list filters and update actions — the enum values in each tool's input schema define which statuses are valid for that operation.
- Tool errors return isError: true with a text explanation; resource reads may return JSON with an "error" field when a record is missing.
`;
}

export { MCP_SERVER_VERSION };

export function createMcpServer(ctx: McpContext): McpServer {
  const server = new McpServer(
    {
      name: "midday",
      version: MCP_SERVER_VERSION,
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
      instructions: getServerInstructions(ctx),
    },
  );

  // Register resources (static/semi-static data)
  registerResources(server, ctx);

  // Register prompts (analysis templates)
  registerPrompts(server);

  // Register tools by domain
  registerTransactionTools(server, ctx);
  registerCategoryTools(server, ctx);
  registerInvoiceTools(server, ctx);
  registerInvoiceProductTools(server, ctx);
  registerInvoiceRecurringTools(server, ctx);
  registerInvoiceTemplateTools(server, ctx);
  registerCustomerTools(server, ctx);
  registerBankAccountTools(server, ctx);
  registerDocumentTools(server, ctx);
  registerTrackerTools(server, ctx);
  registerReportTools(server, ctx);
  registerSearchTools(server, ctx);
  registerInboxTools(server, ctx);
  registerTagTools(server, ctx);
  registerTeamTools(server, ctx);

  registerMcpApps(server);

  return server;
}
