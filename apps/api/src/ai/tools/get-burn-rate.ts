import type { AppContext } from "@api/ai/context";
import { resolveToolParams } from "@api/ai/utils/period-dates";
import { checkBankAccountsRequired } from "@api/ai/utils/tool-helpers";
import { db } from "@midday/db/client";
import { getBurnRate, getRunway, getSpending } from "@midday/db/queries";
import { formatAmount } from "@midday/utils/format";
import { tool } from "ai";
import {
  eachMonthOfInterval,
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
} from "date-fns";
import { z } from "zod";

const getBurnRateSchema = z.object({
  period: z
    .enum(["3-months", "6-months", "this-year", "1-year", "2-years", "5-years"])
    .optional()
    .describe("Historical period"),
  from: z.string().optional().describe("Start date (yyyy-MM-dd)"),
  to: z.string().optional().describe("End date (yyyy-MM-dd)"),
  currency: z.string().nullable().optional().describe("Currency code"),
});

export const getBurnRateTool = tool({
  description:
    "Calculate monthly cash burn rate - spending per month with trends.",
  inputSchema: getBurnRateSchema,
  execute: async function* ({ period, from, to, currency }, executionOptions) {
    const appContext = executionOptions.experimental_context as AppContext;
    const teamId = appContext.teamId as string;

    if (!teamId) {
      yield {
        text: "Unable to retrieve burn rate: Team ID not found in context.",
      };
      return {
        currentMonthlyBurn: 0,
        averageBurnRate: 0,
        runway: 0,
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
        aiParams: { period, from, to, currency },
      });

      const finalFrom = resolved.from;
      const finalTo = resolved.to;
      const finalCurrency = resolved.currency;

      const targetCurrency = finalCurrency || "USD";
      const locale = appContext.locale || "en-US";

      const [burnRateData, runway, spendingData] = await Promise.all([
        getBurnRate(db, {
          teamId,
          from: finalFrom,
          to: finalTo,
          currency: finalCurrency ?? undefined,
        }),
        getRunway(db, {
          teamId,
          currency: finalCurrency ?? undefined,
        }),
        getSpending(db, {
          teamId,
          from: finalFrom,
          to: finalTo,
          currency: finalCurrency ?? undefined,
        }),
      ]);

      if (burnRateData.length === 0) {
        yield {
          text: "No burn rate data available for the selected period.",
        };
        return {
          currentMonthlyBurn: 0,
          averageBurnRate: 0,
          runway: 0,
          currency: targetCurrency,
          monthlyData: [],
        };
      }

      const currentMonthlyBurn =
        burnRateData[burnRateData.length - 1]?.value || 0;

      const averageBurnRate = Math.round(
        burnRateData.reduce((sum, item) => sum + (item?.value || 0), 0) /
          burnRateData.length,
      );

      const topSpendingCategory = spendingData[0];
      const topCategory = topSpendingCategory
        ? {
            name: topSpendingCategory.name || "Uncategorized",
            amount: topSpendingCategory.amount || 0,
            percentage: topSpendingCategory.percentage || 0,
          }
        : null;

      const burnRateDataMap = new Map(
        burnRateData.map((item) => [item.date, item.value]),
      );

      const fromDate = startOfMonth(parseISO(finalFrom));
      const toDate = endOfMonth(parseISO(finalTo));
      const monthSeries = eachMonthOfInterval({
        start: fromDate,
        end: toDate,
      });

      const monthlyData = monthSeries.map((month) => {
        const monthKey = format(month, "yyyy-MM-dd");
        return {
          month: format(month, "MMM"),
          amount: burnRateDataMap.get(monthKey) || 0,
          average: averageBurnRate,
        };
      });

      const formattedBurn = formatAmount({
        amount: currentMonthlyBurn,
        currency: targetCurrency,
        locale,
      });

      yield { text: `Current monthly burn: ${formattedBurn}` };

      return {
        currentMonthlyBurn,
        averageBurnRate,
        runway,
        currency: targetCurrency,
        topCategory,
        monthlyData,
      };
    } catch (error) {
      yield {
        text: `Failed to retrieve burn rate: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
      return {
        currentMonthlyBurn: 0,
        averageBurnRate: 0,
        runway: 0,
        currency: currency || appContext.baseCurrency || "USD",
        monthlyData: [],
      };
    }
  },
});
