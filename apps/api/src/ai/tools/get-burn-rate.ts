import { openai } from "@ai-sdk/openai";
import { getBurnRate, getRunway, getSpending } from "@db/queries";
import { formatAmount } from "@midday/utils/format";
import { generateText, smoothStream, streamText, tool } from "ai";
import {
  eachMonthOfInterval,
  endOfMonth,
  format,
  startOfMonth,
} from "date-fns";
import { burnRateArtifact } from "../artifacts/burn-rate";
import { getContext } from "../context";
import { delay } from "../utils/delay";
import { getBurnRateSchema } from "./schema";

export const getBurnRateTool = tool({
  description: `Get burn rate analysis with runway projections and optimization recommendations. 
Shows current burn rate, monthly trends, cash runway, future projections, and actionable insights for financial planning.`,
  inputSchema: getBurnRateSchema,
  execute: async function* ({ from, to, currency, showCanvas }) {
    try {
      const context = getContext();

      const analysis = burnRateArtifact.stream({
        stage: "loading",
        currency: currency ?? context.user.baseCurrency ?? "USD",
        toast: {
          visible: true,
          currentStep: 0,
          totalSteps: 4,
          currentLabel: "Loading burn rate data",
          stepDescription: "Fetching financial data from your accounts",
        },
      });

      // Generate a contextual initial message based on the analysis request
      const initialMessageStream = streamText({
        model: openai("gpt-4o-mini"),
        system: `You are a financial assistant generating a brief initial message for a burn rate analysis. 

The user has requested a burn rate analysis for the period ${from} to ${to}. Create a message that:
- Acknowledges the specific time period being analyzed
- Explains what you're currently doing (gathering financial data)
- Mentions the specific insights they'll receive (monthly burn rate, cash runway, expense breakdown)
- Uses a professional but conversational tone
- Avoids generic phrases like "Got it! Let's dive into..." or "Thanks for reaching out"
- Keep it concise (1-2 sentences max)

Example format: "I'm analyzing your burn rate data for [period] to show your monthly spending patterns, cash runway, and expense breakdown."`,
        messages: [
          {
            role: "user",
            content: `Generate a brief initial message for a burn rate analysis request for the period ${from} to ${to}.`,
          },
        ],
        experimental_transform: smoothStream({
          chunking: "word",
        }),
      });

      let completeMessage = "";
      for await (const chunk of initialMessageStream.textStream) {
        completeMessage += chunk;
        // Yield the accumulated text so far for streaming effect
        yield completeMessage;
      }

      // Add line breaks to prepare for the detailed analysis
      completeMessage += "\n";

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
          currentMonthlyBurn: 0,
          runway: 0,
          topCategory: "No data",
          topCategoryPercentage: 0,
          burnRateChange: 0,
          summary: "No data available",
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
          amount: currentBurn,
          average: averageBurn,
          currentBurn,
          averageBurn,
        };
      });

      // Add delay to show loading
      await delay(300);

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
          stepDescription:
            "Processing transaction data and calculating metrics",
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
          stepDescription: "Generating visual charts and analytics",
        },
      });

      // Add delay to show metrics step
      await delay(300);

      // Get the target currency for display
      const targetCurrency = currency ?? context.user.baseCurrency ?? "USD";

      // Show AI processing step
      await analysis.update({
        toast: {
          visible: true,
          currentStep: 3,
          totalSteps: 4,
          currentLabel: "Generating insights",
          stepDescription: "Running AI analysis and generating insights",
        },
      });

      // Generate AI summary with a simpler, faster prompt
      const analysisResult = await generateText({
        model: openai("gpt-4o-mini"),
        messages: [
          {
            role: "user",
            content: `Analyze this burn rate data:

Monthly Burn: ${formatAmount({ amount: currentMonthlyBurn, currency: targetCurrency, locale: context.user.locale ?? undefined })}
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
        `Current monthly burn: ${formatAmount({ amount: currentMonthlyBurn, currency: targetCurrency, locale: context.user.locale ?? undefined })} with ${runway}-month runway.`;
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
      };

      // Final update with all data and completion
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
          visible: false,
          currentStep: 4,
          totalSteps: 4,
          currentLabel: "Analysis complete",
          stepDescription: "Burn rate analysis complete",
          completed: true,
          completedMessage: "Burn rate analysis complete",
        },
      });

      // Prepare data for streaming response
      const burnRateAnalysisData = {
        currentMonthlyBurn: formatAmount({
          amount: currentMonthlyBurn,
          currency: targetCurrency,
          locale: context.user.locale ?? undefined,
        }),
        runway: runway,
        topCategory: highestCategory?.name || "Uncategorized",
        topCategoryPercentage: highestCategoryPercentage,
        burnRateChange: burnRateChangePercentage,
        burnRateChangePeriod: burnRateChangePeriod,
        runwayStatus:
          runway >= 12 ? "healthy" : runway >= 6 ? "concerning" : "critical",
      };

      // Stream the detailed analysis to extend the initial message
      const responseStream = streamText({
        model: openai("gpt-4o-mini"),
        system: `You are a financial assistant providing a burn rate analysis. Generate ONLY the detailed analysis section using the exact data provided.

CRITICAL INSTRUCTIONS:
- Generate ONLY the analysis content below, do NOT repeat any initial message
- Use ONLY the data provided in the burnRateData object
- Format the response EXACTLY as shown below
- Do NOT add greetings, introductions, or repeat the initial message
- Do NOT generate your own calculations or estimates

REQUIRED FORMAT:
## Monthly Burn Rate

Your current monthly burn rate is {currentMonthlyBurn} per month, representing your average monthly spending.

## Cash Runway

Your cash runway is approximately {runway} months, meaning you can sustain operations for the next {runway} months before needing additional funding. This is {runwayStatus} for your business planning.

## Expense Breakdown

Your largest expense category is {topCategory}, accounting for {topCategoryPercentage}% of your total monthly burn rate.

## Trends and Insights

Your burn rate has {burnRateChange > 0 ? "increased" : burnRateChange < 0 ? "decreased" : "remained stable"} by {Math.abs(burnRateChange)}% over the past {burnRateChangePeriod}.

The chart on the right shows your monthly burn rate trends with current vs average spending patterns, while the metrics provide additional context about your financial runway and expense breakdown.`,
        messages: [
          {
            role: "user",
            content: `Generate a burn rate analysis using this exact data: ${JSON.stringify(burnRateAnalysisData)}`,
          },
        ],
        experimental_transform: smoothStream({
          chunking: "word",
        }),
      });

      // Yield the streamed response
      let analysisText = "";
      for await (const chunk of responseStream.textStream) {
        analysisText += chunk;
        // Yield the initial message plus the new analysis text
        yield completeMessage + analysisText;
      }

      // Update completeMessage with the final analysis
      completeMessage += analysisText;

      // Yield the final response with forceStop flag
      yield {
        content: completeMessage,
        forceStop: true,
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
});
