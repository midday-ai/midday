import { getWriter } from "@ai-sdk-tools/artifacts";
import type { AppContext } from "@api/ai/agents/config/shared";
import { revenueArtifact } from "@api/ai/artifacts/revenue";
import { db } from "@midday/db/client";
import { getReports } from "@midday/db/queries";
import { formatAmount } from "@midday/utils/format";
import { tool } from "ai";
import { endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import { z } from "zod";

const getRevenueSummarySchema = z.object({
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
  revenueType: z
    .enum(["gross", "net"])
    .default("net")
    .describe(
      "Type of revenue: 'gross' for total revenue, 'net' for revenue after taxes",
    ),
  showCanvas: z
    .boolean()
    .default(false)
    .describe(
      "Whether to show detailed visual analytics. Use true for in-depth analysis requests, trends, breakdowns, or when user asks for charts/visuals. Use false for simple questions or quick answers.",
    ),
});

export const getRevenueSummaryTool = tool({
  description:
    "Calculate and analyze revenue for a given period. Provides revenue totals, monthly trends, year-over-year comparisons, and insights. Use this tool when users ask about revenue, revenue analysis, revenue trends, sales, or income.",
  inputSchema: getRevenueSummarySchema,
  execute: async function* (
    { from, to, currency, revenueType, showCanvas },
    executionOptions,
  ) {
    const appContext = executionOptions.experimental_context as AppContext;
    const teamId = appContext.teamId as string;

    if (!teamId) {
      yield {
        text: "Unable to retrieve revenue summary: Team ID not found in context.",
      };
      return {
        currentTotal: 0,
        prevTotal: 0,
        currency: currency || appContext.baseCurrency || "USD",
        monthlyData: [],
      };
    }

    try {
      // Initialize artifact only if showCanvas is true
      let analysis: ReturnType<typeof revenueArtifact.stream> | undefined;
      if (showCanvas) {
        const writer = getWriter(executionOptions);
        analysis = revenueArtifact.stream(
          {
            stage: "loading",
            currency: currency || appContext.baseCurrency || "USD",
          },
          writer,
        );
      }

      const result = await getReports(db, {
        teamId,
        from,
        to,
        currency: currency ?? undefined,
        type: "revenue",
        revenueType,
      });

      const currentTotal = result.summary.currentTotal;
      const prevTotal = result.summary.prevTotal;
      const targetCurrency =
        result.summary.currency || appContext.baseCurrency || "USD";
      const locale = appContext.locale || "en-US";
      const monthlyData = result.result || [];

      // Format totals
      const formattedCurrentTotal = formatAmount({
        amount: Math.abs(currentTotal),
        currency: targetCurrency,
        locale,
      });

      const formattedPrevTotal = formatAmount({
        amount: Math.abs(prevTotal),
        currency: targetCurrency,
        locale,
      });

      // Calculate year-over-year change
      const changeAmount = currentTotal - prevTotal;
      const changePercentage =
        prevTotal !== 0
          ? Math.round((changeAmount / Math.abs(prevTotal)) * 100)
          : 0;
      const isPositiveChange = changeAmount >= 0;

      // Calculate average monthly revenue
      const last12Months = monthlyData.slice(-12);
      const averageMonthlyRevenue =
        last12Months.length > 0
          ? last12Months.reduce((sum, item) => sum + item.current.value, 0) /
            last12Months.length
          : 0;

      // Calculate current monthly revenue and change vs last month
      const currentMonthlyRevenue =
        last12Months.length > 0
          ? last12Months[last12Months.length - 1]?.current.value || 0
          : 0;
      const previousMonthRevenue =
        last12Months.length > 1
          ? last12Months[last12Months.length - 2]?.current.value || 0
          : 0;
      const monthlyRevenueChange =
        previousMonthRevenue !== 0
          ? Math.round(
              ((currentMonthlyRevenue - previousMonthRevenue) /
                Math.abs(previousMonthRevenue)) *
                100,
            )
          : 0;

      // Build response text
      const revenueTypeLabel = revenueType === "gross" ? "Gross" : "Net";
      let responseText = `**Total ${revenueTypeLabel} Revenue:** ${formattedCurrentTotal}\n\n`;

      if (prevTotal !== 0) {
        responseText += "**Year-over-Year Comparison:**\n";
        responseText += `- Current Period: ${formattedCurrentTotal}\n`;
        responseText += `- Previous Period: ${formattedPrevTotal}\n`;
        responseText += `- Change: ${isPositiveChange ? "+" : ""}${changePercentage}% (${isPositiveChange ? "+" : ""}${formatAmount(
          {
            amount: Math.abs(changeAmount),
            currency: targetCurrency,
            locale,
          },
        )})\n\n`;
      }

      // Add monthly breakdown table if we have data
      if (monthlyData.length > 0) {
        responseText += "**Monthly Breakdown:**\n\n";
        responseText += "| Month | Revenue | Change vs Previous Year |\n";
        responseText += "|-------|---------|-------------------------|\n";

        for (const item of monthlyData.slice(-12)) {
          const monthLabel = format(new Date(item.date), "MMM yyyy");
          const revenueValue = formatAmount({
            amount: Math.abs(item.current.value),
            currency: targetCurrency,
            locale,
          });
          const changeValue = item.percentage.value;
          const changeStatus = item.percentage.status === "positive" ? "+" : "";
          responseText += `| ${monthLabel} | ${revenueValue} | ${changeStatus}${changeValue.toFixed(1)}% |\n`;
        }
        responseText += "\n";
      }

      // Add key metrics
      if (averageMonthlyRevenue > 0) {
        responseText += `**Average Monthly Revenue:** ${formatAmount({
          amount: Math.abs(averageMonthlyRevenue),
          currency: targetCurrency,
          locale,
        })}\n\n`;
      }

      if (monthlyRevenueChange !== 0 && last12Months.length > 1) {
        responseText += `**Current Month Change:** ${monthlyRevenueChange > 0 ? "+" : ""}${monthlyRevenueChange}% vs previous month\n\n`;
      }

      // Add interpretation
      if (currentTotal > 0) {
        responseText += "Your business is generating revenue. ";
        if (isPositiveChange && prevTotal !== 0) {
          responseText +=
            "Revenue has increased compared to the previous period, indicating positive business growth.";
        } else if (!isPositiveChange && prevTotal !== 0) {
          responseText +=
            "Revenue has decreased compared to the previous period. Consider reviewing your sales strategies, marketing efforts, or pricing models.";
        }
      } else {
        responseText +=
          "No revenue data found for the selected period. Ensure transactions are properly categorized as income.";
      }

      // Update artifact with dummy data if showCanvas is true
      if (showCanvas && analysis) {
        const chartData = last12Months.map((item) => ({
          month: format(new Date(item.date), "MMM"),
          revenue: item.current.value,
          lastYearRevenue: item.previous.value,
          average: averageMonthlyRevenue,
        }));

        await analysis.update({
          stage: "analysis_ready",
          currency: targetCurrency,
          chart: {
            monthlyData: chartData,
          },
          metrics: {
            totalRevenue: currentTotal,
            averageMonthlyRevenue,
            currentMonthRevenue: currentMonthlyRevenue,
            revenueGrowth: changePercentage,
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
          "\n\nA detailed visual revenue analysis with charts and trends is available.";
      }

      yield { text: responseText };

      return {
        currentTotal,
        prevTotal,
        currency: targetCurrency,
        changePercentage,
        changeAmount,
        averageMonthlyRevenue,
        monthlyRevenueChange,
        monthlyData: monthlyData.map((item) => ({
          date: item.date,
          revenue: item.current.value,
          changePercentage: item.percentage.value,
          changeStatus: item.percentage.status,
        })),
      };
    } catch (error) {
      yield {
        text: `Failed to retrieve revenue summary: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
      return {
        currentTotal: 0,
        prevTotal: 0,
        currency: currency || appContext.baseCurrency || "USD",
        monthlyData: [],
      };
    }
  },
});
