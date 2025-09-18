import { openai } from "@ai-sdk/openai";
import { getBurnRate, getRunway, getSpending } from "@db/queries";
import { generateText, tool } from "ai";
import {
  eachMonthOfInterval,
  endOfMonth,
  format,
  startOfMonth,
} from "date-fns";
import { burnRateArtifact } from "../artifacts/burn-rate";
import { getContext } from "../context";
import { getBurnRateSchema } from "./schema";

// Utility function for delays
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const getBurnRateTool = tool({
  description: `Get burn rate analysis with runway projections and optimization recommendations. 
Shows current burn rate, monthly trends, cash runway, future projections, and actionable insights for financial planning.`,
  inputSchema: getBurnRateSchema,
  execute: async ({ from, to, currency, showCanvas }) => {
    try {
      const context = getContext();

      const analysis = burnRateArtifact.stream({
        stage: "loading",
        currency: currency ?? context.user.baseCurrency ?? "USD",
        toast: {
          visible: true,
          currentStep: 0,
          totalSteps: 6,
          currentLabel: "Loading burn rate data",
        },
      });

      // Add initial delay to show loading step
      await delay(100);

      // Run all database queries in parallel for maximum performance
      const [burnRateData, runway, spendingData] = await Promise.all([
        getBurnRate(context.db, {
          teamId: context.user.teamId,
          from,
          to,
          currency: currency ?? undefined,
        }),
        getRunway(context.db, {
          teamId: context.user.teamId,
          from,
          to,
          currency: currency ?? undefined,
        }),
        getSpending(context.db, {
          teamId: context.user.teamId,
          from,
          to,
          currency: currency ?? undefined,
        }),
      ]);

      // Early return if no data
      if (burnRateData.length === 0) {
        await analysis.update({
          stage: "analysis_ready",
          chart: { monthlyData: [] },
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
        return {
          burnRate: [],
          runway: 0,
          currentMonthlyBurn: 0,
          averageBurnRate: 0,
          summary: "No data available",
          recommendations: [],
        };
      }

      // Calculate basic metrics from burn rate data
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

      // Generate monthly chart data
      const fromDate = startOfMonth(new Date(from));
      const toDate = endOfMonth(new Date(to));
      const monthSeries = eachMonthOfInterval({ start: fromDate, end: toDate });

      const monthlyData = monthSeries.map((month, index) => {
        const currentBurn = burnRateData[index]?.value || 0;
        const averageBurn = averageBurnRate;

        return {
          month: format(month, "MMM"),
          currentBurn,
          averageBurn,
        };
      });

      // Add delay to show loading
      await delay(500);

      // Update with chart data first
      await analysis.update({
        stage: "chart_ready",
        chart: {
          monthlyData,
        },
        toast: {
          visible: true,
          currentStep: 1,
          totalSteps: 4,
          currentLabel: "Preparing chart data",
        },
      });

      // Add delay to show chart step
      await delay(300);

      // Get the highest spending category (first item is highest)
      const highestCategory =
        spendingData.length > 0
          ? spendingData[0]
          : {
              name: "Uncategorized",
              slug: "uncategorized",
              amount: 0,
              percentage: 0,
            };

      const highestCategoryPercentage = highestCategory?.percentage || 0;

      // Calculate burn rate change for metrics
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

      // Update with metrics data including burn rate change
      await analysis.update({
        stage: "metrics_ready",
        chart: {
          monthlyData,
        },
        metrics: {
          currentMonthlyBurn,
          averageBurnRate,
          runway,
          runwayStatus:
            runway >= 12
              ? "Above recommended 12+ months"
              : "Below recommended 12+ months",
          topCategory: {
            name: highestCategory?.name || "Uncategorized",
            percentage: highestCategoryPercentage,
            amount: highestCategory?.amount || 0,
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
        toast: {
          visible: true,
          currentStep: 2,
          totalSteps: 4,
          currentLabel: "Metrics ready",
        },
      });

      // Add delay to show metrics step
      await delay(400);

      // Get the target currency for display
      const targetCurrency = currency ?? context.user.baseCurrency ?? "USD";

      // Show AI processing step
      await analysis.update({
        toast: {
          visible: true,
          currentStep: 3,
          totalSteps: 4,
          currentLabel: "Generating insights",
        },
      });

      // Add short delay to show AI processing step
      await delay(300);

      // Generate AI summary with a simpler, faster prompt
      const analysisResult = await generateText({
        model: openai("gpt-4o-mini"),
        messages: [
          {
            role: "user",
            content: `Analyze this burn rate data:

Monthly Burn: ${currentMonthlyBurn.toLocaleString()} ${targetCurrency}
Runway: ${runway} months
Change: ${burnRateChangePercentage}% over ${burnRateChangePeriod}
Top Category: ${highestCategory?.name || "Uncategorized"} (${highestCategoryPercentage}%)

Provide a concise 2-sentence summary and 2-3 brief recommendations.`,
          },
        ],
      });

      // Simple parsing - just split by line breaks and take first few lines
      const responseText = analysisResult.text;
      const lines = responseText
        .split("\n")
        .filter((line) => line.trim().length > 0);

      const summaryText =
        lines[0] ||
        `Current monthly burn: ${currentMonthlyBurn.toLocaleString()} ${targetCurrency} with ${runway}-month runway.`;
      const recommendations = lines
        .slice(1, 4)
        .map((line) => line.replace(/^[-•*]\s*/, "").trim())
        .filter((line) => line.length > 0);

      const finalData = {
        chart: { monthlyData },
        metrics: {
          currentMonthlyBurn,
          averageBurnRate,
          runway,
          runwayStatus:
            runway >= 12
              ? "Above recommended 12+ months"
              : "Below recommended 12+ months",
          topCategory: {
            name: highestCategory?.name || "Uncategorized",
            percentage: highestCategoryPercentage,
            amount: highestCategory?.amount || 0,
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
          recommendations,
        },
      };

      // Add delay before final completion
      await delay(300);

      // Update to analysis_ready stage to show summary with completion
      await analysis.update({
        stage: "analysis_ready",
        chart: finalData.chart,
        metrics: finalData.metrics,
        analysis: {
          burnRateChange: {
            percentage: burnRateChangePercentage,
            period: burnRateChangePeriod,
            startValue: burnRateStartValue,
            endValue: burnRateEndValue,
          },
          summary: summaryText,
          recommendations,
        },
        toast: {
          visible: true,
          currentStep: 4,
          totalSteps: 4,
          currentLabel: "Analysis complete",
          completed: true,
          completedMessage: "Burn rate analysis complete",
        },
      });

      return {
        burnRate: burnRateData,
        runway,
        currentMonthlyBurn,
        averageBurnRate,
        highestCategoryPercentage,
        highestCategoryAmount: highestCategory?.amount || 0,
        highestCategoryName: highestCategory?.name || "Uncategorized",
        summary: summaryText,
        recommendations: recommendations,
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
});
