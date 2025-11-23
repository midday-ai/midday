import type { AppContext } from "@api/ai/agents/config/shared";
import { db } from "@midday/db/client";
import { getInvoices } from "@midday/db/queries";
import { getAppUrl } from "@midday/utils/envs";
import { formatAmount, formatDate } from "@midday/utils/format";
import { tool } from "ai";
import { z } from "zod";

const getInvoicesSchema = z.object({
  cursor: z.string().nullable().optional().describe("Pagination cursor"),
  sort: z
    .array(z.string())
    .length(2)
    .nullable()
    .optional()
    .describe("Sort order"),
  pageSize: z.number().min(1).max(100).default(10).describe("Page size"),
  q: z.string().nullable().optional().describe("Search query"),
  start: z.string().nullable().optional().describe("Start date (ISO 8601)"),
  end: z.string().nullable().optional().describe("End date (ISO 8601)"),
  statuses: z
    .array(
      z.enum(["draft", "overdue", "paid", "unpaid", "canceled", "scheduled"]),
    )
    .nullable()
    .optional()
    .describe("Status filter"),
  customers: z.array(z.string()).nullable().optional().describe("Customer IDs"),
});

export const getInvoicesTool = tool({
  description:
    "Retrieve and filter invoices with pagination, sorting, and search.",
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
