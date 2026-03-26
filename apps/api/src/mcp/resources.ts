import { CATEGORIES } from "@midday/categories";
import {
  getCustomerById,
  getCustomers,
  getInvoiceById,
  getInvoices,
  getTags,
  getTeamById,
  getTransactionById,
  getTransactions,
} from "@midday/db/queries";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  mcpCustomerDetailSchema,
  mcpInvoiceDetailSchema,
  mcpTagResponseSchema,
  mcpTeamSchema,
  mcpTransactionDetailSchema,
  sanitize,
  sanitizeArray,
} from "./schemas";
import { hasScope, type McpContext } from "./types";
import { DASHBOARD_URL } from "./utils";

const REPORT_TYPES = [
  "revenue",
  "profit",
  "burn_rate",
  "runway",
  "expenses",
  "spending",
  "tax_summary",
  "growth_rate",
  "profit_margin",
  "cash_flow",
  "recurring_expenses",
  "revenue_forecast",
  "balance_sheet",
];

export function registerResources(server: McpServer, ctx: McpContext): void {
  const { db, teamId } = ctx;

  // ==========================================
  // STATIC RESOURCES
  // ==========================================

  if (hasScope(ctx, "teams.read")) {
    server.registerResource(
      "team",
      "midday://team/info",
      {
        description:
          "Current team information including name, base currency, and settings",
        mimeType: "application/json",
      },
      async () => {
        const team = await getTeamById(db, teamId);
        const clean = team ? sanitize(mcpTeamSchema, team) : team;

        return {
          contents: [
            {
              uri: "midday://team/info",
              mimeType: "application/json",
              text: JSON.stringify(clean),
            },
          ],
        };
      },
    );
  }

  server.registerResource(
    "categories",
    "midday://categories",
    {
      description:
        "List of all transaction categories with their hierarchy, colors, and slugs",
      mimeType: "application/json",
    },
    async () => {
      return {
        contents: [
          {
            uri: "midday://categories",
            mimeType: "application/json",
            text: JSON.stringify(CATEGORIES),
          },
        ],
      };
    },
  );

  if (hasScope(ctx, "tags.read")) {
    server.registerResource(
      "tags",
      "midday://tags",
      {
        description: "List of all custom tags used for organizing data",
        mimeType: "application/json",
      },
      async () => {
        const tags = await getTags(db, { teamId });
        const clean = sanitizeArray(mcpTagResponseSchema, tags ?? []);

        return {
          contents: [
            {
              uri: "midday://tags",
              mimeType: "application/json",
              text: JSON.stringify(clean),
            },
          ],
        };
      },
    );
  }

  // ==========================================
  // RESOURCE TEMPLATES
  // ==========================================

  if (hasScope(ctx, "transactions.read")) {
    server.registerResource(
      "transaction",
      new ResourceTemplate("midday://transactions/{transactionId}", {
        list: async () => {
          const result = await getTransactions(db, {
            teamId,
            cursor: null,
            pageSize: 10,
            q: null,
            start: null,
            end: null,
            categories: null,
            statuses: null,
            type: null,
            accounts: null,
            sort: null,
            tags: null,
            assignees: null,
            recurring: null,
            attachments: null,
            amountRange: null,
            amount: null,
            manual: null,
          });

          return {
            resources: (result.data ?? []).map((t) => ({
              uri: `midday://transactions/${t.id}`,
              name: t.name ?? `Transaction ${t.id}`,
              mimeType: "application/json" as const,
            })),
          };
        },
      }),
      {
        description:
          "A single bank transaction by ID with full details including amount, category, merchant, and attachments",
        mimeType: "application/json",
      },
      async (uri, { transactionId }) => {
        const result = await getTransactionById(db, {
          id: transactionId as string,
          teamId,
        });

        const clean = result
          ? sanitize(mcpTransactionDetailSchema, result)
          : null;

        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "application/json",
              text: clean
                ? JSON.stringify(clean)
                : JSON.stringify({ error: "Transaction not found" }),
            },
          ],
        };
      },
    );
  }

  if (hasScope(ctx, "invoices.read")) {
    server.registerResource(
      "invoice",
      new ResourceTemplate("midday://invoices/{invoiceId}", {
        list: async () => {
          const result = await getInvoices(db, {
            teamId,
            cursor: null,
            pageSize: 10,
            q: null,
            start: null,
            end: null,
            statuses: null,
            customers: null,
            sort: null,
          });

          return {
            resources: (result.data ?? []).map((inv) => ({
              uri: `midday://invoices/${inv.id}`,
              name: inv.invoiceNumber ?? `Invoice ${inv.id}`,
              mimeType: "application/json" as const,
            })),
          };
        },
      }),
      {
        description:
          "A single invoice by ID with line items, customer info, amounts, tax, and payment status",
        mimeType: "application/json",
      },
      async (uri, { invoiceId }) => {
        const result = await getInvoiceById(db, {
          id: invoiceId as string,
          teamId,
        });

        const previewUrl = result?.token
          ? `${DASHBOARD_URL}/i/${result.token}`
          : null;

        const clean = result
          ? sanitize(mcpInvoiceDetailSchema, { ...result, previewUrl })
          : null;

        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "application/json",
              text: clean
                ? JSON.stringify(clean)
                : JSON.stringify({ error: "Invoice not found" }),
            },
          ],
        };
      },
    );
  }

  if (hasScope(ctx, "customers.read")) {
    server.registerResource(
      "customer",
      new ResourceTemplate("midday://customers/{customerId}", {
        list: async () => {
          const result = await getCustomers(db, {
            teamId,
            cursor: null,
            pageSize: 10,
            q: null,
            sort: null,
          });

          return {
            resources: (result.data ?? []).map((c) => ({
              uri: `midday://customers/${c.id}`,
              name: c.name ?? `Customer ${c.id}`,
              mimeType: "application/json" as const,
            })),
          };
        },
      }),
      {
        description:
          "A single customer by ID with contact details, address, and billing info",
        mimeType: "application/json",
      },
      async (uri, { customerId }) => {
        const result = await getCustomerById(db, {
          id: customerId as string,
          teamId,
        });

        const clean = result ? sanitize(mcpCustomerDetailSchema, result) : null;

        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "application/json",
              text: clean
                ? JSON.stringify(clean)
                : JSON.stringify({ error: "Customer not found" }),
            },
          ],
        };
      },
    );
  }

  if (hasScope(ctx, "reports.read")) {
    server.registerResource(
      "report-type",
      new ResourceTemplate("midday://reports/{reportType}", {
        list: async () => ({
          resources: REPORT_TYPES.map((type) => ({
            uri: `midday://reports/${type}`,
            name: type
              .split("_")
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(" "),
            mimeType: "application/json" as const,
          })),
        }),
        complete: {
          reportType: async (value) =>
            REPORT_TYPES.filter((t) => t.startsWith(value)),
        },
      }),
      {
        description:
          "Description and available parameters for a specific report type. Use this to discover what reports are available and their input requirements.",
        mimeType: "application/json",
      },
      async (uri, { reportType }) => {
        const type = reportType as string;
        const isValid = REPORT_TYPES.includes(type);

        const reportInfo = isValid
          ? {
              type,
              toolName: `reports_${type}`,
              description: `Use the reports_${type} tool to run this report with date range and currency parameters.`,
            }
          : {
              error: `Unknown report type: ${type}`,
              availableTypes: REPORT_TYPES,
            };

        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "application/json",
              text: JSON.stringify(reportInfo),
            },
          ],
        };
      },
    );
  }
}
