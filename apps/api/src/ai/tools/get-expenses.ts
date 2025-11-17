import { getWriter } from "@ai-sdk-tools/artifacts";
import type { AppContext } from "@api/ai/agents/config/shared";
import { expensesArtifact } from "@api/ai/artifacts/expenses";
import { getToolDateDefaults } from "@api/ai/utils/tool-date-defaults";
import { tool } from "ai";
import { endOfMonth, startOfMonth } from "date-fns";
import { z } from "zod";

const getExpensesSchema = z.object({
  from: z.string().optional().describe("Start date (ISO 8601)"),
  to: z.string().optional().describe("End date (ISO 8601)"),
  currency: z
    .string()
    .describe("Currency code (ISO 4217, e.g. 'USD')")
    .nullable()
    .optional(),
  showCanvas: z.boolean().default(false).describe("Show visual analytics"),
});

export const getExpensesTool = tool({
  description:
    "Analyze expenses by category - shows expense totals grouped by category with percentages and monthly trends.",
  inputSchema: getExpensesSchema,
  execute: async function* (
    { from, to, currency, showCanvas },
    executionOptions,
  ) {
    const appContext = executionOptions.experimental_context as AppContext;
    const teamId = appContext.teamId as string;

    if (!teamId) {
      yield {
        text: "Unable to retrieve expenses: Team ID not found in context.",
      };
      return {
        totalExpenses: 0,
        currency: currency || appContext.baseCurrency || "USD",
        categoryData: [],
      };
    }

    try {
      // Use fiscal year-aware defaults if dates not provided
      const defaultDates = getToolDateDefaults(appContext.fiscalYearStartMonth);
      const finalFrom = from ?? defaultDates.from;
      const finalTo = to ?? defaultDates.to;

      // Initialize artifact only if showCanvas is true
      let analysis: ReturnType<typeof expensesArtifact.stream> | undefined;
      if (showCanvas) {
        const writer = getWriter(executionOptions);
        analysis = expensesArtifact.stream(
          {
            stage: "loading",
            currency: currency || appContext.baseCurrency || "USD",
          },
          writer,
        );
      }

      // TODO: Implement actual data fetching (use finalFrom and finalTo when implemented)
      // For now, return empty data
      const targetCurrency = currency || appContext.baseCurrency || "USD";

      // Update artifact with dummy data if showCanvas is true
      if (showCanvas && analysis) {
        await analysis.update({
          stage: "analysis_ready",
          currency: targetCurrency,
          chart: {
            categoryData: [],
          },
          metrics: {
            totalExpenses: 0,
            averageMonthlyExpenses: 0,
          },
          analysis: {
            summary: "Expense analysis will be available soon.",
            recommendations: [],
          },
        });
      }

      yield {
        text: "Expense analysis is not yet implemented. This feature will be available soon.",
      };

      return {
        totalExpenses: 0,
        currency: targetCurrency,
        categoryData: [],
      };
    } catch (error) {
      yield {
        text: `Failed to retrieve expenses: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
      return {
        totalExpenses: 0,
        currency: currency || appContext.baseCurrency || "USD",
        categoryData: [],
      };
    }
  },
});
