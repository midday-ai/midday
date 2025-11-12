import { getWriter } from "@ai-sdk-tools/artifacts";
import type { AppContext } from "@api/ai/agents/config/shared";
import { spendingArtifact } from "@api/ai/artifacts/spending";
import { tool } from "ai";
import { endOfMonth, startOfMonth, subMonths } from "date-fns";
import { z } from "zod";

const getSpendingSchema = z.object({
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

export const getSpendingTool = tool({
  description:
    "Analyze spending patterns for a given period. Provides spending totals, monthly trends, category breakdowns, and insights. Use this tool when users ask about spending, spending analysis, spending patterns, or expenses.",
  inputSchema: getSpendingSchema,
  execute: async function* (
    { from, to, currency, showCanvas },
    executionOptions,
  ) {
    const appContext = executionOptions.experimental_context as AppContext;
    const teamId = appContext.teamId as string;

    if (!teamId) {
      yield {
        text: "Unable to retrieve spending data: Team ID not found in context.",
      };
      return {
        totalSpending: 0,
        currency: currency || appContext.baseCurrency || "USD",
        monthlyData: [],
      };
    }

    try {
      // Initialize artifact only if showCanvas is true
      let analysis: ReturnType<typeof spendingArtifact.stream> | undefined;
      if (showCanvas) {
        const writer = getWriter(executionOptions);
        analysis = spendingArtifact.stream(
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
            totalSpending: 0,
            averageMonthlySpending: 0,
            currentMonthSpending: 0,
          },
          analysis: {
            summary: "Spending analysis will be available soon.",
            recommendations: [],
          },
        });
      }

      yield {
        text: "Spending analysis is not yet implemented. This feature will be available soon.",
      };

      return {
        totalSpending: 0,
        currency: targetCurrency,
        monthlyData: [],
      };
    } catch (error) {
      yield {
        text: `Failed to retrieve spending data: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
      return {
        totalSpending: 0,
        currency: currency || appContext.baseCurrency || "USD",
        monthlyData: [],
      };
    }
  },
});
