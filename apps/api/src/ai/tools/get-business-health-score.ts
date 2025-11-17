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
    .describe("Start date (ISO 8601)"),
  to: z
    .string()
    .default(() => endOfMonth(new Date()).toISOString())
    .describe("End date (ISO 8601)"),
  currency: z
    .string()
    .describe("Currency code (ISO 4217, e.g. 'USD')")
    .nullable()
    .optional(),
  showCanvas: z.boolean().default(false).describe("Show visual analytics"),
});

export const getBusinessHealthScoreTool = tool({
  description:
    "Calculate business health score (0-100) - composite score based on revenue, expenses, cash flow, and profitability metrics.",
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
