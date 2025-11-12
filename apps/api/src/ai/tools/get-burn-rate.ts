import { getWriter } from "@ai-sdk-tools/artifacts";
import type { AppContext } from "@api/ai/agents/config/shared";
import { burnRateArtifact } from "@api/ai/artifacts/burn-rate";
import { tool } from "ai";
import { endOfMonth, startOfMonth, subMonths } from "date-fns";
import { z } from "zod";

const getBurnRateSchema = z.object({
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

export const getBurnRateTool = tool({
  description:
    "Calculate and analyze monthly cash burn rate, showing how much money the business spends each month. Use this tool when users ask about burn rate, spending patterns, cash flow analysis, or want to understand their monthly expenses and financial runway.",
  inputSchema: getBurnRateSchema,
  execute: async function* (
    { from, to, currency, showCanvas },
    executionOptions,
  ) {
    const appContext = executionOptions.experimental_context as AppContext;
    const teamId = appContext.teamId as string;

    if (!teamId) {
      yield {
        text: "Unable to retrieve burn rate: Team ID not found in context.",
      };
      return {
        currentMonthlyBurn: 0,
        averageBurnRate: 0,
        runway: 0,
        currency: currency || appContext.baseCurrency || "USD",
      };
    }

    try {
      // Initialize artifact only if showCanvas is true
      let analysis: ReturnType<typeof burnRateArtifact.stream> | undefined;
      if (showCanvas) {
        const writer = getWriter(executionOptions);
        analysis = burnRateArtifact.stream(
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
            currentMonthlyBurn: 0,
            averageBurnRate: 0,
            runway: 0,
            runwayStatus: "unknown",
          },
          analysis: {
            summary: "Burn rate analysis will be available soon.",
            recommendations: [],
          },
        });
      }

      yield {
        text: "Burn rate analysis is not yet implemented. This feature will be available soon.",
      };

      return {
        currentMonthlyBurn: 0,
        averageBurnRate: 0,
        runway: 0,
        currency: targetCurrency,
      };
    } catch (error) {
      yield {
        text: `Failed to retrieve burn rate: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
      return {
        currentMonthlyBurn: 0,
        averageBurnRate: 0,
        runway: 0,
        currency: currency || appContext.baseCurrency || "USD",
      };
    }
  },
});
