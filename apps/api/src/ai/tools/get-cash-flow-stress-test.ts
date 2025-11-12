import { getWriter } from "@ai-sdk-tools/artifacts";
import type { AppContext } from "@api/ai/agents/config/shared";
import { cashFlowStressTestArtifact } from "@api/ai/artifacts/cash-flow-stress-test";
import { tool } from "ai";
import { endOfMonth, startOfMonth, subMonths } from "date-fns";
import { z } from "zod";

const getCashFlowStressTestSchema = z.object({
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

export const getCashFlowStressTestTool = tool({
  description:
    "Perform cash flow stress testing by analyzing different scenarios (base case, worst case, best case) to determine financial resilience. Use this tool when users ask about stress testing, financial resilience, worst case scenarios, or cash flow scenarios.",
  inputSchema: getCashFlowStressTestSchema,
  execute: async function* (
    { from, to, currency, showCanvas },
    executionOptions,
  ) {
    const appContext = executionOptions.experimental_context as AppContext;
    const teamId = appContext.teamId as string;

    if (!teamId) {
      yield {
        text: "Unable to retrieve cash flow stress test: Team ID not found in context.",
      };
      return {
        baseCaseRunway: 0,
        worstCaseRunway: 0,
        bestCaseRunway: 0,
        currency: currency || appContext.baseCurrency || "USD",
      };
    }

    try {
      // Initialize artifact only if showCanvas is true
      let analysis:
        | ReturnType<typeof cashFlowStressTestArtifact.stream>
        | undefined;
      if (showCanvas) {
        const writer = getWriter(executionOptions);
        analysis = cashFlowStressTestArtifact.stream(
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
            scenarios: [],
          },
          metrics: {
            baseCaseRunway: 0,
            worstCaseRunway: 0,
            bestCaseRunway: 0,
            stressTestScore: 0,
          },
          analysis: {
            summary: "Cash flow stress test analysis will be available soon.",
            recommendations: [],
          },
        });
      }

      yield {
        text: "Cash flow stress test analysis is not yet implemented. This feature will be available soon.",
      };

      return {
        baseCaseRunway: 0,
        worstCaseRunway: 0,
        bestCaseRunway: 0,
        currency: targetCurrency,
      };
    } catch (error) {
      yield {
        text: `Failed to retrieve cash flow stress test: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
      return {
        baseCaseRunway: 0,
        worstCaseRunway: 0,
        bestCaseRunway: 0,
        currency: currency || appContext.baseCurrency || "USD",
      };
    }
  },
});
