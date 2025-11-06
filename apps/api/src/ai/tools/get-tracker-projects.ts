import type { AppContext } from "@api/ai/agents/config/shared";
import { db } from "@midday/db/client";
import { getTrackerProjects } from "@midday/db/queries";
import { getAppUrl } from "@midday/utils/envs";
import { formatAmount, formatDate } from "@midday/utils/format";
import { tool } from "ai";
import { formatDistance } from "date-fns";
import { z } from "zod";

const getTrackerProjectsSchema = z.object({
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
      "Sort order as [field, direction]. Field can be 'name', 'created_at', 'customer', 'time', 'amount', 'assigned', or 'tags'. Direction is 'asc' or 'desc'. Examples: ['name', 'asc'], ['created_at', 'desc']",
    ),
  pageSize: z
    .number()
    .min(1)
    .max(100)
    .default(10)
    .describe(
      "Number of projects to return per page. Minimum 1, maximum 100. Default is 10. Use smaller values (10-25) for quick overviews, larger (50-100) for comprehensive lists.",
    ),
  q: z
    .string()
    .nullable()
    .optional()
    .describe(
      "Search query string. Searches across project names and descriptions. Example: 'Website Redesign'",
    ),
  start: z
    .string()
    .nullable()
    .optional()
    .describe(
      "Start date for date range filter (inclusive) on creation date. Use ISO 8601 format: 'YYYY-MM-DD' or 'YYYY-MM-DDTHH:mm:ss.sssZ'. Example: '2024-01-01' or '2024-01-01T00:00:00.000Z'",
    ),
  end: z
    .string()
    .nullable()
    .optional()
    .describe(
      "End date for date range filter (inclusive) on creation date. Use ISO 8601 format: 'YYYY-MM-DD' or 'YYYY-MM-DDTHH:mm:ss.sssZ'. Example: '2024-12-31' or '2024-12-31T23:59:59.999Z'",
    ),
  status: z
    .enum(["in_progress", "completed"])
    .nullable()
    .optional()
    .describe(
      "Filter projects by status. Use 'in_progress' for active projects, 'completed' for finished projects.",
    ),
  customers: z
    .array(z.string())
    .nullable()
    .optional()
    .describe(
      "Filter by customer IDs. Provide array of customer UUIDs. Example: ['customer-uuid-1', 'customer-uuid-2']",
    ),
  tags: z
    .array(z.string())
    .nullable()
    .optional()
    .describe(
      "Filter by tag IDs. Provide array of tag UUIDs. Example: ['tag-uuid-1', 'tag-uuid-2']",
    ),
});

export const getTrackerProjectsTool = tool({
  description:
    "Retrieve and filter tracker projects with pagination, sorting, and search capabilities. Use this tool when users ask about projects, want to see project lists, search for specific projects, or need project data for analysis.",
  inputSchema: getTrackerProjectsSchema,
  execute: async function* (
    { cursor, sort, pageSize = 10, q, start, end, status, customers, tags },
    executionOptions,
  ) {
    const appContext = executionOptions.experimental_context as AppContext;
    const teamId = appContext.teamId as string;

    if (!teamId) {
      yield {
        text: "Unable to retrieve tracker projects: Team ID not found in context.",
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
        status: status ?? null,
        customers: customers ?? null,
        tags: tags ?? null,
      };

      const result = await getTrackerProjects(db, params);

      if (result.data.length === 0) {
        yield { text: "No tracker projects found matching your criteria." };
        return;
      }

      const locale = appContext.locale ?? "en-US";
      const baseCurrency = appContext.baseCurrency ?? "USD";

      const formattedProjects = result.data.map((project) => {
        const formattedRate = project.rate
          ? formatAmount({
              amount: project.rate,
              currency: project.currency || baseCurrency,
              locale,
            })
          : "N/A";
        const formattedTotalAmount = project.totalAmount
          ? formatAmount({
              amount: project.totalAmount,
              currency: project.currency || baseCurrency,
              locale,
            })
          : "N/A";
        const durationStart = new Date(0);
        const durationEnd = new Date((project.totalDuration ?? 0) * 1000);
        const formattedDuration = formatDistance(durationStart, durationEnd, {
          includeSeconds: false,
        });

        return {
          id: project.id,
          name: project.name,
          status: project.status,
          customerName: project.customer?.name || "No customer",
          rate: formattedRate,
          totalDuration: formattedDuration,
          totalAmount: formattedTotalAmount,
          createdAt: formatDate(project.createdAt),
        };
      });

      const totalDuration = result.data.reduce(
        (sum, p) => sum + (p.totalDuration ?? 0),
        0,
      );
      const totalAmount = result.data.reduce(
        (sum, p) => sum + (p.totalAmount ?? 0),
        0,
      );
      const formattedTotalAmount = formatAmount({
        amount: totalAmount,
        currency: baseCurrency,
        locale,
      });

      const inProgressCount = result.data.filter(
        (p) => p.status === "in_progress",
      ).length;
      const completedCount = result.data.filter(
        (p) => p.status === "completed",
      ).length;

      const durationStart = new Date(0);
      const durationEnd = new Date(totalDuration * 1000);
      const formattedTotalDuration = formatDistance(
        durationStart,
        durationEnd,
        { includeSeconds: false },
      );

      const response = `| Name | Status | Customer | Rate | Duration | Total Amount | Created |\n|------|--------|----------|------|----------|--------------|----------|\n${formattedProjects.map((p) => `| ${p.name} | ${p.status} | ${p.customerName} | ${p.rate} | ${p.totalDuration} | ${p.totalAmount} | ${p.createdAt} |`).join("\n")}\n\n**${result.data.length} projects** | Total Duration: ${formattedTotalDuration} | Total Amount: ${formattedTotalAmount} | In Progress: ${inProgressCount} | Completed: ${completedCount}`;

      yield {
        text: response,
        link: {
          text: "View all projects",
          url: `${getAppUrl()}/tracker`,
        },
      };
    } catch (error) {
      yield {
        text: `Failed to retrieve tracker projects: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  },
});
