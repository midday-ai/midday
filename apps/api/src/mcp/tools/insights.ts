import {
  insightByIdSchema,
  insightByPeriodSchema,
  latestInsightSchema,
  listInsightsSchema,
} from "@api/schemas/insights";
import {
  getInsightById,
  getInsightByPeriod,
  getInsightsForUser,
  getLatestInsight,
} from "@midday/db/queries";
import { hasScope, READ_ONLY_ANNOTATIONS, type RegisterTools } from "../types";

export const registerInsightTools: RegisterTools = (server, ctx) => {
  const { db, teamId, userId } = ctx;

  // Require insights.read scope
  if (!hasScope(ctx, "insights.read")) {
    return;
  }

  server.registerTool(
    "insights_list",
    {
      title: "List Insights",
      description:
        "List AI-generated business insights with filtering by period type. Returns paginated insights with read/dismiss status.",
      inputSchema: listInsightsSchema.shape,
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async (params) => {
      const result = await getInsightsForUser(db, {
        teamId,
        userId,
        periodType: params.periodType ?? undefined,
        pageSize: params.limit ?? 10,
        cursor: params.cursor ?? undefined,
        includeDismissed: params.includeDismissed ?? false,
        status: "completed",
      });

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.registerTool(
    "insights_latest",
    {
      title: "Get Latest Insight",
      description:
        "Get the most recent completed insight, optionally filtered by period type (weekly, monthly, quarterly, yearly).",
      inputSchema: latestInsightSchema.shape,
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async (params) => {
      const result = await getLatestInsight(db, {
        teamId,
        periodType: params.periodType ?? undefined,
      });

      if (!result) {
        return {
          content: [
            {
              type: "text",
              text: "No insights available yet. Insights are generated automatically and will appear here once ready.",
            },
          ],
        };
      }

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.registerTool(
    "insights_get",
    {
      title: "Get Insight by ID",
      description: "Get a specific insight by its unique identifier.",
      inputSchema: insightByIdSchema.shape,
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async ({ id }) => {
      const result = await getInsightById(db, { id, teamId });

      if (!result) {
        return {
          content: [{ type: "text", text: "Insight not found" }],
          isError: true,
        };
      }

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.registerTool(
    "insights_by_period",
    {
      title: "Get Insight by Period",
      description:
        "Get an insight for a specific period (e.g., week 3 of 2024, Q2 2024).",
      inputSchema: insightByPeriodSchema.shape,
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async (params) => {
      const result = await getInsightByPeriod(db, {
        teamId,
        periodType: params.periodType,
        periodYear: params.periodYear,
        periodNumber: params.periodNumber,
      });

      if (!result) {
        return {
          content: [{ type: "text", text: "No insight found for this period" }],
        };
      }

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    },
  );
};
