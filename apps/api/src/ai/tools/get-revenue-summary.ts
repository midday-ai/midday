import { getWriter } from "@ai-sdk-tools/artifacts";
import type { AppContext } from "@api/ai/agents/config/shared";
import { revenueArtifact } from "@api/ai/artifacts/revenue";
import { generateArtifactDescription } from "@api/ai/utils/artifact-title";
import { resolveToolParams } from "@api/ai/utils/period-dates";
import { checkBankAccountsRequired } from "@api/ai/utils/tool-helpers";
import { db } from "@midday/db/client";
import { getReports } from "@midday/db/queries";
import { formatAmount } from "@midday/utils/format";
import { tool } from "ai";
import { format, parseISO } from "date-fns";
import { z } from "zod";

const getRevenueSummarySchema = z.object({
  period: z
    .enum(["3-months", "6-months", "this-year", "1-year", "2-years", "5-years"])
    .optional()
    .describe("Historical period"),
  from: z.string().optional().describe("Start date (yyyy-MM-dd)"),
  to: z.string().optional().describe("End date (yyyy-MM-dd)"),
  currency: z.string().nullable().optional().describe("Currency code"),
  revenueType: z.enum(["gross", "net"]).optional().describe("Revenue type"),
  showCanvas: z.boolean().default(false).describe("Show visual canvas"),
});

export const getRevenueSummaryTool = tool({
  description:
    "Analyze revenue (income/sales) - totals, trends, and growth rates.",
  inputSchema: getRevenueSummarySchema,
  execute: async function* (
    { period, from, to, currency, revenueType, showCanvas },
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

    const { shouldYield } = checkBankAccountsRequired(appContext);
    if (shouldYield) {
      throw new Error("BANK_ACCOUNT_REQUIRED");
    }

    try {
      // Resolve parameters with proper priority:
      // 1. Forced params from widget click (if this tool was triggered by widget)
      // 2. Explicit AI params (user override)
      // 3. Dashboard metricsFilter (source of truth)
      // 4. Hardcoded defaults
      const resolved = resolveToolParams({
        toolName: "getRevenueSummary",
        appContext,
        aiParams: { period, from, to, currency, revenueType },
      });

      const finalFrom = resolved.from;
      const finalTo = resolved.to;
      const finalCurrency = resolved.currency;
      const finalRevenueType = resolved.revenueType ?? "net";

      // Generate description based on date range
      const description = generateArtifactDescription(finalFrom, finalTo);

      // Initialize artifact only if showCanvas is true
      let analysis: ReturnType<typeof revenueArtifact.stream> | undefined;
      if (showCanvas) {
        const writer = getWriter(executionOptions);
        analysis = revenueArtifact.stream(
          {
            stage: "loading",
            currency: finalCurrency || "USD",
            from: finalFrom,
            to: finalTo,
            description,
          },
          writer,
        );
      }

      const result = await getReports(db, {
        teamId,
        from: finalFrom,
        to: finalTo,
        currency: finalCurrency ?? undefined,
        type: "revenue",
        revenueType: finalRevenueType,
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
      const revenueTypeLabel = finalRevenueType === "gross" ? "Gross" : "Net";
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
          const monthLabel = format(parseISO(item.date), "MMM yyyy");
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

      // Prepare chart data for artifact
      const chartData = last12Months.map((item) => ({
        month: format(parseISO(item.date), "MMM"),
        revenue: item.current.value,
        lastYearRevenue: item.previous.value,
        average: averageMonthlyRevenue,
      }));

      // Update artifact with chart data if showCanvas is true
      if (showCanvas && analysis) {
        await analysis.update({
          stage: "chart_ready",
          currency: targetCurrency,
          from: finalFrom,
          to: finalTo,
          description,
          chart: {
            monthlyData: chartData,
          },
        });
      }

      // Update artifact with metrics if showCanvas is true
      if (showCanvas && analysis) {
        await analysis.update({
          stage: "metrics_ready",
          currency: targetCurrency,
          from: finalFrom,
          to: finalTo,
          description,
          chart: {
            monthlyData: chartData,
          },
          metrics: {
            totalRevenue: currentTotal,
            averageMonthlyRevenue,
            currentMonthRevenue: currentMonthlyRevenue,
            revenueGrowth: changePercentage,
          },
        });
      }

      // Generate summary for artifact
      let summaryText = "";
      if (currentTotal > 0) {
        summaryText = `Revenue ${isPositiveChange ? "increased" : "decreased"} ${Math.abs(changePercentage)}% over ${last12Months.length} months (${formattedPrevTotal} to ${formattedCurrentTotal}). `;
        if (isPositiveChange && prevTotal !== 0) {
          summaryText +=
            "This indicates positive business growth and strong sales performance.";
        } else if (!isPositiveChange && prevTotal !== 0) {
          summaryText +=
            "Consider reviewing sales strategies, marketing efforts, or pricing models to reverse the trend.";
        }
      } else {
        summaryText =
          "No revenue data found for the selected period. Ensure transactions are properly categorized as income.";
      }

      // Update artifact with analysis if showCanvas is true
      if (showCanvas && analysis) {
        await analysis.update({
          stage: "analysis_ready",
          currency: targetCurrency,
          from: finalFrom,
          to: finalTo,
          description,
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
            summary: summaryText,
            recommendations: [
              currentTotal === 0
                ? "Ensure transactions are properly categorized as income"
                : !isPositiveChange && prevTotal !== 0
                  ? "Review sales strategies and marketing efforts to increase revenue"
                  : "Continue focusing on revenue growth initiatives",
              monthlyRevenueChange < 0 && last12Months.length > 1
                ? "Address declining monthly revenue trends"
                : "Maintain current revenue performance",
            ],
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
