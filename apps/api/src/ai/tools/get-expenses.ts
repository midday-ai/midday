import { getWriter } from "@ai-sdk-tools/artifacts";
import type { AppContext } from "@api/ai/agents/config/shared";
import { expensesArtifact } from "@api/ai/artifacts/expenses";
import { tool } from "ai";
import { endOfMonth, startOfMonth, subMonths } from "date-fns";
import { z } from "zod";

const getExpensesSchema = z.object({
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

export const getExpensesTool = tool({
  description:
    "Analyze expenses by category for a given period. Provides expense totals, category breakdowns, monthly trends, and insights. Use this tool when users ask about expenses, expense analysis, expense breakdown, or cost analysis.",
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

      // TODO: Implement actual data fetching
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
