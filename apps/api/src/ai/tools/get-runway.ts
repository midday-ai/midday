import { getWriter } from "@ai-sdk-tools/artifacts";
import type { AppContext } from "@api/ai/agents/config/shared";
import { runwayArtifact } from "@api/ai/artifacts/runway";
import { generateArtifactDescription } from "@api/ai/utils/artifact-title";
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
  showCanvas: z.boolean().default(false).describe("Show visual canvas"),
});

export const getRunwayTool = tool({
  description:
    "Calculate cash runway - months the business can operate with current cash.",
  inputSchema: getRunwaySchema,
  execute: async function* (
    { period, from, to, currency, showCanvas },
    executionOptions,
  ) {
    const appContext = executionOptions.experimental_context as AppContext;
    const teamId = appContext.teamId as string;

    if (!teamId) {
      yield {
        text: "Unable to retrieve runway: Team ID not found in context.",
      };
      return {
        runway: 0,
        status: "unknown",
      };
    }

    const { shouldYield } = checkBankAccountsRequired(appContext);
    if (shouldYield) {
      throw new Error("BANK_ACCOUNT_REQUIRED");
    }

    try {
      // Resolve parameters with proper priority:
      // 1. Forced params from widget click (if this tool was triggered by widget)
      // 2. Explicit AI params (user override)
      // 3. Dashboard metricsFilter (source of truth)
      // 4. Hardcoded defaults
      const resolved = resolveToolParams({
        toolName: "getRunway",
        appContext,
        aiParams: { period, from, to, currency },
      });

      const finalFrom = resolved.from;
      const finalTo = resolved.to;
      const finalCurrency = resolved.currency;

      // Generate description based on date range
      const description = generateArtifactDescription(finalFrom, finalTo);

      // Initialize artifact only if showCanvas is true
      let analysis: ReturnType<typeof runwayArtifact.stream> | undefined;
      if (showCanvas) {
        const writer = getWriter(executionOptions);
        analysis = runwayArtifact.stream(
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

      // Fixed 6-month trailing window for burn rate — matches the window used
      // inside getRunway so that chart projections are consistent with the
      // headline runway number.
      const burnRateToDate = endOfMonth(new UTCDate());
      const burnRateFromDate = startOfMonth(subMonths(burnRateToDate, 5));
      const burnRateFrom = format(burnRateFromDate, "yyyy-MM-dd");
      const burnRateTo = format(burnRateToDate, "yyyy-MM-dd");

      // Fetch runway, cash balance, and burn rate data in parallel
      // Runway uses a fixed 6-month trailing window internally (independent of date range)
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

      // Calculate average burn rate from burn rate data
      const averageBurnRate =
        burnRateData.length > 0
          ? burnRateData.reduce(
              (sum: number, item: { value: number | string }) =>
                sum + Number(item.value),
              0,
            ) / burnRateData.length
          : 0;

      // Get cash balance (use converted balance if available, otherwise total balance)
      const cashBalance = balanceResult.totalBalance;

      // Generate monthly projection data for chart
      const monthlyData: Array<{
        month: string;
        runway: number;
        cashBalance: number;
        burnRate: number;
      }> = [];

      // Only generate projections if we have valid data
      if (
        averageBurnRate > 0 &&
        Number.isFinite(cashBalance) &&
        Number.isFinite(averageBurnRate)
      ) {
        // Generate projections for up to 8 months or until runway reaches 0
        for (let i = 0; i <= 8; i++) {
          const monthsFromNow = i;
          const remainingCash = Math.max(
            0,
            cashBalance - averageBurnRate * monthsFromNow,
          );
          const projectedRunwayMonths =
            averageBurnRate > 0 ? remainingCash / averageBurnRate : 0;

          // Skip if runwayMonths is invalid
          if (!Number.isFinite(projectedRunwayMonths)) continue;

          monthlyData.push({
            month: i === 0 ? "Now" : `+${i}mo`,
            runway: projectedRunwayMonths,
            cashBalance: remainingCash,
            burnRate: averageBurnRate,
          });

          // Stop adding projections once runway reaches 0
          if (projectedRunwayMonths <= 0) break;
        }
      }

      // Determine status based on runway months
      let status: "healthy" | "concerning" | "critical";
      let statusMessage: string;

      if (runway >= 12) {
        status = "healthy";
        statusMessage = "healthy";
      } else if (runway >= 6) {
        status = "concerning";
        statusMessage = "concerning";
      } else {
        status = "critical";
        statusMessage = "critical";
      }

      // Update artifact with chart data first if showCanvas is true
      if (showCanvas && analysis && monthlyData.length > 0) {
        await analysis.update({
          stage: "chart_ready",
          currency: targetCurrency,
          from: finalFrom,
          to: finalTo,
          description,
          chart: {
            monthlyData,
          },
        });
      }

      // Update artifact with metrics if showCanvas is true
      if (showCanvas && analysis) {
        await analysis.update({
          stage: "metrics_ready",
          currency: targetCurrency,
          from: finalFrom,
          to: finalTo,
          description,
          chart: {
            monthlyData,
          },
          metrics: {
            currentRunway: runway,
            cashBalance,
            averageBurnRate,
            status,
          },
        });
      }

      // Build response text
      let responseText = `**Cash Runway:** ${runway} months\n\n`;
      responseText += `**Status:** ${statusMessage.charAt(0).toUpperCase() + statusMessage.slice(1)}\n\n`;

      if (runway === 0) {
        responseText +=
          "Unable to calculate runway. This may be due to insufficient data or no burn rate detected.";
      } else {
        responseText +=
          "Cash runway represents how many months your business can operate with current cash reserves at the current spending rate. ";
        if (status === "healthy") {
          responseText +=
            "You have a healthy cash position with 12+ months of runway.";
        } else if (status === "concerning") {
          responseText +=
            "Consider monitoring your burn rate and cash flow closely. You may want to focus on increasing revenue or reducing expenses.";
        } else {
          responseText +=
            "Your runway is critical. Immediate action may be needed to extend your runway through cost reduction, revenue increase, or securing additional funding.";
        }
      }

      // Generate recommendations based on status
      const recommendations: string[] = [];
      if (runway === 0) {
        recommendations.push(
          "Ensure transactions are properly categorized to calculate runway",
        );
        recommendations.push(
          "Check that bank accounts are connected and synced",
        );
      } else if (status === "critical") {
        recommendations.push(
          "Immediately reduce expenses or increase revenue to extend runway",
        );
        recommendations.push(
          "Consider securing additional funding or investment",
        );
        recommendations.push("Review and optimize all recurring expenses");
      } else if (status === "concerning") {
        recommendations.push(
          "Monitor burn rate and cash flow closely each month",
        );
        recommendations.push(
          "Focus on increasing revenue or reducing expenses",
        );
        recommendations.push("Build a plan to extend runway to 12+ months");
      } else {
        recommendations.push("Maintain current cash management practices");
        recommendations.push(
          "Continue monitoring runway monthly to ensure healthy position",
        );
      }

      // Generate summary for artifact
      let summaryText = "";
      if (runway === 0) {
        summaryText =
          "Unable to calculate runway. This may be due to insufficient data or no burn rate detected.";
      } else {
        summaryText = `Your business has ${runway} months of cash runway remaining. `;
        if (status === "healthy") {
          summaryText +=
            "This is a healthy position with sufficient cash reserves for 12+ months of operations.";
        } else if (status === "concerning") {
          summaryText +=
            "Your runway is below the recommended 12 months. Monitor cash flow closely and consider strategies to extend runway.";
        } else {
          summaryText +=
            "Your runway is critical. Immediate action is needed to extend runway through cost reduction, revenue increase, or securing additional funding.";
        }
      }

      // Update artifact with analysis if showCanvas is true
      if (showCanvas && analysis) {
        await analysis.update({
          stage: "analysis_ready",
          currency: targetCurrency,
          from: finalFrom,
          to: finalTo,
          description,
          chart: {
            monthlyData,
          },
          metrics: {
            currentRunway: runway,
            cashBalance,
            averageBurnRate,
            status,
          },
          analysis: {
            summary: summaryText,
            recommendations,
          },
        });
      }

      // Mention canvas if requested
      if (showCanvas) {
        responseText +=
          "\n\nA detailed visual runway analysis with charts and trends is available.";
      }

      yield { text: responseText };

      return {
        runway,
        status,
      };
    } catch (error) {
      yield {
        text: `Failed to retrieve runway: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
      return {
        runway: 0,
        status: "unknown" as const,
      };
    }
  },
});
