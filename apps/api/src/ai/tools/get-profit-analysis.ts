import type { AppContext } from "@api/ai/context";
import { resolveToolParams } from "@api/ai/utils/period-dates";
import { checkBankAccountsRequired } from "@api/ai/utils/tool-helpers";
import { db } from "@midday/db/client";
import { getReports } from "@midday/db/queries";
import { formatAmount } from "@midday/utils/format";
import { tool } from "ai";
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
});

export const getProfitAnalysisTool = tool({
  description:
    "Analyze profit (revenue minus expenses) - totals, trends, and margins.",
  inputSchema: getProfitAnalysisSchema,
  execute: async function* (
    { period, from, to, currency, revenueType },
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
      const resolved = resolveToolParams({
        appContext,
        aiParams: { period, from, to, currency, revenueType },
      });

      const finalFrom = resolved.from;
      const finalTo = resolved.to;
      const finalCurrency = resolved.currency;
      const finalRevenueType = resolved.revenueType ?? "net";

      const profitResult = await getReports(db, {
        teamId,
        from: finalFrom,
        to: finalTo,
        currency: finalCurrency ?? undefined,
        type: "profit",
        revenueType: finalRevenueType,
      });

      const currentTotal = profitResult.summary.currentTotal;
      const prevTotal = profitResult.summary.prevTotal;
      const targetCurrency =
        profitResult.summary.currency || appContext.baseCurrency || "USD";
      const locale = appContext.locale || "en-US";
      const monthlyData = profitResult.result || [];

      const changeAmount = currentTotal - prevTotal;
      const changePercentage =
        prevTotal !== 0
          ? Math.round((changeAmount / Math.abs(prevTotal)) * 100)
          : 0;

      const formattedTotal = formatAmount({
        amount: Math.abs(currentTotal),
        currency: targetCurrency,
        locale,
      });

      yield { text: `Total profit: ${formattedTotal}` };

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
