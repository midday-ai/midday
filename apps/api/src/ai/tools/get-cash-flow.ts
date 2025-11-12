import { getWriter } from "@ai-sdk-tools/artifacts";
import type { AppContext } from "@api/ai/agents/config/shared";
import { cashFlowArtifact } from "@api/ai/artifacts/cash-flow";
import { db } from "@midday/db/client";
import { getCashFlow } from "@midday/db/queries";
import { formatAmount } from "@midday/utils/format";
import { tool } from "ai";
import { endOfMonth, startOfMonth } from "date-fns";
import { z } from "zod";

const getCashFlowSchema = z.object({
  from: z
    .string()
    .default(() => startOfMonth(new Date()).toISOString())
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
  period: z
    .enum(["monthly", "quarterly"])
    .default("monthly")
    .describe("Period aggregation: 'monthly' or 'quarterly'")
    .optional(),
  showCanvas: z
    .boolean()
    .default(false)
    .describe(
      "Whether to show detailed visual analytics. Use true for in-depth analysis requests, trends, breakdowns, or when user asks for charts/visuals. Use false for simple questions or quick answers.",
    ),
});

export const getCashFlowTool = tool({
  description:
    "Calculate net cash flow (income minus expenses) for a given period. Net cash flow represents the total money coming in minus money going out. Use this tool when users ask about cash flow, net cash position, cash movement, or income vs expenses.",
  inputSchema: getCashFlowSchema,
  execute: async function* (
    { from, to, currency, period, showCanvas },
    executionOptions,
  ) {
    const appContext = executionOptions.experimental_context as AppContext;
    const teamId = appContext.teamId as string;

    if (!teamId) {
      yield {
        text: "Unable to retrieve cash flow: Team ID not found in context.",
      };
      return {
        netCashFlow: 0,
        currency: currency || appContext.baseCurrency || "USD",
        period: period || "monthly",
      };
    }

    try {
      // Initialize artifact only if showCanvas is true
      let analysis: ReturnType<typeof cashFlowArtifact.stream> | undefined;
      if (showCanvas) {
        const writer = getWriter(executionOptions);
        analysis = cashFlowArtifact.stream(
          {
            stage: "loading",
            currency: currency || appContext.baseCurrency || "USD",
          },
          writer,
        );
      }

      const result = await getCashFlow(db, {
        teamId,
        from,
        to,
        currency: currency ?? undefined,
        period: period ?? "monthly",
      });

      const netCashFlow = result.summary.netCashFlow;
      const targetCurrency =
        result.summary.currency || appContext.baseCurrency || "USD";
      const locale = appContext.locale || "en-US";
      const periodType = result.summary.period;

      // Format the net cash flow
      const formattedCashFlow = formatAmount({
        amount: Math.abs(netCashFlow),
        currency: targetCurrency,
        locale,
      });

      // Determine if cash flow is positive or negative
      const isPositive = netCashFlow >= 0;
      const sign = isPositive ? "+" : "-";

      // Build response text
      let responseText = `**Net Cash Flow:** ${sign}${formattedCashFlow}\n\n`;

      // Add period context
      const periodLabel = periodType === "quarterly" ? "quarter" : "period";
      responseText += `This represents your net cash position for the selected ${periodLabel}.\n\n`;

      // Add interpretation
      if (isPositive) {
        responseText +=
          "A positive cash flow means you're bringing in more money than you're spending, which is a healthy sign for your business. ";
        responseText +=
          "This indicates your business is generating sufficient revenue to cover expenses and potentially build cash reserves.";
      } else {
        responseText +=
          "A negative cash flow means you're spending more than you're earning. ";
        responseText +=
          "This could be normal for growth-stage businesses investing heavily, but monitor your cash reserves and runway to ensure sustainability.";
      }

      // Update artifact with dummy data if showCanvas is true
      if (showCanvas && analysis) {
        await analysis.update({
          stage: "analysis_ready",
          currency: targetCurrency,
          chart: {
            monthlyData: [],
          },
          metrics: {
            netCashFlow,
            totalIncome: 0,
            totalExpenses: 0,
            averageMonthlyCashFlow: 0,
          },
          analysis: {
            summary: responseText,
            recommendations: [],
          },
        });
      }

      // Mention canvas if requested
      if (showCanvas) {
        responseText +=
          "\n\nA detailed visual cash flow analysis with charts and trends is available.";
      }

      yield { text: responseText };

      return {
        netCashFlow,
        currency: targetCurrency,
        period: periodType,
        formattedAmount: `${sign}${formattedCashFlow}`,
      };
    } catch (error) {
      yield {
        text: `Failed to retrieve cash flow: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
      return {
        netCashFlow: 0,
        currency: currency || appContext.baseCurrency || "USD",
        period: period || "monthly",
      };
    }
  },
});
