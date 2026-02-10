import { getWriter } from "@ai-sdk-tools/artifacts";
import type { AppContext } from "@api/ai/agents/config/shared";
import { cashFlowStressTestArtifact } from "@api/ai/artifacts/cash-flow-stress-test";
import { generateArtifactDescription } from "@api/ai/utils/artifact-title";
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
  showCanvas: z.boolean().default(false).describe("Show visual analytics"),
});

export const getCashFlowStressTestTool = tool({
  description:
    "Perform cash flow stress testing - analyzes base case, worst case, and best case scenarios to assess financial resilience.",
  inputSchema: getCashFlowStressTestSchema,
  execute: async function* (
    { period, from, to, currency, showCanvas },
    executionOptions,
  ) {
    const appContext = executionOptions.experimental_context as AppContext;
    const teamId = appContext.teamId as string;

    if (!teamId) {
      yield {
        text: "Unable to retrieve cash flow stress test: Team ID not found in context.",
      };
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
        toolName: "getCashFlowStressTest",
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
        | ReturnType<typeof cashFlowStressTestArtifact.stream>
        | undefined;
      if (showCanvas) {
        const writer = getWriter(executionOptions);
        analysis = cashFlowStressTestArtifact.stream(
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

      // Fetch required data in parallel
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

      // Get current cash balance
      const currentCashBalance = balanceResult.totalBalance || 0;

      // Calculate average monthly income and expenses from cash flow data
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

      // Scenario definitions
      const scenarios = [
        {
          name: "Base Case",
          revenueMultiplier: 1.0,
          expenseMultiplier: 1.0,
          revenueAdjustment: 0,
          expenseAdjustment: 0,
        },
        {
          name: "Worst Case",
          revenueMultiplier: 0.7, // -30% revenue
          expenseMultiplier: 1.2, // +20% expenses
          revenueAdjustment: -30,
          expenseAdjustment: 20,
        },
        {
          name: "Best Case",
          revenueMultiplier: 1.2, // +20% revenue
          expenseMultiplier: 0.9, // -10% expenses
          revenueAdjustment: 20,
          expenseAdjustment: -10,
        },
      ];

      // Calculate scenarios
      const scenarioResults = scenarios.map((scenario, index) => {
        const adjustedMonthlyIncome =
          averageMonthlyIncome * scenario.revenueMultiplier;
        const adjustedMonthlyExpenses =
          averageMonthlyExpenses * scenario.expenseMultiplier;
        const adjustedMonthlyCashFlow =
          adjustedMonthlyIncome - adjustedMonthlyExpenses;

        // Calculate runway (months until cash runs out)
        // Base case uses the same calculation as getRunway tool
        // Other scenarios use adjusted expenses
        let runway: number;
        if (index === 0) {
          // Base case: use the same calculation as regular runway tool
          runway = baseCaseRunwayFromQuery;
        } else if (adjustedMonthlyExpenses === 0) {
          runway = 0;
        } else {
          // Other scenarios: calculate based on adjusted expenses
          runway = Math.max(0, currentCashBalance / adjustedMonthlyExpenses);
        }

        // Determine status
        let status: "healthy" | "concerning" | "critical";
        if (runway >= 12) {
          status = "healthy";
        } else if (runway >= 6) {
          status = "concerning";
        } else {
          status = "critical";
        }

        // Round runway to whole months
        const roundedRunway = Math.round(runway);

        return {
          scenario: scenario.name,
          months: roundedRunway,
          cashFlow: adjustedMonthlyCashFlow,
          status,
          revenueAdjustment: scenario.revenueAdjustment,
          expenseAdjustment: scenario.expenseAdjustment,
          adjustedMonthlyIncome,
          adjustedMonthlyExpenses,
        };
      });

      // Project cash balance over time (up to 24 months or until zero)
      const projectionMonths: Array<{
        month: number;
        baseCase: number;
        worstCase: number;
        bestCase: number;
      }> = [];

      if (scenarioResults.length < 3) {
        throw new Error("Failed to calculate scenario results");
      }

      const baseCaseResult = scenarioResults[0]!;
      const worstCaseResult = scenarioResults[1]!;
      const bestCaseResult = scenarioResults[2]!;

      const maxMonths = 24;
      for (let month = 0; month <= maxMonths; month++) {
        // Base case projection
        let baseCaseBalance = currentCashBalance;
        if (baseCaseResult.cashFlow < 0) {
          baseCaseBalance = Math.max(
            0,
            currentCashBalance + baseCaseResult.cashFlow * month,
          );
        } else {
          baseCaseBalance =
            currentCashBalance + baseCaseResult.cashFlow * month;
        }

        // Worst case projection
        let worstCaseBalance = currentCashBalance;
        if (worstCaseResult.cashFlow < 0) {
          worstCaseBalance = Math.max(
            0,
            currentCashBalance + worstCaseResult.cashFlow * month,
          );
        } else {
          worstCaseBalance =
            currentCashBalance + worstCaseResult.cashFlow * month;
        }

        // Best case projection
        let bestCaseBalance = currentCashBalance;
        if (bestCaseResult.cashFlow < 0) {
          bestCaseBalance = Math.max(
            0,
            currentCashBalance + bestCaseResult.cashFlow * month,
          );
        } else {
          bestCaseBalance =
            currentCashBalance + bestCaseResult.cashFlow * month;
        }

        projectionMonths.push({
          month,
          baseCase: Math.round(baseCaseBalance * 100) / 100,
          worstCase: Math.round(worstCaseBalance * 100) / 100,
          bestCase: Math.round(bestCaseBalance * 100) / 100,
        });

        // Stop if all scenarios reach zero (optimization)
        if (
          baseCaseBalance <= 0 &&
          worstCaseBalance <= 0 &&
          bestCaseBalance <= 0
        ) {
          break;
        }
      }

      // Extract runway values
      const baseCaseRunway = baseCaseResult.months;
      const worstCaseRunway = worstCaseResult.months;
      const bestCaseRunway = bestCaseResult.months;

      // Calculate stress test score based on worst-case runway
      // 0-3 months = 0-30 (critical)
      // 3-6 months = 31-60 (concerning)
      // 6-12 months = 61-80 (healthy)
      // 12+ months = 81-100 (excellent)
      let stressTestScore: number;
      if (worstCaseRunway >= 12) {
        stressTestScore = Math.min(100, 80 + (worstCaseRunway - 12) * 1.67); // 80-100 for 12+ months
      } else if (worstCaseRunway >= 6) {
        stressTestScore = 60 + ((worstCaseRunway - 6) / 6) * 20; // 60-80 for 6-12 months
      } else if (worstCaseRunway >= 3) {
        stressTestScore = 30 + ((worstCaseRunway - 3) / 3) * 30; // 30-60 for 3-6 months
      } else {
        stressTestScore = (worstCaseRunway / 3) * 30; // 0-30 for 0-3 months
      }
      stressTestScore = Math.round(stressTestScore);

      // Update artifact with chart data if showCanvas is true
      if (showCanvas && analysis) {
        await analysis.update({
          stage: "chart_ready",
          currency: targetCurrency,
          from: finalFrom,
          to: finalTo,
          description,
          chart: {
            projectedCashBalance: projectionMonths,
          },
        });
      }

      // Update artifact with metrics if showCanvas is true
      if (showCanvas && analysis) {
        await analysis.update({
          stage: "metrics_ready",
          currency: targetCurrency,
          chart: {
            projectedCashBalance: projectionMonths,
          },
          metrics: {
            baseCaseRunway,
            worstCaseRunway,
            bestCaseRunway,
            stressTestScore,
          },
        });
      }

      // Format runway as whole months
      const formatRunway = (runway: number): string => {
        return Math.round(runway).toString();
      };

      // Generate summary text (plain text, no markdown or emojis)
      const formattedBaseRunway = formatRunway(baseCaseRunway);
      const formattedWorstRunway = formatRunway(worstCaseRunway);
      const formattedBestRunway = formatRunway(bestCaseRunway);

      let summaryText = `Your cash flow stress test shows a base case runway of ${formattedBaseRunway} months, a worst case runway of ${formattedWorstRunway} months (assuming revenue drops 30% and expenses increase 20%), and a best case runway of ${formattedBestRunway} months (assuming revenue increases 20% and expenses decrease 10%). `;
      summaryText += `Your stress test score is ${stressTestScore} out of 100. `;

      if (worstCaseRunway < 6) {
        summaryText +=
          "Your worst-case scenario shows less than 6 months of runway, indicating high financial risk. ";
      } else if (worstCaseRunway < 12) {
        summaryText +=
          "Your worst-case scenario shows 6 to 11 months of runway, which is manageable but requires close monitoring. ";
      } else {
        summaryText +=
          "Your worst-case scenario shows 12 or more months of runway, indicating good financial resilience. ";
      }

      summaryText +=
        "Continue monitoring your cash flow trends and adjust your financial strategy as needed.";

      // Update artifact with analysis if showCanvas is true
      if (showCanvas && analysis) {
        await analysis.update({
          stage: "analysis_ready",
          currency: targetCurrency,
          chart: {
            projectedCashBalance: projectionMonths,
          },
          metrics: {
            baseCaseRunway,
            worstCaseRunway,
            bestCaseRunway,
            stressTestScore,
          },
          analysis: {
            summary: summaryText,
          },
        });
      }

      // Mention canvas if requested
      if (showCanvas) {
        summaryText +=
          "\n\nA detailed visual stress test analysis with cash balance projections is available.";
      }

      yield { text: summaryText };

      return {
        baseCaseRunway,
        worstCaseRunway,
        bestCaseRunway,
        currency: targetCurrency,
        stressTestScore,
      };
    } catch (error) {
      yield {
        text: `Failed to retrieve cash flow stress test: ${error instanceof Error ? error.message : "Unknown error"}`,
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
