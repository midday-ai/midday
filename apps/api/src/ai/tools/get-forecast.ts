import type { AppContext } from "@api/ai/context";
import { resolveToolParams } from "@api/ai/utils/period-dates";
import { checkBankAccountsRequired } from "@api/ai/utils/tool-helpers";
import { db } from "@midday/db/client";
import { getRevenueForecast } from "@midday/db/queries";
import { formatAmount } from "@midday/utils/format";
import { tool } from "ai";
import { format, parseISO } from "date-fns";
import { z } from "zod";

const getForecastSchema = z.object({
  period: z
    .enum(["3-months", "6-months", "this-year", "1-year", "2-years", "5-years"])
    .optional()
    .describe("Historical period"),
  from: z.string().optional().describe("Start date (yyyy-MM-dd)"),
  to: z.string().optional().describe("End date (yyyy-MM-dd)"),
  currency: z.string().nullable().optional().describe("Currency code"),
  revenueType: z.enum(["gross", "net"]).optional().describe("Revenue type"),
  forecastMonths: z.number().default(6).describe("Months to forecast"),
});

export const getForecastTool = tool({
  description:
    "Generate revenue forecast - shows projections, growth rates, and billable hours.",
  inputSchema: getForecastSchema,
  execute: async function* (
    { period, from, to, currency, revenueType, forecastMonths },
    executionOptions,
  ) {
    const appContext = executionOptions.experimental_context as AppContext;
    const teamId = appContext.teamId as string;

    if (!teamId) {
      yield { text: "Unable to retrieve forecast: Team ID not found." };
      return {
        nextMonthProjection: 0,
        avgMonthlyGrowthRate: 0,
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
      const targetCurrency = finalCurrency || "USD";
      const locale = appContext.locale || "en-US";

      const forecastResult = await getRevenueForecast(db, {
        teamId,
        from: finalFrom,
        to: finalTo,
        forecastMonths,
        currency: finalCurrency ?? undefined,
        revenueType: finalRevenueType,
      });

      const allDates = [
        ...forecastResult.historical.map((item) => item.date),
        ...forecastResult.forecast.map((item) => item.date),
      ];
      const years = new Set(
        allDates.map((date) => parseISO(date).getFullYear()),
      );
      const spansMultipleYears = years.size > 1;

      const monthlyData: Array<{
        month: string;
        date: string;
        actual: number | null;
        forecasted: number | null;
        optimistic: number | null;
        pessimistic: number | null;
      }> = [];

      for (const [index, item] of forecastResult.historical.entries()) {
        const date = parseISO(item.date);
        const month = spansMultipleYears
          ? format(date, "MMM ''yy")
          : format(date, "MMM");
        const isLastHistorical = index === forecastResult.historical.length - 1;

        monthlyData.push({
          month,
          date: item.date,
          actual: item.value,
          forecasted: isLastHistorical ? item.value : null,
          optimistic: null,
          pessimistic: null,
        });
      }

      for (const item of forecastResult.forecast) {
        const date = parseISO(item.date);
        const month = spansMultipleYears
          ? format(date, "MMM ''yy")
          : format(date, "MMM");
        monthlyData.push({
          month,
          date: item.date,
          actual: null,
          forecasted: item.value,
          optimistic: "optimistic" in item ? (item.optimistic as number) : null,
          pessimistic:
            "pessimistic" in item ? (item.pessimistic as number) : null,
        });
      }

      const summary = forecastResult.summary;

      const formattedProjection = formatAmount({
        amount: summary.nextMonthProjection,
        currency: targetCurrency,
        locale,
      });

      yield { text: `Next month projection: ${formattedProjection}` };

      return {
        nextMonthProjection: summary.nextMonthProjection,
        avgMonthlyGrowthRate: summary.avgMonthlyGrowthRate,
        currency: targetCurrency,
        monthlyData,
        peakMonth: {
          month: format(parseISO(summary.peakMonth.date), "MMM"),
          value: summary.peakMonth.value,
        },
        unpaidInvoices: summary.unpaidInvoices.totalAmount,
        billableHours: summary.billableHours.totalHours,
      };
    } catch (error) {
      yield {
        text: `Failed to retrieve forecast: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
      return {
        nextMonthProjection: 0,
        avgMonthlyGrowthRate: 0,
        currency: currency || appContext.baseCurrency || "USD",
        monthlyData: [],
      };
    }
  },
});
