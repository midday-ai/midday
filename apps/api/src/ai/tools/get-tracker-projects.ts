import type { AppContext } from "@api/ai/agents/config/shared";
import { db } from "@midday/db/client";
import { getTrackerProjects } from "@midday/db/queries";
import { getAppUrl } from "@midday/utils/envs";
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
