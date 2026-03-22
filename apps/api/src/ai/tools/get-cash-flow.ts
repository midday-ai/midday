import type { AppContext } from "@api/ai/context";
import { resolveToolParams } from "@api/ai/utils/period-dates";
import { checkBankAccountsRequired } from "@api/ai/utils/tool-helpers";
import { db } from "@midday/db/client";
import { getCashFlow } from "@midday/db/queries";
import { formatAmount } from "@midday/utils/format";
import { tool } from "ai";
import { z } from "zod";

const getCashFlowSchema = z.object({
  dateRange: z
    .enum(["3-months", "6-months", "this-year", "1-year", "2-years", "5-years"])
    .optional()
    .describe("Historical period"),
  from: z.string().optional().describe("Start date (yyyy-MM-dd)"),
  to: z.string().optional().describe("End date (yyyy-MM-dd)"),
  currency: z.string().nullable().optional().describe("Currency code"),
  period: z
    .enum(["monthly", "quarterly"])
    .default("monthly")
    .describe("Aggregation: monthly (default) or quarterly")
    .optional(),
});

export const getCashFlowTool = tool({
  description:
    "Calculate net cash flow (income minus expenses) with monthly trends.",
  inputSchema: getCashFlowSchema,
  execute: async function* (
    { dateRange, from, to, currency, period },
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
        monthlyData: [],
      };
    }

    const { shouldYield } = checkBankAccountsRequired(appContext);
    if (shouldYield) {
      throw new Error("BANK_ACCOUNT_REQUIRED");
    }

    try {
      const resolved = resolveToolParams({
        appContext,
        aiParams: { dateRange, from, to, currency, period },
      });

      const finalFrom = resolved.from;
      const finalTo = resolved.to;
      const finalCurrency = resolved.currency;

      const result = await getCashFlow(db, {
        teamId,
        from: finalFrom,
        to: finalTo,
        currency: finalCurrency ?? undefined,
        period: period ?? "monthly",
      });

      const targetCurrency =
        result.summary.currency || appContext.baseCurrency || "USD";
      const locale = appContext.locale || "en-US";
      const periodType = result.summary.period;

      const monthlyData = result.monthlyData.map((item) => ({
        month: item.month,
        netCashFlow: item.netCashFlow,
        income: item.income,
        expenses: item.expenses,
      }));

      const currentMonthlyCashFlow =
        monthlyData.length > 0
          ? monthlyData[monthlyData.length - 1]?.netCashFlow || 0
          : 0;

      const isPositive = result.summary.netCashFlow >= 0;
      const sign = isPositive ? "+" : "-";
      const formattedCashFlow = formatAmount({
        amount: Math.abs(result.summary.netCashFlow),
        currency: targetCurrency,
        locale,
      });

      yield { text: `Net cash flow: ${sign}${formattedCashFlow}` };

      return {
        netCashFlow: result.summary.netCashFlow,
        totalIncome: result.summary.totalIncome,
        totalExpenses: result.summary.totalExpenses,
        averageMonthlyCashFlow: result.summary.averageMonthlyCashFlow,
        currentMonthlyCashFlow,
        currency: targetCurrency,
        period: periodType,
        monthlyData,
      };
    } catch (error) {
      yield {
        text: `Failed to retrieve cash flow: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
      return {
        netCashFlow: 0,
        currency: currency || appContext.baseCurrency || "USD",
        period: period || "monthly",
        monthlyData: [],
      };
    }
  },
});
