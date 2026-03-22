import type { AppContext } from "@api/ai/context";
import { db } from "@midday/db/client";
import { getTrackerProjects } from "@midday/db/queries";
import { formatAmount, formatDate } from "@midday/utils/format";
import { tool } from "ai";
import { formatDistance } from "date-fns";
import { z } from "zod";

const getTrackerProjectsSchema = z.object({
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
  status: z
    .enum(["in_progress", "completed"])
    .nullable()
    .optional()
    .describe("Project status"),
  customers: z.array(z.string()).nullable().optional().describe("Customer IDs"),
  tags: z.array(z.string()).nullable().optional().describe("Tag IDs"),
});

export const getTrackerProjectsTool = tool({
  description:
    "Retrieve and filter tracker projects with pagination, sorting, and search.",
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

      const locale = appContext.locale ?? "en-US";
      const baseCurrency = appContext.baseCurrency ?? "USD";

      if (result.data.length === 0) {
        yield { text: "No tracker projects found matching your criteria." };
        return { projects: [], total: 0, currency: baseCurrency };
      }

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
          rawRate: project.rate ?? 0,
          totalDuration: formattedDuration,
          durationSeconds: project.totalDuration ?? 0,
          totalAmount: formattedTotalAmount,
          rawTotalAmount: project.totalAmount ?? 0,
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

      const inProgressCount = result.data.filter(
        (p) => p.status === "in_progress",
      ).length;
      const completedCount = result.data.filter(
        (p) => p.status === "completed",
      ).length;

      yield { text: `${result.data.length} projects found` };

      return {
        projects: formattedProjects,
        total: result.data.length,
        totalDuration,
        totalAmount,
        inProgressCount,
        completedCount,
        currency: baseCurrency,
      };
    } catch (error) {
      yield {
        text: `Failed to retrieve tracker projects: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  },
});
