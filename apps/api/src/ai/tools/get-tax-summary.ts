import { getWriter } from "@ai-sdk-tools/artifacts";
import type { AppContext } from "@api/ai/agents/config/shared";
import { taxSummaryArtifact } from "@api/ai/artifacts/tax-summary";
import { tool } from "ai";
import { endOfMonth, startOfMonth, subMonths } from "date-fns";
import { z } from "zod";

const getTaxSummarySchema = z.object({
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

export const getTaxSummaryTool = tool({
  description:
    "Generate a tax summary showing tax liability, taxable income, and tax rates for a given period. Use this tool when users ask about taxes, tax summary, tax liability, taxable income, or tax planning.",
  inputSchema: getTaxSummarySchema,
  execute: async function* (
    { from, to, currency, showCanvas },
    executionOptions,
  ) {
    const appContext = executionOptions.experimental_context as AppContext;
    const teamId = appContext.teamId as string;

    if (!teamId) {
      yield {
        text: "Unable to retrieve tax summary: Team ID not found in context.",
      };
      return {
        totalTaxLiability: 0,
        totalTaxableIncome: 0,
        currency: currency || appContext.baseCurrency || "USD",
      };
    }

    try {
      // Initialize artifact only if showCanvas is true
      let analysis: ReturnType<typeof taxSummaryArtifact.stream> | undefined;
      if (showCanvas) {
        const writer = getWriter(executionOptions);
        analysis = taxSummaryArtifact.stream(
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
            totalTaxLiability: 0,
            totalTaxableIncome: 0,
            effectiveTaxRate: 0,
          },
          analysis: {
            summary: "Tax summary will be available soon.",
            recommendations: [],
          },
        });
      }

      yield {
        text: "Tax summary is not yet implemented. This feature will be available soon.",
      };

      return {
        totalTaxLiability: 0,
        totalTaxableIncome: 0,
        currency: targetCurrency,
      };
    } catch (error) {
      yield {
        text: `Failed to retrieve tax summary: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
      return {
        totalTaxLiability: 0,
        totalTaxableIncome: 0,
        currency: currency || appContext.baseCurrency || "USD",
      };
    }
  },
});

