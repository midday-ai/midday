import { getWriter } from "@ai-sdk-tools/artifacts";
import type { AppContext } from "@api/ai/agents/config/shared";
import { businessHealthScoreArtifact } from "@api/ai/artifacts/business-health-score";
import { tool } from "ai";
import { endOfMonth, startOfMonth, subMonths } from "date-fns";
import { z } from "zod";

const getBusinessHealthScoreSchema = z.object({
  from: z
    .string()
    .default(() => startOfMonth(subMonths(new Date(), 12)).toISOString())
    .describe("The start date when to retrieve data from. In ISO-8601 format."),
  to: z
    .string()
    .default(() => endOfMonth(new Date()).toISOString())
    .describe(
      "The end date when to retrieve data from. Defaults to end of current month. Return ISO-8601 format",
    ),
  currency: z
    .string()
    .describe("Optional currency code (e.g., 'USD', 'SEK')")
    .nullable()
    .optional(),
  showCanvas: z
    .boolean()
    .default(false)
    .describe(
      "Whether to show detailed visual analytics. Use true for in-depth analysis requests, trends, breakdowns, or when user asks for charts/visuals. Use false for simple questions or quick answers.",
    ),
});

export const getBusinessHealthScoreTool = tool({
  description:
    "Calculate business health score based on multiple financial metrics including revenue, expenses, cash flow, and profitability. Provides an overall health score and breakdown by category. Use this tool when users ask about business health, financial health, business score, or overall financial performance.",
  inputSchema: getBusinessHealthScoreSchema,
  execute: async function* (
    { from, to, currency, showCanvas },
    executionOptions,
  ) {
    const appContext = executionOptions.experimental_context as AppContext;
    const teamId = appContext.teamId as string;

    if (!teamId) {
      yield {
        text: "Unable to retrieve business health score: Team ID not found in context.",
      };
      return {
        overallScore: 0,
        currency: currency || appContext.baseCurrency || "USD",
      };
    }

    try {
      // Initialize artifact only if showCanvas is true
      let analysis:
        | ReturnType<typeof businessHealthScoreArtifact.stream>
        | undefined;
      if (showCanvas) {
        const writer = getWriter(executionOptions);
        analysis = businessHealthScoreArtifact.stream(
          {
            stage: "loading",
            currency: currency || appContext.baseCurrency || "USD",
          },
          writer,
        );
      }

      // TODO: Implement actual data fetching
      // For now, return empty data
      const targetCurrency = currency || appContext.baseCurrency || "USD";

      // Update artifact with dummy data if showCanvas is true
      if (showCanvas && analysis) {
        await analysis.update({
          stage: "analysis_ready",
          currency: targetCurrency,
          chart: {
            monthlyData: [],
          },
          metrics: {
            overallScore: 0,
            revenueScore: 0,
            expenseScore: 0,
            cashFlowScore: 0,
            profitabilityScore: 0,
          },
          analysis: {
            summary: "Business health score analysis will be available soon.",
            recommendations: [],
          },
        });
      }

      yield {
        text: "Business health score analysis is not yet implemented. This feature will be available soon.",
      };

      return {
        overallScore: 0,
        currency: targetCurrency,
      };
    } catch (error) {
      yield {
        text: `Failed to retrieve business health score: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
      return {
        overallScore: 0,
        currency: currency || appContext.baseCurrency || "USD",
      };
    }
  },
});
