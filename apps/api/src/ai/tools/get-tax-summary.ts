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

export const getTaxSummaryTool = tool({
  description:
    "Generate tax summary - shows tax liability, taxable income, and tax rates for a given period.",
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
