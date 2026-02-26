import type { AppContext } from "@api/ai/agents/config/shared";
import { db } from "@midday/db/client";
import { getDeals } from "@midday/db/queries";
import { getAppUrl } from "@midday/utils/envs";
import { formatAmount, formatDate } from "@midday/utils/format";
import { tool } from "ai";
import { z } from "zod";

const getDealsSchema = z.object({
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
  merchants: z.array(z.string()).nullable().optional().describe("Merchant IDs"),
});

export const getDealsTool = tool({
  description:
    "Retrieve and filter deals with pagination, sorting, and search.",
  inputSchema: getDealsSchema,
  execute: async function* (
    { cursor, sort, pageSize = 10, q, start, end, statuses, merchants },
    executionOptions,
  ) {
    const appContext = executionOptions.experimental_context as AppContext;
    const teamId = appContext.teamId as string;

    if (!teamId) {
      yield {
        text: "Unable to retrieve deals: Team ID not found in context.",
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
        merchants: merchants ?? null,
      };

      const result = await getDeals(db, params);

      if (result.data.length === 0) {
        yield { text: "No deals found matching your criteria." };
        return;
      }

      const locale = appContext.locale ?? "en-US";
      const baseCurrency = appContext.baseCurrency ?? "USD";

      const formattedDeals = result.data.map((deal) => {
        const formattedAmount = formatAmount({
          amount: deal.amount ?? 0,
          currency: deal.currency || baseCurrency,
          locale,
        });

        return {
          id: deal.id,
          dealNumber: deal.dealNumber || "Draft",
          merchantName:
            deal.merchantName || deal.merchant?.name || "No merchant",
          amount: formattedAmount,
          status: deal.status,
          dueDate: deal.dueDate ? formatDate(deal.dueDate) : "N/A",
          createdAt: formatDate(deal.createdAt),
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

      const response = `| Deal # | Merchant | Amount | Status | Due Date | Created |\n|-----------|---------|--------|--------|----------|----------|\n${formattedDeals.map((inv) => `| ${inv.dealNumber} | ${inv.merchantName} | ${inv.amount} | ${inv.status} | ${inv.dueDate} | ${inv.createdAt} |`).join("\n")}\n\n**${result.data.length} deals** | Total: ${formattedTotalAmount} | Paid: ${paidCount} | Unpaid: ${unpaidCount} | Overdue: ${overdueCount}`;

      yield {
        text: response,
        link: {
          text: "View all deals",
          url: `${getAppUrl()}/deals`,
        },
      };
    } catch (error) {
      yield {
        text: `Failed to retrieve deals: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  },
});
