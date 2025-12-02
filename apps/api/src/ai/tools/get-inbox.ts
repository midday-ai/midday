import type { AppContext } from "@api/ai/agents/config/shared";
import { db } from "@midday/db/client";
import { getInbox } from "@midday/db/queries";
import { getAppUrl } from "@midday/utils/envs";
import { formatAmount, formatDate } from "@midday/utils/format";
import { tool } from "ai";
import { z } from "zod";

const getInboxSchema = z.object({
  cursor: z.string().nullable().optional().describe("Pagination cursor"),
  pageSize: z.number().min(1).max(100).default(10).describe("Page size"),
  q: z.string().nullable().optional().describe("Search query"),
  status: z
    .enum([
      "new",
      "archived",
      "processing",
      "done",
      "pending",
      "analyzing",
      "suggested_match",
      "no_match",
    ])
    .nullable()
    .optional()
    .describe("Status filter"),
  sort: z
    .enum(["date", "alphabetical", "document_date"])
    .nullable()
    .optional()
    .describe("Sort field"),
  order: z
    .enum(["asc", "desc"])
    .nullable()
    .optional()
    .describe("Sort direction"),
});

export const getInboxTool = tool({
  description:
    "Retrieve and filter inbox items with pagination, sorting, and search.",
  inputSchema: getInboxSchema,
  execute: async function* (
    { cursor, pageSize = 10, q, status, sort, order },
    executionOptions,
  ) {
    const appContext = executionOptions.experimental_context as AppContext;
    const teamId = appContext.teamId as string;

    if (!teamId) {
      yield {
        text: "Unable to retrieve inbox items: Team ID not found in context.",
      };
      return;
    }

    try {
      const params = {
        teamId,
        cursor: cursor ?? null,
        pageSize,
        q: q ?? null,
        status: status ?? null,
        sort: sort ?? null,
        order: order ?? null,
      };

      const result = await getInbox(db, params);

      if (result.data.length === 0) {
        yield { text: "No inbox items found matching your criteria." };
        return;
      }

      const locale = appContext.locale ?? "en-US";
      const baseCurrency = appContext.baseCurrency ?? "USD";

      const formattedInboxItems = result.data.map((item) => {
        const formattedAmount = item.amount
          ? formatAmount({
              amount: item.amount,
              currency: item.currency || baseCurrency,
              locale,
            })
          : "N/A";

        return {
          id: item.id,
          displayName: item.displayName || item.fileName || "Untitled",
          amount: formattedAmount,
          date: item.date ? formatDate(item.date) : "N/A",
          status: item.status,
          website: item.website || "N/A",
        };
      });

      const totalAmount = result.data.reduce(
        (sum, item) => sum + (item.amount ?? 0),
        0,
      );
      const formattedTotalAmount = formatAmount({
        amount: totalAmount,
        currency: baseCurrency,
        locale,
      });

      const statusCounts = {
        new: result.data.filter((item) => item.status === "new").length,
        done: result.data.filter((item) => item.status === "done").length,
        pending: result.data.filter((item) => item.status === "pending").length,
      };

      const response = `| Name | Amount | Date | Status | Website |\n|------|--------|------|--------|----------|\n${formattedInboxItems.map((item) => `| ${item.displayName} | ${item.amount} | ${item.date} | ${item.status} | ${item.website} |`).join("\n")}\n\n**${result.data.length} inbox items** | Total: ${formattedTotalAmount} | New: ${statusCounts.new} | Done: ${statusCounts.done} | Pending: ${statusCounts.pending}`;

      yield {
        text: response,
        link: {
          text: "View all inbox items",
          url: `${getAppUrl()}/inbox`,
        },
      };
    } catch (error) {
      yield {
        text: `Failed to retrieve inbox items: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  },
});
