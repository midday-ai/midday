import type { AppContext } from "@api/ai/agents/config/shared";
import { db } from "@midday/db/client";
import { getInvoices } from "@midday/db/queries";
import { getAppUrl } from "@midday/utils/envs";
import { formatAmount, formatDate } from "@midday/utils/format";
import { tool } from "ai";
import { z } from "zod";

const getInvoicesSchema = z.object({
  cursor: z
    .string()
    .nullable()
    .optional()
    .describe(
      "Pagination cursor from the previous page. Use the cursor value returned from a previous request to get the next page. Leave empty for first page.",
    ),
  sort: z
    .array(z.string())
    .length(2)
    .nullable()
    .optional()
    .describe(
      "Sort order as [field, direction]. Field can be 'customer', 'created_at', 'due_date', 'amount', or 'status'. Direction is 'asc' or 'desc'. Examples: ['created_at', 'desc'], ['amount', 'asc']",
    ),
  pageSize: z
    .number()
    .min(1)
    .max(100)
    .default(10)
    .describe(
      "Number of invoices to return per page. Minimum 1, maximum 100. Default is 10. Use smaller values (10-25) for quick overviews, larger (50-100) for comprehensive lists.",
    ),
  q: z
    .string()
    .nullable()
    .optional()
    .describe(
      "Search query string. Searches across invoice numbers, customer names, and amounts. Can search by amount if numeric. Example: 'INV-001' or '1500'",
    ),
  start: z
    .string()
    .nullable()
    .optional()
    .describe(
      "Start date for date range filter (inclusive) on due date. Use ISO 8601 format: 'YYYY-MM-DD' or 'YYYY-MM-DDTHH:mm:ss.sssZ'. Example: '2024-01-01' or '2024-01-01T00:00:00.000Z'",
    ),
  end: z
    .string()
    .nullable()
    .optional()
    .describe(
      "End date for date range filter (inclusive) on due date. Use ISO 8601 format: 'YYYY-MM-DD' or 'YYYY-MM-DDTHH:mm:ss.sssZ'. Example: '2024-12-31' or '2024-12-31T23:59:59.999Z'",
    ),
  statuses: z
    .array(
      z.enum(["draft", "overdue", "paid", "unpaid", "canceled", "scheduled"]),
    )
    .nullable()
    .optional()
    .describe(
      "Filter invoices by status. Use 'draft' for unsent, 'paid' for paid, 'unpaid' for outstanding, 'overdue' for past due, 'canceled' for canceled, 'scheduled' for scheduled. Example: ['unpaid', 'overdue']",
    ),
  customers: z
    .array(z.string())
    .nullable()
    .optional()
    .describe(
      "Filter by customer IDs. Provide array of customer UUIDs. Example: ['customer-uuid-1', 'customer-uuid-2']",
    ),
});

export const getInvoicesTool = tool({
  description:
    "Retrieve and filter invoices with pagination, sorting, and search capabilities. Use this tool when users ask about invoices, want to see invoice lists, search for specific invoices, track payments, or monitor overdue accounts.",
  inputSchema: getInvoicesSchema,
  execute: async function* (
    { cursor, sort, pageSize = 10, q, start, end, statuses, customers },
    executionOptions,
  ) {
    const appContext = executionOptions.experimental_context as AppContext;
    const teamId = appContext.teamId as string;

    if (!teamId) {
      yield {
        text: "Unable to retrieve invoices: Team ID not found in context.",
      };
      return;
    }

    try {
      const params = {
        teamId,
        cursor: cursor ?? null,
        sort: sort ?? null,
        pageSize,
        q: q ?? null,
        start: start ?? null,
        end: end ?? null,
        statuses: statuses ?? null,
        customers: customers ?? null,
      };

      const result = await getInvoices(db, params);

      if (result.data.length === 0) {
        yield { text: "No invoices found matching your criteria." };
        return;
      }

      const locale = appContext.locale ?? "en-US";
      const baseCurrency = appContext.baseCurrency ?? "USD";

      const formattedInvoices = result.data.map((invoice) => {
        const formattedAmount = formatAmount({
          amount: invoice.amount ?? 0,
          currency: invoice.currency || baseCurrency,
          locale,
        });

        return {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber || "Draft",
          customerName:
            invoice.customerName || invoice.customer?.name || "No customer",
          amount: formattedAmount,
          status: invoice.status,
          dueDate: invoice.dueDate ? formatDate(invoice.dueDate) : "N/A",
          createdAt: formatDate(invoice.createdAt),
        };
      });

      const totalAmount = result.data.reduce(
        (sum, inv) => sum + (inv.amount ?? 0),
        0,
      );
      const formattedTotalAmount = formatAmount({
        amount: totalAmount,
        currency: baseCurrency,
        locale,
      });

      const paidCount = result.data.filter(
        (inv) => inv.status === "paid",
      ).length;
      const unpaidCount = result.data.filter(
        (inv) => inv.status === "unpaid",
      ).length;
      const overdueCount = result.data.filter(
        (inv) => inv.status === "overdue",
      ).length;

      const response = `| Invoice # | Customer | Amount | Status | Due Date | Created |\n|-----------|---------|--------|--------|----------|----------|\n${formattedInvoices.map((inv) => `| ${inv.invoiceNumber} | ${inv.customerName} | ${inv.amount} | ${inv.status} | ${inv.dueDate} | ${inv.createdAt} |`).join("\n")}\n\n**${result.data.length} invoices** | Total: ${formattedTotalAmount} | Paid: ${paidCount} | Unpaid: ${unpaidCount} | Overdue: ${overdueCount}`;

      yield {
        text: response,
        link: {
          text: "View all invoices",
          url: `${getAppUrl()}/invoices`,
        },
      };
    } catch (error) {
      yield {
        text: `Failed to retrieve invoices: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  },
});
