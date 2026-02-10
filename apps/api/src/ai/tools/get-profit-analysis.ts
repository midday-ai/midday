import { getWriter } from "@ai-sdk-tools/artifacts";
import type { AppContext } from "@api/ai/agents/config/shared";
import { profitArtifact } from "@api/ai/artifacts/profit";
import { generateArtifactDescription } from "@api/ai/utils/artifact-title";
import { resolveToolParams } from "@api/ai/utils/period-dates";
import { checkBankAccountsRequired } from "@api/ai/utils/tool-helpers";
import { db } from "@midday/db/client";
import { getReports } from "@midday/db/queries";
import { formatAmount } from "@midday/utils/format";
import { tool } from "ai";
import { format, parseISO } from "date-fns";
import { z } from "zod";

const getProfitAnalysisSchema = z.object({
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

export const getProfitAnalysisTool = tool({
  description:
    "Analyze profit (revenue minus expenses) - totals, trends, and margins.",
  inputSchema: getProfitAnalysisSchema,
  execute: async function* (
    { period, from, to, currency, revenueType, showCanvas },
    executionOptions,
  ) {
    const appContext = executionOptions.experimental_context as AppContext;
    const teamId = appContext.teamId as string;

    if (!teamId) {
      yield {
        text: "Unable to retrieve profit analysis: Team ID not found in context.",
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
        toolName: "getProfitAnalysis",
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
      let analysis: ReturnType<typeof profitArtifact.stream> | undefined;
      if (showCanvas) {
        const writer = getWriter(executionOptions);
        analysis = profitArtifact.stream(
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

      // Get profit and revenue data in parallel
      // Note: For profit margin calculation, we always use Net Revenue as the denominator
      // because Gross Profit = Net Revenue - COGS, and Net Profit = Gross Profit - Operating Expenses
      const [profitResult, revenueResult] = await Promise.all([
        getReports(db, {
          teamId,
          from: finalFrom,
          to: finalTo,
          currency: finalCurrency ?? undefined,
          type: "profit",
          revenueType: finalRevenueType, // Use revenueType to determine gross vs net profit
        }),
        getReports(db, {
          teamId,
          from: finalFrom,
          to: finalTo,
          currency: finalCurrency ?? undefined,
          type: "revenue",
          revenueType: "net", // Always use net revenue for profit margin denominator
        }),
      ]);

      const currentTotal = profitResult.summary.currentTotal;
      const prevTotal = profitResult.summary.prevTotal;
      const targetCurrency =
        profitResult.summary.currency || appContext.baseCurrency || "USD";
      const locale = appContext.locale || "en-US";
      const monthlyData = profitResult.result || [];

      // Get revenue totals for metrics
      const currentRevenueTotal = revenueResult.summary.currentTotal;
      const prevRevenueTotal = revenueResult.summary.prevTotal;
      const revenueMonthlyData = revenueResult.result || [];

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

      // Prepare chart data for artifact
      const last12Months = monthlyData.slice(-12);
      const last12MonthsRevenue = revenueMonthlyData.slice(-12);
      const averageProfit =
        last12Months.length > 0
          ? last12Months.reduce((sum, item) => sum + item.current.value, 0) /
            last12Months.length
          : 0;

      // Create a map of revenue data by date for quick lookup
      const revenueMap = new Map(
        last12MonthsRevenue.map((item) => [
          item.date,
          {
            current: item.current.value,
            previous: item.previous.value,
          },
        ]),
      );

      const chartData = last12Months.map((item) => {
        const revenueData = revenueMap.get(item.date);
        const revenue = revenueData?.current || 0;
        const lastYearRevenue = revenueData?.previous || 0;
        const profit = item.current.value;
        const lastYearProfit = item.previous.value;
        // Calculate expenses: revenue - profit
        const expenses = revenue - profit;
        const lastYearExpenses = lastYearRevenue - lastYearProfit;

        return {
          month: format(parseISO(item.date), "MMM"),
          profit,
          lastYearProfit,
          average: averageProfit,
          revenue,
          expenses,
          lastYearRevenue,
          lastYearExpenses,
        };
      });

      // Update artifact with chart data if showCanvas is true
      if (showCanvas && analysis) {
        await analysis.update({
          stage: "chart_ready",
          from: finalFrom,
          to: finalTo,
          description,
          chart: {
            monthlyData: chartData,
          },
        });
      }

      // Calculate metrics
      const currentMonthlyProfit =
        last12Months.length > 0
          ? last12Months[last12Months.length - 1]?.current.value || 0
          : 0;
      const previousMonthlyProfit =
        last12Months.length > 0
          ? last12Months[last12Months.length - 1]?.previous.value || 0
          : 0;
      const currentMonthRevenue =
        revenueMonthlyData.length > 0
          ? revenueMonthlyData[revenueMonthlyData.length - 1]?.current.value ||
            0
          : 0;

      // Calculate profit margin using period totals (not monthly data)
      // This matches the "Current Period" metrics displayed in the canvas
      const profitMargin =
        currentRevenueTotal > 0
          ? (currentTotal / currentRevenueTotal) * 100
          : 0;

      // Calculate average monthly profit (last 6 months)
      const last6Months = last12Months.slice(-6);
      const averageMonthlyProfit =
        last6Months.length > 0
          ? last6Months.reduce((sum, item) => sum + item.current.value, 0) /
            last6Months.length
          : 0;

      // Calculate revenue growth (year-over-year)
      const revenueGrowth =
        prevRevenueTotal !== 0
          ? Math.round(
              ((currentRevenueTotal - prevRevenueTotal) /
                Math.abs(prevRevenueTotal)) *
                100,
            )
          : 0;

      // Calculate current monthly profit change vs last month
      const previousMonthProfit =
        last12Months.length > 1
          ? last12Months[last12Months.length - 2]?.current.value || 0
          : 0;
      const monthlyProfitChange =
        previousMonthProfit !== 0
          ? Math.round(
              ((currentMonthlyProfit - previousMonthProfit) /
                Math.abs(previousMonthProfit)) *
                100,
            )
          : 0;

      // Calculate expenses for current period
      const _currentMonthlyExpenses =
        currentMonthRevenue - currentMonthlyProfit;
      const previousMonthRevenue =
        revenueMonthlyData.length > 0
          ? revenueMonthlyData[revenueMonthlyData.length - 1]?.previous.value ||
            0
          : 0;
      const _previousMonthlyExpenses =
        previousMonthRevenue - previousMonthlyProfit;

      // Calculate period totals (current vs previous)
      const currentPeriodTotal = {
        revenue: currentRevenueTotal,
        expenses: currentRevenueTotal - currentTotal, // Total expenses = revenue - profit
        profit: currentTotal,
      };

      const previousPeriodTotal = {
        revenue: prevRevenueTotal,
        expenses: prevRevenueTotal - prevTotal,
        profit: prevTotal,
      };

      // Update artifact with metrics if showCanvas is true
      if (showCanvas && analysis) {
        await analysis.update({
          stage: "metrics_ready",
          from: finalFrom,
          to: finalTo,
          description,
          chart: {
            monthlyData: chartData,
          },
          metrics: {
            currentMonthlyProfit,
            profitMargin: Math.round(profitMargin * 10) / 10, // Round to 1 decimal
            averageMonthlyProfit,
            revenueGrowth,
            currentMonthlyProfitChange: {
              percentage: monthlyProfitChange,
              period: "last month",
            },
            currentPeriod: currentPeriodTotal,
            previousPeriod: previousPeriodTotal,
            totalRevenue: currentRevenueTotal,
            totalExpenses: currentPeriodTotal.expenses,
          },
        });
      }

      // Build response text
      const revenueTypeLabel = finalRevenueType === "gross" ? "Gross" : "Net";
      let responseText = `**Total ${revenueTypeLabel} Profit:** ${formattedCurrentTotal}\n\n`;

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
        responseText += "| Month | Profit | Change vs Previous Year |\n";
        responseText += "|-------|--------|-------------------------|\n";

        for (const item of monthlyData.slice(-12)) {
          const monthLabel = format(parseISO(item.date), "MMM yyyy");
          const profitValue = formatAmount({
            amount: Math.abs(item.current.value),
            currency: targetCurrency,
            locale,
          });
          const changeValue = item.percentage.value;
          const changeStatus = item.percentage.status === "positive" ? "+" : "";
          responseText += `| ${monthLabel} | ${profitValue} | ${changeStatus}${changeValue.toFixed(1)}% |\n`;
        }
        responseText += "\n";
      }

      // Add interpretation
      if (currentTotal > 0) {
        responseText +=
          "Your business is profitable, generating more revenue than expenses. ";
        if (isPositiveChange && prevTotal !== 0) {
          responseText +=
            "Profitability has improved compared to the previous period, indicating positive business growth.";
        } else if (!isPositiveChange && prevTotal !== 0) {
          responseText +=
            "While still profitable, profit has decreased compared to the previous period. Consider reviewing expenses or revenue strategies.";
        }
      } else if (currentTotal < 0) {
        responseText +=
          "Your business is currently operating at a loss (expenses exceed revenue). ";
        responseText +=
          "This may be normal for growth-stage businesses, but monitor cash flow and runway closely to ensure sustainability.";
      } else {
        responseText +=
          "Your business is breaking even (revenue equals expenses). Consider strategies to increase profitability.";
      }

      // Generate summary for artifact
      let summaryText = "";
      if (currentTotal > 0) {
        summaryText = `Profit increased ${Math.abs(changePercentage)}% over ${last12Months.length} months (${formatAmount(
          {
            amount: Math.abs(prevTotal),
            currency: targetCurrency,
            locale,
          },
        )} to ${formattedCurrentTotal}), driven by revenue growth (${revenueGrowth}% increase). `;
        summaryText += `Current profit margin of ${Math.round(profitMargin * 10) / 10}% ${
          profitMargin >= 25
            ? "exceeds industry average of 25%"
            : profitMargin >= 15
              ? "is above average"
              : "indicates room for improvement"
        }, indicating ${profitMargin >= 25 ? "strong" : "moderate"} financial performance.`;
      } else if (currentTotal < 0) {
        summaryText =
          "Your business is currently operating at a loss. This may be normal for growth-stage businesses, but monitor cash flow and runway closely.";
      } else {
        summaryText =
          "Your business is breaking even. Consider strategies to increase profitability.";
      }

      // Update artifact with analysis if showCanvas is true
      if (showCanvas && analysis) {
        await analysis.update({
          stage: "analysis_ready",
          from: finalFrom,
          to: finalTo,
          description,
          chart: {
            monthlyData: chartData,
          },
          metrics: {
            currentMonthlyProfit,
            profitMargin: Math.round(profitMargin * 10) / 10,
            averageMonthlyProfit,
            revenueGrowth,
            currentMonthlyProfitChange: {
              percentage: monthlyProfitChange,
              period: "last month",
            },
            currentPeriod: currentPeriodTotal,
            previousPeriod: previousPeriodTotal,
            totalRevenue: currentRevenueTotal,
            totalExpenses: currentPeriodTotal.expenses,
          },
          analysis: {
            summary: summaryText,
            recommendations: [
              currentTotal < 0
                ? "Focus on reducing expenses or increasing revenue to achieve profitability"
                : profitMargin < 15
                  ? "Consider optimizing operations to improve profit margin"
                  : "Maintain current profitability trends and explore growth opportunities",
              revenueGrowth < 0
                ? "Review revenue strategies to reverse declining trends"
                : "Continue focusing on revenue growth initiatives",
            ],
          },
        });
      }

      // Mention canvas if requested
      if (showCanvas) {
        responseText +=
          "\n\nA detailed visual profit analysis with charts and trends is available.";
      }

      yield { text: responseText };

      return {
        currentTotal,
        prevTotal,
        currency: targetCurrency,
        changePercentage,
        changeAmount,
        monthlyData: monthlyData.map((item) => ({
          date: item.date,
          profit: item.current.value,
          changePercentage: item.percentage.value,
          changeStatus: item.percentage.status,
        })),
      };
    } catch (error) {
      yield {
        text: `Failed to retrieve profit analysis: ${error instanceof Error ? error.message : "Unknown error"}`,
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
