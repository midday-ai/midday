import type { AppContext } from "@api/ai/context";
import { resolveToolParams } from "@api/ai/utils/period-dates";
import { checkBankAccountsRequired } from "@api/ai/utils/tool-helpers";
import { db } from "@midday/db/client";
import { getReports } from "@midday/db/queries";
import { formatAmount } from "@midday/utils/format";
import { tool } from "ai";
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
});

export const getRevenueSummaryTool = tool({
  description:
    "Analyze revenue (income/sales) - totals, trends, and growth rates.",
  inputSchema: getRevenueSummarySchema,
  execute: async function* (
    { period, from, to, currency, revenueType },
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
      const resolved = resolveToolParams({
        appContext,
        aiParams: { period, from, to, currency, revenueType },
      });

      const finalFrom = resolved.from;
      const finalTo = resolved.to;
      const finalCurrency = resolved.currency;
      const finalRevenueType = resolved.revenueType ?? "net";

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

      const changeAmount = currentTotal - prevTotal;
      const changePercentage =
        prevTotal !== 0
          ? Math.round((changeAmount / Math.abs(prevTotal)) * 100)
          : 0;

      const last12Months = monthlyData.slice(-12);
      const averageMonthlyRevenue =
        last12Months.length > 0
          ? last12Months.reduce((sum, item) => sum + item.current.value, 0) /
            last12Months.length
          : 0;

      const formattedTotal = formatAmount({
        amount: Math.abs(currentTotal),
        currency: targetCurrency,
        locale,
      });

      yield { text: `Total revenue: ${formattedTotal}` };

      return {
        currentTotal,
        prevTotal,
        currency: targetCurrency,
        changePercentage,
        changeAmount,
        averageMonthlyRevenue,
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
