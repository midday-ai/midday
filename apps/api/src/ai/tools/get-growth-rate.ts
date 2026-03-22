import type { AppContext } from "@api/ai/context";
import { resolveToolParams } from "@api/ai/utils/period-dates";
import { checkBankAccountsRequired } from "@api/ai/utils/tool-helpers";
import { db } from "@midday/db/client";
import { getGrowthRate } from "@midday/db/queries";
import { formatAmount } from "@midday/utils/format";
import { tool } from "ai";
import { z } from "zod";

const getGrowthRateSchema = z.object({
  dateRange: z
    .enum(["3-months", "6-months", "this-year", "1-year", "2-years", "5-years"])
    .optional()
    .describe("Historical period"),
  from: z.string().optional().describe("Start date (yyyy-MM-dd)"),
  to: z.string().optional().describe("End date (yyyy-MM-dd)"),
  currency: z.string().nullable().optional().describe("Currency code"),
  type: z
    .enum(["revenue", "profit"])
    .default("revenue")
    .describe("Growth type: revenue or profit"),
  revenueType: z.enum(["gross", "net"]).optional().describe("Revenue type"),
  period: z
    .enum(["monthly", "quarterly", "yearly"])
    .default("quarterly")
    .describe("Comparison period: monthly, quarterly (default), or yearly"),
});

export const getGrowthRateTool = tool({
  description:
    "Calculate growth rate - shows period-over-period comparisons and trends.",
  inputSchema: getGrowthRateSchema,
  execute: async function* (
    { dateRange, from, to, currency, type, revenueType, period },
    executionOptions,
  ) {
    const appContext = executionOptions.experimental_context as AppContext;
    const teamId = appContext.teamId as string;

    if (!teamId) {
      yield {
        text: "Unable to retrieve growth rate: Team ID not found in context.",
      };
      return {
        growthRate: 0,
        currentTotal: 0,
        prevTotal: 0,
        currency: currency || appContext.baseCurrency || "USD",
        period,
        trend: "neutral",
      };
    }

    const { shouldYield } = checkBankAccountsRequired(appContext);
    if (shouldYield) {
      throw new Error("BANK_ACCOUNT_REQUIRED");
    }

    try {
      const resolved = resolveToolParams({
        appContext,
        aiParams: { dateRange, from, to, currency, revenueType, type, period },
      });

      const finalFrom = resolved.from;
      const finalTo = resolved.to;
      const finalCurrency = resolved.currency;
      const finalRevenueType = resolved.revenueType ?? "net";

      const result = await getGrowthRate(db, {
        teamId,
        from: finalFrom,
        to: finalTo,
        currency: finalCurrency ?? undefined,
        type,
        revenueType: finalRevenueType,
        period,
      });

      const growthRate = result.summary.periodGrowthRate;
      const currentTotal = result.summary.currentTotal;
      const prevTotal = result.summary.previousTotal;
      const targetCurrency =
        result.summary.currency || appContext.baseCurrency || "USD";
      const locale = appContext.locale || "en-US";
      const trend = result.summary.trend;

      const formattedCurrentTotal = formatAmount({
        amount: Math.abs(currentTotal),
        currency: targetCurrency,
        locale,
      });

      yield {
        text: `${type === "profit" ? "Profit" : "Revenue"} growth: ${growthRate > 0 ? "+" : ""}${growthRate.toFixed(1)}% (${formattedCurrentTotal})`,
      };

      return {
        growthRate,
        currentTotal,
        prevTotal,
        currency: targetCurrency,
        period,
        type,
        revenueType: finalRevenueType,
        trend,
        changeAmount: currentTotal - prevTotal,
      };
    } catch (error) {
      yield {
        text: `Failed to retrieve growth rate: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
      return {
        growthRate: 0,
        currentTotal: 0,
        prevTotal: 0,
        currency: currency || appContext.baseCurrency || "USD",
        period,
        trend: "neutral",
      };
    }
  },
});
