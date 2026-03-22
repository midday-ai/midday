import type { AppContext } from "@api/ai/context";
import { resolveToolParams } from "@api/ai/utils/period-dates";
import { checkBankAccountsRequired } from "@api/ai/utils/tool-helpers";
import { db } from "@midday/db/client";
import { getCashFlow, getExpenses, getReports } from "@midday/db/queries";
import { tool } from "ai";
import { z } from "zod";

const getBusinessHealthScoreSchema = z.object({
  period: z
    .enum(["3-months", "6-months", "this-year", "1-year", "2-years", "5-years"])
    .optional()
    .describe("Historical period"),
  from: z.string().optional().describe("Start date (yyyy-MM-dd)"),
  to: z.string().optional().describe("End date (yyyy-MM-dd)"),
  currency: z.string().nullable().optional().describe("Currency code"),
});

export const getBusinessHealthScoreTool = tool({
  description:
    "Calculate business health score (0-100) - composite score based on revenue, expenses, cash flow, and profitability metrics.",
  inputSchema: getBusinessHealthScoreSchema,
  execute: async function* ({ period, from, to, currency }, executionOptions) {
    const appContext = executionOptions.experimental_context as AppContext;
    const teamId = appContext.teamId as string;

    if (!teamId) {
      yield {
        text: "Unable to retrieve business health score: Team ID not found.",
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
        appContext,
        aiParams: { period, from, to, currency },
      });

      const finalFrom = resolved.from;
      const finalTo = resolved.to;
      const finalCurrency = resolved.currency;
      const targetCurrency = finalCurrency || "USD";

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

      const last12Months = revenueData.slice(-12);
      const last12MonthsCashFlow = cashFlowMonthlyData.slice(-12);

      const currentRevenue = revenueResult.summary.currentTotal;
      const prevRevenue = revenueResult.summary.prevTotal;
      const revenueGrowth =
        prevRevenue !== 0
          ? ((currentRevenue - prevRevenue) / Math.abs(prevRevenue)) * 100
          : currentRevenue > 0
            ? 100
            : 0;

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

      const currentExpenses =
        expensesData.length > 0
          ? expensesData.reduce((sum, item) => sum + item.value, 0)
          : 0;
      const expenseRatio =
        currentRevenue > 0 ? (currentExpenses / currentRevenue) * 100 : 100;
      const expenseScore = Math.max(0, Math.min(100, 100 - expenseRatio * 0.8));

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

      const overallScore = Math.round(
        revenueScore * 0.25 +
          expenseScore * 0.25 +
          cashFlowScore * 0.25 +
          profitabilityScore * 0.25,
      );

      const scoreDescription =
        overallScore >= 75
          ? "Excellent"
          : overallScore >= 50
            ? "Good"
            : overallScore >= 25
              ? "Fair"
              : "Needs improvement";

      yield {
        text: `Business health score: ${overallScore}/100 (${scoreDescription})`,
      };

      return {
        overallScore,
        scoreDescription,
        revenueScore: Math.round(revenueScore),
        expenseScore: Math.round(expenseScore),
        cashFlowScore: Math.round(cashFlowScore),
        profitabilityScore: Math.round(profitabilityScore),
        revenueGrowth: Math.round(revenueGrowth * 10) / 10,
        profitMargin: Math.round(profitMargin * 10) / 10,
        positiveCashFlowMonths,
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
