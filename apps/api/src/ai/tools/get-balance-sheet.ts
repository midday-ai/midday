import { getWriter } from "@ai-sdk-tools/artifacts";
import type { AppContext } from "@api/ai/agents/config/shared";
import { balanceSheetArtifact } from "@api/ai/artifacts/balance-sheet";
import { getToolDateDefaults } from "@api/ai/utils/tool-date-defaults";
import { tool } from "ai";
import { endOfMonth, startOfMonth } from "date-fns";
import { z } from "zod";

const getBalanceSheetSchema = z.object({
  from: z.string().optional().describe("Start date (ISO 8601)"),
  to: z.string().optional().describe("End date (ISO 8601)"),
  currency: z
    .string()
    .describe("Currency code (ISO 4217, e.g. 'USD')")
    .nullable()
    .optional(),
  showCanvas: z.boolean().default(false).describe("Show visual analytics"),
});

export const getBalanceSheetTool = tool({
  description:
    "Generate balance sheet - shows assets, liabilities, and equity for a given period.",
  inputSchema: getBalanceSheetSchema,
  execute: async function* (
    { from, to, currency, showCanvas },
    executionOptions,
  ) {
    const appContext = executionOptions.experimental_context as AppContext;
    const teamId = appContext.teamId as string;

    if (!teamId) {
      yield {
        text: "Unable to retrieve balance sheet: Team ID not found in context.",
      };
      return {
        totalAssets: 0,
        totalLiabilities: 0,
        totalEquity: 0,
        currency: currency || appContext.baseCurrency || "USD",
      };
    }

    try {
      // Use fiscal year-aware defaults if dates not provided
      const defaultDates = getToolDateDefaults(appContext.fiscalYearStartMonth);
      const finalFrom = from ?? defaultDates.from;
      const finalTo = to ?? defaultDates.to;

      // Initialize artifact only if showCanvas is true
      let analysis: ReturnType<typeof balanceSheetArtifact.stream> | undefined;
      if (showCanvas) {
        const writer = getWriter(executionOptions);
        analysis = balanceSheetArtifact.stream(
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
            totalAssets: 0,
            totalLiabilities: 0,
            totalEquity: 0,
          },
          analysis: {
            summary: "Balance sheet will be available soon.",
            recommendations: [],
          },
        });
      }

      yield {
        text: "Balance sheet is not yet implemented. This feature will be available soon.",
      };

      return {
        totalAssets: 0,
        totalLiabilities: 0,
        totalEquity: 0,
        currency: targetCurrency,
      };
    } catch (error) {
      yield {
        text: `Failed to retrieve balance sheet: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
      return {
        totalAssets: 0,
        totalLiabilities: 0,
        totalEquity: 0,
        currency: currency || appContext.baseCurrency || "USD",
      };
    }
  },
});
