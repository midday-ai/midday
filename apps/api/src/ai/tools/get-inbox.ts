import type { AppContext } from "@api/ai/agents/config/shared";
import { db } from "@midday/db/client";
import { getInbox } from "@midday/db/queries";
import { getAppUrl } from "@midday/utils/envs";
import { formatAmount, formatDate } from "@midday/utils/format";
import { tool } from "ai";
import { z } from "zod";

const getInboxSchema = z.object({
  cursor: z
    .string()
    .nullable()
    .optional()
    .describe(
      "Pagination cursor from the previous page. Use the cursor value returned from a previous request to get the next page. Leave empty for first page.",
    ),
  pageSize: z
    .number()
    .min(1)
    .max(100)
    .default(10)
    .describe(
      "Number of inbox items to return per page. Minimum 1, maximum 100. Default is 10. Use smaller values (10-25) for quick overviews, larger (50-100) for comprehensive lists.",
    ),
  q: z
    .string()
    .nullable()
    .optional()
    .describe(
      "Search query string. Searches across inbox item names, descriptions, and amounts. Can search by amount if numeric. Example: 'receipt' or '150.50'",
    ),
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
    .describe(
      "Filter inbox items by status. Use 'new' for unprocessed, 'done' for processed, 'pending' for pending, 'archived' for archived, etc. Example: 'new'",
    ),
  sort: z
    .enum(["date", "alphabetical"])
    .nullable()
    .optional()
    .describe(
      "Sort order. Use 'date' to sort by date (default), 'alphabetical' to sort by name.",
    ),
  order: z
    .enum(["asc", "desc"])
    .nullable()
    .optional()
    .describe(
      "Sort direction. Use 'asc' for ascending, 'desc' for descending. Default is 'desc' for date sorting.",
    ),
});

export const getInboxTool = tool({
  description:
    "Retrieve and filter inbox items with pagination, sorting, and search capabilities. Use this tool when users ask about inbox items, want to see inbox lists, search for specific receipts or documents, or need inbox data for analysis.",
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
