import { openai } from "@ai-sdk/openai";
import { getWriter } from "@ai-sdk-tools/artifacts";
import type { AppContext } from "@api/ai/agents/config/shared";
import { burnRateArtifact } from "@api/ai/artifacts/burn-rate";
import { generateArtifactDescription } from "@api/ai/utils/artifact-title";
import { resolveToolParams } from "@api/ai/utils/period-dates";
import { checkBankAccountsRequired } from "@api/ai/utils/tool-helpers";
import { db } from "@midday/db/client";
import { getBurnRate, getRunway, getSpending } from "@midday/db/queries";
import { formatAmount } from "@midday/utils/format";
import { generateText, tool } from "ai";
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
  showCanvas: z.boolean().default(false).describe("Show visual canvas"),
});

export const getBurnRateTool = tool({
  description:
    "Calculate monthly cash burn rate - spending per month with trends.",
  inputSchema: getBurnRateSchema,
  execute: async function* (
    { period, from, to, currency, showCanvas },
    executionOptions,
  ) {
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
        toolName: "getBurnRate",
        appContext,
        aiParams: { period, from, to, currency },
      });

      const finalFrom = resolved.from;
      const finalTo = resolved.to;
      const finalCurrency = resolved.currency;

      // Generate description based on date range
      const description = generateArtifactDescription(finalFrom, finalTo);

      // Initialize artifact only if showCanvas is true
      let analysis: ReturnType<typeof burnRateArtifact.stream> | undefined;
      if (showCanvas) {
        const writer = getWriter(executionOptions);
        analysis = burnRateArtifact.stream(
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
      const locale = appContext.locale || "en-US";

      // Fetch data in parallel
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

      // Early return if no burn rate data
      if (burnRateData.length === 0) {
        if (showCanvas && analysis) {
          await analysis.update({
            stage: "analysis_ready",
            currency: targetCurrency,
            chart: {
              monthlyData: [],
            },
            metrics: {
              currentMonthlyBurn: 0,
              averageBurnRate: 0,
              runway: 0,
              runwayStatus: "No data available",
              topCategory: {
                name: "No data",
                percentage: 0,
                amount: 0,
              },
            },
            analysis: {
              burnRateChange: {
                percentage: 0,
                period: "0 months",
                startValue: 0,
                endValue: 0,
              },
              summary: "No burn rate data available for the selected period.",
              recommendations: [
                "Ensure transactions are properly categorized",
                "Check date range selection",
              ],
            },
          });
        }

        yield {
          text: "No burn rate data available for the selected period. Ensure transactions are properly categorized.",
        };

        return {
          currentMonthlyBurn: 0,
          averageBurnRate: 0,
          runway: 0,
          currency: targetCurrency,
        };
      }

      // Calculate metrics
      const currentMonthlyBurn =
        burnRateData.length > 0
          ? burnRateData[burnRateData.length - 1]?.value || 0
          : 0;

      const averageBurnRate =
        burnRateData.length > 0
          ? Math.round(
              burnRateData.reduce((sum, item) => sum + (item?.value || 0), 0) /
                burnRateData.length,
            )
          : 0;

      // Get top spending category (first item is highest)
      const topSpendingCategory = spendingData[0];
      const topCategory = topSpendingCategory
        ? {
            name: topSpendingCategory.name || "Uncategorized",
            amount: topSpendingCategory.amount || 0,
            percentage: topSpendingCategory.percentage || 0,
          }
        : {
            name: "Uncategorized",
            amount: 0,
            percentage: 0,
          };

      // Calculate burn rate change
      const burnRateStartValue =
        burnRateData.length > 0 ? burnRateData[0]?.value || 0 : 0;
      const burnRateEndValue = currentMonthlyBurn;
      const burnRateChangePercentage =
        burnRateStartValue > 0
          ? Math.round(
              ((burnRateEndValue - burnRateStartValue) / burnRateStartValue) *
                100,
            )
          : 0;
      const burnRateChangePeriod = `${burnRateData.length} months`;

      // Generate monthly chart data
      const fromDate = startOfMonth(parseISO(finalFrom));
      const toDate = endOfMonth(parseISO(finalTo));
      const monthSeries = eachMonthOfInterval({
        start: fromDate,
        end: toDate,
      });

      // Create a map of burnRateData by date for efficient lookup
      const burnRateDataMap = new Map(
        burnRateData.map((item) => [item.date, item.value]),
      );

      const monthlyData = monthSeries.map((month) => {
        const monthKey = format(month, "yyyy-MM-dd");
        const currentBurn = burnRateDataMap.get(monthKey) || 0;
        const averageBurn = averageBurnRate;

        return {
          month: format(month, "MMM"),
          amount: currentBurn,
          average: averageBurn,
          currentBurn,
          averageBurn,
        };
      });

      // Update artifact with chart data
      if (showCanvas && analysis) {
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

      // Determine runway status
      const runwayStatus =
        runway >= 12
          ? "Above recommended 12+ months"
          : "Below recommended 12+ months";

      // Update artifact with metrics
      if (showCanvas && analysis) {
        await analysis.update({
          stage: "metrics_ready",
          currency: targetCurrency,
          chart: {
            monthlyData,
          },
          metrics: {
            currentMonthlyBurn,
            averageBurnRate,
            runway,
            runwayStatus,
            topCategory: {
              name: topCategory.name,
              percentage: topCategory.percentage,
              amount: topCategory.amount,
            },
          },
          analysis: {
            burnRateChange: {
              percentage: burnRateChangePercentage,
              period: burnRateChangePeriod,
              startValue: burnRateStartValue,
              endValue: burnRateEndValue,
            },
            summary: "Loading analysis...",
            recommendations: [],
          },
        });
      }

      // Generate AI summary and recommendations
      const analysisResult = await generateText({
        model: openai("gpt-4o-mini"),
        messages: [
          {
            role: "user",
            content: `Analyze this burn rate data for ${appContext.companyName || "the business"}:

Monthly Burn: ${formatAmount({
              amount: currentMonthlyBurn,
              currency: targetCurrency,
              locale,
            })}
Average Burn Rate: ${formatAmount({
              amount: averageBurnRate,
              currency: targetCurrency,
              locale,
            })}
Runway: ${runway} months
Change: ${burnRateChangePercentage}% over ${burnRateChangePeriod}
Top Category: ${topCategory.name} - ${topCategory.percentage.toFixed(1)}% of total

Provide a concise 2-3 sentence summary analyzing the burn rate patterns and 2-3 actionable recommendations for financial management.`,
          },
        ],
      });

      // Parse AI response
      const aiResponseText = analysisResult.text;
      const lines = aiResponseText
        .split("\n")
        .filter((line) => line.trim().length > 0);

      // Extract summary (first 2-3 sentences)
      const summaryText =
        lines
          .slice(0, 3)
          .join(" ")
          .replace(/^[-•*]\s*/, "")
          .trim() ||
        `Current monthly burn rate of ${formatAmount({
          amount: currentMonthlyBurn,
          currency: targetCurrency,
          locale,
        })} with ${runway}-month runway.`;

      // Extract recommendations (remaining lines starting with bullets or dashes)
      const recommendations = lines
        .slice(3)
        .map((line) => line.replace(/^[-•*]\s*/, "").trim())
        .filter((line) => line.length > 0)
        .slice(0, 3);

      // Update artifact with analysis
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
            currentMonthlyBurn,
            averageBurnRate,
            runway,
            runwayStatus,
            topCategory: {
              name: topCategory.name,
              percentage: topCategory.percentage,
              amount: topCategory.amount,
            },
          },
          analysis: {
            burnRateChange: {
              percentage: burnRateChangePercentage,
              period: burnRateChangePeriod,
              startValue: burnRateStartValue,
              endValue: burnRateEndValue,
            },
            summary: summaryText,
            recommendations: recommendations.length > 0 ? recommendations : [],
          },
        });
      }

      // Format text response
      const formattedCurrentBurn = formatAmount({
        amount: currentMonthlyBurn,
        currency: targetCurrency,
        locale,
      });

      const formattedAverageBurn = formatAmount({
        amount: averageBurnRate,
        currency: targetCurrency,
        locale,
      });

      let responseText = `**Current Monthly Burn Rate:** ${formattedCurrentBurn}\n\n`;
      responseText += `**Average Burn Rate:** ${formattedAverageBurn}\n\n`;
      responseText += `**Cash Runway:** ${runway} months (${runwayStatus})\n\n`;

      if (burnRateChangePercentage !== 0) {
        const changeDirection =
          burnRateChangePercentage > 0 ? "increased" : "decreased";
        responseText += `**Burn Rate Trend:** ${changeDirection} by ${Math.abs(burnRateChangePercentage)}% over ${burnRateChangePeriod}\n\n`;
      }

      if (topCategory.name !== "Uncategorized") {
        responseText += `**Top Spending Category:** ${topCategory.name} - ${formatAmount(
          {
            amount: topCategory.amount,
            currency: targetCurrency,
            locale,
          },
        )} (${topCategory.percentage.toFixed(1)}% of total)\n\n`;
      }

      responseText += `**Summary & Recommendations:**\n\n${summaryText}\n\n`;

      if (recommendations.length > 0) {
        responseText += "**Recommendations:**\n";
        for (const rec of recommendations) {
          responseText += `- ${rec}\n`;
        }
      }

      if (showCanvas) {
        responseText +=
          "\n\nA detailed visual burn rate analysis with charts and trends is available.";
      }

      yield { text: responseText };

      return {
        currentMonthlyBurn,
        averageBurnRate,
        runway,
        currency: targetCurrency,
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
      };
    }
  },
});
