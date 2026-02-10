import { getWriter } from "@ai-sdk-tools/artifacts";
import type { AppContext } from "@api/ai/agents/config/shared";
import { businessHealthScoreArtifact } from "@api/ai/artifacts/business-health-score";
import { generateArtifactDescription } from "@api/ai/utils/artifact-title";
import { resolveToolParams } from "@api/ai/utils/period-dates";
import { checkBankAccountsRequired } from "@api/ai/utils/tool-helpers";
import { db } from "@midday/db/client";
import { getCashFlow, getExpenses, getReports } from "@midday/db/queries";
import { tool } from "ai";
import { eachMonthOfInterval, format } from "date-fns";
import { z } from "zod";

const getBusinessHealthScoreSchema = z.object({
  period: z
    .enum(["3-months", "6-months", "this-year", "1-year", "2-years", "5-years"])
    .optional()
    .describe("Historical period"),
  from: z.string().optional().describe("Start date (yyyy-MM-dd)"),
  to: z.string().optional().describe("End date (yyyy-MM-dd)"),
  currency: z.string().nullable().optional().describe("Currency code"),
  showCanvas: z.boolean().default(false).describe("Show visual analytics"),
});

export const getBusinessHealthScoreTool = tool({
  description:
    "Calculate business health score (0-100) - composite score based on revenue, expenses, cash flow, and profitability metrics.",
  inputSchema: getBusinessHealthScoreSchema,
  execute: async function* (
    { period, from, to, currency, showCanvas },
    executionOptions,
  ) {
    const appContext = executionOptions.experimental_context as AppContext;
    const teamId = appContext.teamId as string;

    if (!teamId) {
      yield {
        text: "Unable to retrieve business health score: Team ID not found in context.",
      };
      return {
        overallScore: 0,
        currency: currency || appContext.baseCurrency || "USD",
      };
    }

    const { shouldYield } = checkBankAccountsRequired(appContext);
    if (shouldYield) {
      throw new Error("BANK_ACCOUNT_REQUIRED");
    }

    try {
      const resolved = resolveToolParams({
        toolName: "getBusinessHealthScore",
        appContext,
        aiParams: { period, from, to, currency },
      });

      const finalFrom = resolved.from;
      const finalTo = resolved.to;
      const finalCurrency = resolved.currency;

      // Generate description based on date range
      const description = generateArtifactDescription(finalFrom, finalTo);

      // Initialize artifact only if showCanvas is true
      let analysis:
        | ReturnType<typeof businessHealthScoreArtifact.stream>
        | undefined;
      if (showCanvas) {
        const writer = getWriter(executionOptions);
        analysis = businessHealthScoreArtifact.stream(
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

      const targetCurrency = finalCurrency || "USD";
      const _locale = appContext.locale || "en-US";

      // Fetch all required data in parallel
      const [revenueResult, expensesResult, cashFlowResult, profitResult] =
        await Promise.all([
          getReports(db, {
            teamId,
            from: finalFrom,
            to: finalTo,
            currency: finalCurrency ?? undefined,
            type: "revenue",
            revenueType: "net",
          }),
          getExpenses(db, {
            teamId,
            from: finalFrom,
            to: finalTo,
            currency: finalCurrency ?? undefined,
          }),
          getCashFlow(db, {
            teamId,
            from: finalFrom,
            to: finalTo,
            currency: finalCurrency ?? undefined,
            period: "monthly",
          }),
          getReports(db, {
            teamId,
            from: finalFrom,
            to: finalTo,
            currency: finalCurrency ?? undefined,
            type: "profit",
            revenueType: "net",
          }),
        ]);

      const revenueData = revenueResult.result || [];
      const expensesData = expensesResult.result || [];
      const cashFlowMonthlyData = cashFlowResult.monthlyData || [];
      const profitData = profitResult.result || [];

      // Get last 12 months of data
      const last12Months = revenueData.slice(-12);
      const last12MonthsExpenses = expensesData.slice(-12);
      const last12MonthsCashFlow = cashFlowMonthlyData.slice(-12);
      const _last12MonthsProfit = profitData.slice(-12);

      // Calculate Revenue Score (0-100)
      // Based on: growth rate, consistency, and total revenue
      const currentRevenue = revenueResult.summary.currentTotal;
      const prevRevenue = revenueResult.summary.prevTotal;
      const revenueGrowth =
        prevRevenue !== 0
          ? ((currentRevenue - prevRevenue) / Math.abs(prevRevenue)) * 100
          : currentRevenue > 0
            ? 100
            : 0;

      // Revenue consistency (lower variance = higher score)
      const revenueValues = last12Months.map((m) => m.current.value);
      const avgRevenue =
        revenueValues.length > 0
          ? revenueValues.reduce((a, b) => a + b, 0) / revenueValues.length
          : 0;
      const revenueVariance =
        revenueValues.length > 0
          ? revenueValues.reduce(
              (sum, val) => sum + (val - avgRevenue) ** 2,
              0,
            ) / revenueValues.length
          : 0;
      const revenueStdDev = Math.sqrt(revenueVariance);
      const revenueConsistency =
        avgRevenue > 0
          ? Math.max(0, 100 - (revenueStdDev / avgRevenue) * 100)
          : 0;

      const revenueScore = Math.min(
        100,
        Math.max(
          0,
          Math.max(0, revenueGrowth) * 0.4 +
            revenueConsistency * 0.3 +
            Math.min(100, (currentRevenue > 0 ? 1 : 0) * 100) * 0.3,
        ),
      );

      // Calculate Expense Score (0-100)
      // Based on: expense ratio, expense growth, and control
      const currentExpenses =
        expensesData.length > 0
          ? expensesData.reduce((sum, item) => sum + item.value, 0)
          : 0;
      const expenseRatio =
        currentRevenue > 0 ? (currentExpenses / currentRevenue) * 100 : 100;
      const expenseScore = Math.max(0, Math.min(100, 100 - expenseRatio * 0.8)); // Lower expense ratio = higher score

      // Calculate Cash Flow Score (0-100)
      // Based on: positive cash flow months, average cash flow, consistency
      const positiveCashFlowMonths = last12MonthsCashFlow.filter(
        (m) => m.netCashFlow > 0,
      ).length;
      const cashFlowPositivity =
        (positiveCashFlowMonths / Math.max(1, last12MonthsCashFlow.length)) *
        100;
      const avgCashFlow =
        last12MonthsCashFlow.length > 0
          ? last12MonthsCashFlow.reduce((sum, m) => sum + m.netCashFlow, 0) /
            last12MonthsCashFlow.length
          : 0;
      const cashFlowMagnitude = Math.min(
        100,
        Math.max(0, (avgCashFlow > 0 ? 1 : 0) * 100),
      );
      const cashFlowScore = Math.min(
        100,
        cashFlowPositivity * 0.6 + cashFlowMagnitude * 0.4,
      );

      // Calculate Profitability Score (0-100)
      // Based on: profit margin, profit growth, profitability consistency
      const currentProfit = profitResult.summary.currentTotal;
      const prevProfit = profitResult.summary.prevTotal;
      const profitMargin =
        currentRevenue > 0 ? (currentProfit / currentRevenue) * 100 : 0;
      const profitGrowth =
        prevProfit !== 0
          ? ((currentProfit - prevProfit) / Math.abs(prevProfit)) * 100
          : currentProfit > 0
            ? 100
            : 0;

      const profitabilityScore = Math.min(
        100,
        Math.max(
          0,
          Math.max(0, profitMargin) * 0.5 +
            Math.max(0, Math.min(100, profitGrowth)) * 0.3 +
            (currentProfit > 0 ? 30 : 0),
        ),
      );

      // Calculate Overall Score (weighted average)
      const overallScore = Math.round(
        revenueScore * 0.25 +
          expenseScore * 0.25 +
          cashFlowScore * 0.25 +
          profitabilityScore * 0.25,
      );

      // Generate monthly chart data
      const monthSeries = eachMonthOfInterval({
        start: new Date(finalFrom),
        end: new Date(finalTo),
      }).slice(-12);

      // Create maps for quick lookup
      const revenueMap = new Map(
        last12Months.map((m) => [m.date, m.current.value]),
      );
      const expensesMap = new Map(
        last12MonthsExpenses.map((m) => [m.date, m.value]),
      );
      const cashFlowMap = new Map(
        last12MonthsCashFlow.map((m) => [m.date, m.netCashFlow]),
      );

      // Calculate monthly health scores
      const monthlyHealthScores = monthSeries.map((month) => {
        const monthKey = format(month, "yyyy-MM-dd");
        const monthRevenue = revenueMap.get(monthKey) || 0;
        const monthExpenses = expensesMap.get(monthKey) || 0;
        const monthCashFlow = cashFlowMap.get(monthKey) || 0;
        const monthProfit = monthRevenue - monthExpenses;

        // Calculate monthly component scores
        const monthRevenueScore = monthRevenue > 0 ? 50 : 0;
        const monthExpenseScore =
          monthRevenue > 0
            ? Math.max(0, 100 - (monthExpenses / monthRevenue) * 100)
            : 50;
        const monthCashFlowScore = monthCashFlow > 0 ? 75 : 25;
        const monthProfitabilityScore =
          monthRevenue > 0
            ? Math.max(0, (monthProfit / monthRevenue) * 100)
            : 0;

        const monthHealthScore = Math.round(
          monthRevenueScore * 0.25 +
            monthExpenseScore * 0.25 +
            monthCashFlowScore * 0.25 +
            monthProfitabilityScore * 0.25,
        );

        return {
          month: format(month, "MMM"),
          healthScore: Math.max(0, Math.min(100, monthHealthScore)),
          revenue: monthRevenue,
          expenses: monthExpenses,
        };
      });

      // Update artifact with chart data
      if (showCanvas && analysis) {
        await analysis.update({
          stage: "chart_ready",
          currency: targetCurrency,
          from: finalFrom,
          to: finalTo,
          description,
          chart: {
            monthlyData: monthlyHealthScores,
          },
        });
      }

      // Update artifact with metrics
      if (showCanvas && analysis) {
        await analysis.update({
          stage: "metrics_ready",
          currency: targetCurrency,
          chart: {
            monthlyData: monthlyHealthScores,
          },
          metrics: {
            overallScore,
            revenueScore: Math.round(revenueScore),
            expenseScore: Math.round(expenseScore),
            cashFlowScore: Math.round(cashFlowScore),
            profitabilityScore: Math.round(profitabilityScore),
          },
          analysis: {
            summary: "Loading analysis...",
            recommendations: [],
          },
        });
      }

      // Generate simple summary based on scores
      const scoreDescription =
        overallScore >= 75
          ? "Excellent"
          : overallScore >= 50
            ? "Good"
            : overallScore >= 25
              ? "Fair"
              : "Needs improvement";

      const summary = `Your business health score is ${overallScore}/100 (${scoreDescription}). Revenue score is ${Math.round(revenueScore)}/100${revenueGrowth > 0 ? ` with ${revenueGrowth.toFixed(1)}% growth` : ""}, expense management scores ${Math.round(expenseScore)}/100, cash flow health is ${Math.round(cashFlowScore)}/100 with ${positiveCashFlowMonths} positive months, and profitability scores ${Math.round(profitabilityScore)}/100${profitMargin > 0 ? ` with ${profitMargin.toFixed(1)}% margin` : ""}.`;

      // Update artifact with final analysis
      if (showCanvas && analysis) {
        await analysis.update({
          stage: "analysis_ready",
          currency: targetCurrency,
          chart: {
            monthlyData: monthlyHealthScores,
          },
          metrics: {
            overallScore,
            revenueScore: Math.round(revenueScore),
            expenseScore: Math.round(expenseScore),
            cashFlowScore: Math.round(cashFlowScore),
            profitabilityScore: Math.round(profitabilityScore),
          },
          analysis: {
            summary,
            recommendations: [],
          },
        });
      }

      // Format response text
      const formattedOverallScore = overallScore.toFixed(1);
      const scoreDescriptionText =
        overallScore >= 75
          ? "excellent"
          : overallScore >= 50
            ? "good"
            : overallScore >= 25
              ? "fair"
              : "needs improvement";

      yield {
        text: `Your business health score is ${formattedOverallScore}/100 (${scoreDescriptionText}).

Component scores:
• Revenue: ${Math.round(revenueScore)}/100
• Expenses: ${Math.round(expenseScore)}/100
• Cash Flow: ${Math.round(cashFlowScore)}/100
• Profitability: ${Math.round(profitabilityScore)}/100

${summary}`,
      };

      return {
        overallScore,
        revenueScore: Math.round(revenueScore),
        expenseScore: Math.round(expenseScore),
        cashFlowScore: Math.round(cashFlowScore),
        profitabilityScore: Math.round(profitabilityScore),
        currency: targetCurrency,
      };
    } catch (error) {
      yield {
        text: `Failed to retrieve business health score: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
      return {
        overallScore: 0,
        currency: currency || appContext.baseCurrency || "USD",
      };
    }
  },
});
