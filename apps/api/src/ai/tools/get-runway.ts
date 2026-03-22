import type { AppContext } from "@api/ai/context";
import { resolveToolParams } from "@api/ai/utils/period-dates";
import { checkBankAccountsRequired } from "@api/ai/utils/tool-helpers";
import { UTCDate } from "@date-fns/utc";
import { db } from "@midday/db/client";
import { getBurnRate, getCashBalance, getRunway } from "@midday/db/queries";
import { tool } from "ai";
import { endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import { z } from "zod";

const getRunwaySchema = z.object({
  period: z
    .enum(["3-months", "6-months", "this-year", "1-year", "2-years", "5-years"])
    .optional()
    .describe("Historical period"),
  from: z.string().optional().describe("Start date (yyyy-MM-dd)"),
  to: z.string().optional().describe("End date (yyyy-MM-dd)"),
  currency: z.string().nullable().optional().describe("Currency code"),
});

export const getRunwayTool = tool({
  description:
    "Calculate cash runway - months the business can operate with current cash.",
  inputSchema: getRunwaySchema,
  execute: async function* (
    { period, from, to, currency },
    executionOptions,
  ) {
    const appContext = executionOptions.experimental_context as AppContext;
    const teamId = appContext.teamId as string;

    if (!teamId) {
      yield { text: "Unable to retrieve runway: Team ID not found." };
      return { runway: 0, status: "unknown" as const };
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

      const finalCurrency = resolved.currency;
      const targetCurrency = finalCurrency || "USD";

      const burnRateToDate = endOfMonth(new UTCDate());
      const burnRateFromDate = startOfMonth(subMonths(burnRateToDate, 5));
      const burnRateFrom = format(burnRateFromDate, "yyyy-MM-dd");
      const burnRateTo = format(burnRateToDate, "yyyy-MM-dd");

      const [runway, balanceResult, burnRateData] = await Promise.all([
        getRunway(db, {
          teamId,
          currency: finalCurrency ?? undefined,
        }),
        getCashBalance(db, {
          teamId,
          currency: finalCurrency ?? undefined,
        }),
        getBurnRate(db, {
          teamId,
          from: burnRateFrom,
          to: burnRateTo,
          currency: finalCurrency ?? undefined,
        }),
      ]);

      const averageBurnRate =
        burnRateData.length > 0
          ? burnRateData.reduce(
              (sum: number, item: { value: number | string }) =>
                sum + Number(item.value),
              0,
            ) / burnRateData.length
          : 0;

      const cashBalance = balanceResult.totalBalance;

      const monthlyData: Array<{
        month: string;
        runway: number;
        cashBalance: number;
        burnRate: number;
      }> = [];

      if (
        averageBurnRate > 0 &&
        Number.isFinite(cashBalance) &&
        Number.isFinite(averageBurnRate)
      ) {
        for (let i = 0; i <= 8; i++) {
          const remainingCash = Math.max(
            0,
            cashBalance - averageBurnRate * i,
          );
          const projectedRunway =
            averageBurnRate > 0 ? remainingCash / averageBurnRate : 0;

          if (!Number.isFinite(projectedRunway)) continue;

          monthlyData.push({
            month: i === 0 ? "Now" : `+${i}mo`,
            runway: projectedRunway,
            cashBalance: remainingCash,
            burnRate: averageBurnRate,
          });

          if (projectedRunway <= 0) break;
        }
      }

      let status: "healthy" | "concerning" | "critical";
      if (runway >= 12) {
        status = "healthy";
      } else if (runway >= 6) {
        status = "concerning";
      } else {
        status = "critical";
      }

      yield { text: `Cash runway: ${runway} months (${status})` };

      return {
        runway,
        status,
        cashBalance,
        averageBurnRate,
        currency: targetCurrency,
        monthlyData,
      };
    } catch (error) {
      yield {
        text: `Failed to retrieve runway: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
      return { runway: 0, status: "unknown" as const };
    }
  },
});
