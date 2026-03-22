import type { AppContext } from "@api/ai/context";
import { resolveToolParams } from "@api/ai/utils/period-dates";
import { checkBankAccountsRequired } from "@api/ai/utils/tool-helpers";
import { db } from "@midday/db/client";
import { getCashBalance, getCashFlow, getRunway } from "@midday/db/queries";
import { tool } from "ai";
import { z } from "zod";

const getCashFlowStressTestSchema = z.object({
  period: z
    .enum(["3-months", "6-months", "this-year", "1-year", "2-years", "5-years"])
    .optional()
    .describe("Historical period"),
  from: z.string().optional().describe("Start date (yyyy-MM-dd)"),
  to: z.string().optional().describe("End date (yyyy-MM-dd)"),
  currency: z.string().nullable().optional().describe("Currency code"),
});

export const getCashFlowStressTestTool = tool({
  description:
    "Perform cash flow stress testing - analyzes base case, worst case, and best case scenarios to assess financial resilience.",
  inputSchema: getCashFlowStressTestSchema,
  execute: async function* ({ period, from, to, currency }, executionOptions) {
    const appContext = executionOptions.experimental_context as AppContext;
    const teamId = appContext.teamId as string;

    if (!teamId) {
      yield { text: "Unable to retrieve stress test: Team ID not found." };
      return {
        baseCaseRunway: 0,
        worstCaseRunway: 0,
        bestCaseRunway: 0,
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

      const [cashFlowData, balanceResult, baseCaseRunwayFromQuery] =
        await Promise.all([
          getCashFlow(db, {
            teamId,
            from: finalFrom,
            to: finalTo,
            currency: finalCurrency ?? undefined,
            period: "monthly",
          }),
          getCashBalance(db, {
            teamId,
            currency: finalCurrency ?? undefined,
          }),
          getRunway(db, {
            teamId,
            currency: finalCurrency ?? undefined,
          }),
        ]);

      const currentCashBalance = balanceResult.totalBalance || 0;

      const monthlyData = cashFlowData.monthlyData || [];
      const averageMonthlyIncome =
        monthlyData.length > 0
          ? monthlyData.reduce(
              (sum: number, item: { income: number }) => sum + item.income,
              0,
            ) / monthlyData.length
          : 0;
      const averageMonthlyExpenses =
        monthlyData.length > 0
          ? monthlyData.reduce(
              (sum: number, item: { expenses: number }) => sum + item.expenses,
              0,
            ) / monthlyData.length
          : 0;

      const scenarios = [
        { name: "Base Case", revMult: 1.0, expMult: 1.0, revAdj: 0, expAdj: 0 },
        {
          name: "Worst Case",
          revMult: 0.7,
          expMult: 1.2,
          revAdj: -30,
          expAdj: 20,
        },
        {
          name: "Best Case",
          revMult: 1.2,
          expMult: 0.9,
          revAdj: 20,
          expAdj: -10,
        },
      ];

      const scenarioResults = scenarios.map((s, index) => {
        const adjustedIncome = averageMonthlyIncome * s.revMult;
        const adjustedExpenses = averageMonthlyExpenses * s.expMult;
        const cashFlow = adjustedIncome - adjustedExpenses;

        let runway: number;
        if (index === 0) {
          runway = baseCaseRunwayFromQuery;
        } else if (adjustedExpenses === 0) {
          runway = 0;
        } else {
          runway = Math.max(0, currentCashBalance / adjustedExpenses);
        }

        let status: "healthy" | "concerning" | "critical";
        if (runway >= 12) status = "healthy";
        else if (runway >= 6) status = "concerning";
        else status = "critical";

        return {
          scenario: s.name,
          months: Math.round(runway),
          cashFlow,
          status,
          revenueAdjustment: s.revAdj,
          expenseAdjustment: s.expAdj,
        };
      });

      const baseCaseRunway = scenarioResults[0]!.months;
      const worstCaseRunway = scenarioResults[1]!.months;
      const bestCaseRunway = scenarioResults[2]!.months;

      let stressTestScore: number;
      if (worstCaseRunway >= 12) {
        stressTestScore = Math.min(100, 80 + (worstCaseRunway - 12) * 1.67);
      } else if (worstCaseRunway >= 6) {
        stressTestScore = 60 + ((worstCaseRunway - 6) / 6) * 20;
      } else if (worstCaseRunway >= 3) {
        stressTestScore = 30 + ((worstCaseRunway - 3) / 3) * 30;
      } else {
        stressTestScore = (worstCaseRunway / 3) * 30;
      }
      stressTestScore = Math.round(stressTestScore);

      yield {
        text: `Stress test score: ${stressTestScore}/100 (worst case: ${worstCaseRunway}mo)`,
      };

      return {
        baseCaseRunway,
        worstCaseRunway,
        bestCaseRunway,
        stressTestScore,
        scenarios: scenarioResults,
        currentCashBalance,
        currency: targetCurrency,
      };
    } catch (error) {
      yield {
        text: `Failed to retrieve stress test: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
      return {
        baseCaseRunway: 0,
        worstCaseRunway: 0,
        bestCaseRunway: 0,
        currency: currency || appContext.baseCurrency || "USD",
      };
    }
  },
});
