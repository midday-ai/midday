import { openai } from "@ai-sdk/openai";
import { getWriter } from "@ai-sdk-tools/artifacts";
import type { AppContext } from "@api/ai/agents/config/shared";
import { forecastArtifact } from "@api/ai/artifacts/forecast";
import { generateArtifactDescription } from "@api/ai/utils/artifact-title";
import { resolveToolParams } from "@api/ai/utils/period-dates";
import { checkBankAccountsRequired } from "@api/ai/utils/tool-helpers";
import { db } from "@midday/db/client";
import { getRevenueForecast } from "@midday/db/queries";
import { formatAmount } from "@midday/utils/format";
import { generateText, tool } from "ai";
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
  showCanvas: z.boolean().default(false).describe("Show visual canvas"),
});

export const getForecastTool = tool({
  description:
    "Generate revenue forecast - shows projections, growth rates, and billable hours.",
  inputSchema: getForecastSchema,
  execute: async function* (
    { period, from, to, currency, revenueType, forecastMonths, showCanvas },
    executionOptions,
  ) {
    const appContext = executionOptions.experimental_context as AppContext;
    const teamId = appContext.teamId as string;

    if (!teamId) {
      yield {
        text: "Unable to retrieve forecast: Team ID not found in context.",
      };
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
      // Resolve parameters with proper priority:
      // 1. Forced params from widget click (if this tool was triggered by widget)
      // 2. Explicit AI params (user override)
      // 3. Dashboard metricsFilter (source of truth)
      // 4. Hardcoded defaults
      const resolved = resolveToolParams({
        toolName: "getForecast",
        appContext,
        aiParams: { period, from, to, currency, revenueType },
      });

      const finalFrom = resolved.from;
      const finalTo = resolved.to;
      const finalCurrency = resolved.currency;
      const finalRevenueType = resolved.revenueType ?? "net";

      // Generate description based on date range
      const description = generateArtifactDescription(finalFrom, finalTo);

      // Initialize artifact only if showCanvas is true
      let analysis: ReturnType<typeof forecastArtifact.stream> | undefined;
      if (showCanvas) {
        const writer = getWriter(executionOptions);
        analysis = forecastArtifact.stream(
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

      // Fetch forecast data
      const forecastResult = await getRevenueForecast(db, {
        teamId,
        from: finalFrom,
        to: finalTo,
        forecastMonths,
        currency: finalCurrency ?? undefined,
        revenueType: finalRevenueType,
      });

      // Prepare monthly data for chart
      // Structure: one item per month with both actual and forecasted fields
      // Match the dashboard widget's data structure exactly
      const monthlyData: Array<{
        month: string;
        date: string;
        actual: number | null;
        forecasted: number | null;
        optimistic: number | null;
        pessimistic: number | null;
        confidence: number | null;
        breakdown: {
          recurringInvoices: number;
          recurringTransactions: number;
          scheduled: number;
          collections: number;
          billableHours: number;
          newBusiness: number;
        } | null;
      }> = [];

      // Check if data spans multiple years
      const allDates = [
        ...forecastResult.historical.map((item) => item.date),
        ...forecastResult.forecast.map((item) => item.date),
      ];
      const years = new Set(
        allDates.map((date) => parseISO(date).getFullYear()),
      );
      const spansMultipleYears = years.size > 1;

      // Add historical months with actual values only
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
          // On the last historical month (forecast start), set forecasted to same value as actual
          forecasted: isLastHistorical ? item.value : null,
          // Historical points don't have confidence data
          optimistic: null,
          pessimistic: null,
          confidence: null,
          breakdown: null,
        });
      }

      // Add forecast months with forecasted values only
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
          // Include enhanced forecast fields for bottom-up forecast (matching dashboard)
          optimistic: "optimistic" in item ? (item.optimistic as number) : null,
          pessimistic:
            "pessimistic" in item ? (item.pessimistic as number) : null,
          confidence: "confidence" in item ? (item.confidence as number) : null,
          breakdown:
            "breakdown" in item
              ? (item.breakdown as (typeof monthlyData)[0]["breakdown"])
              : null,
        });
      }

      // Find forecast start date index (last historical month index)
      const forecastStartIndex = forecastResult.historical.length - 1;

      // Update artifact with chart data (including enhanced fields to match dashboard)
      if (showCanvas && analysis) {
        await analysis.update({
          stage: "chart_ready",
          currency: targetCurrency,
          from: finalFrom,
          to: finalTo,
          description,
          chart: {
            monthlyData: monthlyData.map((item) => ({
              month: item.month,
              forecasted: item.forecasted,
              actual: item.actual,
              date: item.date,
              optimistic: item.optimistic,
              pessimistic: item.pessimistic,
              confidence: item.confidence,
              breakdown: item.breakdown,
            })),
            ...(forecastStartIndex !== undefined && { forecastStartIndex }),
          },
        });
      }

      // Prepare metrics
      const summary = forecastResult.summary;
      // Get confidence score from meta (matching dashboard widget)
      const confidenceScore =
        forecastResult.meta && "confidenceScore" in forecastResult.meta
          ? (forecastResult.meta.confidenceScore as number)
          : null;

      const metrics = {
        peakMonth: {
          month: format(parseISO(summary.peakMonth.date), "MMM"),
          value: summary.peakMonth.value,
        },
        growthRate: summary.avgMonthlyGrowthRate,
        unpaidInvoices: summary.unpaidInvoices.totalAmount,
        billableHours: summary.billableHours.totalHours,
        confidenceScore,
      };

      // Update artifact with metrics
      if (showCanvas && analysis) {
        await analysis.update({
          stage: "metrics_ready",
          currency: targetCurrency,
          chart: {
            monthlyData: monthlyData.map((item) => ({
              month: item.month,
              forecasted: item.forecasted,
              actual: item.actual,
              date: item.date,
              optimistic: item.optimistic,
              pessimistic: item.pessimistic,
              confidence: item.confidence,
              breakdown: item.breakdown,
            })),
            ...(forecastStartIndex !== undefined && { forecastStartIndex }),
          },
          metrics: {
            peakMonth: metrics.peakMonth.month,
            peakMonthValue: metrics.peakMonth.value,
            growthRate: metrics.growthRate,
            unpaidInvoices: metrics.unpaidInvoices,
            billableHours: metrics.billableHours,
            confidenceScore: metrics.confidenceScore,
          },
        });
      }

      // Generate AI summary
      const analysisResult = await generateText({
        model: openai("gpt-4o-mini"),
        messages: [
          {
            role: "user",
            content: `Analyze this revenue forecast for ${appContext.companyName || "the business"}:

Historical Revenue: ${formatAmount({
              amount: forecastResult.historical.reduce(
                (sum, item) => sum + item.value,
                0,
              ),
              currency: targetCurrency,
              locale,
            })}
Next Month Projection: ${formatAmount({
              amount: summary.nextMonthProjection,
              currency: targetCurrency,
              locale,
            })}
Average Monthly Growth Rate: ${summary.avgMonthlyGrowthRate}%
Peak Month: ${metrics.peakMonth.month} - ${formatAmount({
              amount: metrics.peakMonth.value,
              currency: targetCurrency,
              locale,
            })}
Unpaid Invoices: ${formatAmount({
              amount: metrics.unpaidInvoices,
              currency: targetCurrency,
              locale,
            })}
Billable Hours This Month: ${metrics.billableHours}h

Provide a concise analysis (2-3 sentences) highlighting key insights about the revenue forecast, growth trends, and actionable recommendations. Write it as natural, flowing text.`,
          },
        ],
      });

      const summaryText =
        analysisResult.text.trim() ||
        `Revenue forecast shows ${formatAmount({
          amount: summary.nextMonthProjection,
          currency: targetCurrency,
          locale,
        })} projected for next month with ${summary.avgMonthlyGrowthRate}% average monthly growth.`;

      // Update artifact with analysis
      if (showCanvas && analysis) {
        await analysis.update({
          stage: "analysis_ready",
          currency: targetCurrency,
          chart: {
            monthlyData: monthlyData.map((item) => ({
              month: item.month,
              forecasted: item.forecasted,
              actual: item.actual,
              date: item.date,
              optimistic: item.optimistic,
              pessimistic: item.pessimistic,
              confidence: item.confidence,
              breakdown: item.breakdown,
            })),
            ...(forecastStartIndex !== undefined && { forecastStartIndex }),
          },
          metrics: {
            peakMonth: metrics.peakMonth.month,
            peakMonthValue: metrics.peakMonth.value,
            growthRate: metrics.growthRate,
            unpaidInvoices: metrics.unpaidInvoices,
            billableHours: metrics.billableHours,
            confidenceScore: metrics.confidenceScore,
          },
          analysis: {
            summary: summaryText,
            recommendations: [],
          },
        });
      }

      // Format text response
      let responseText = "**Revenue Forecast:**\n\n";
      responseText += `**Next Month Projection:** ${formatAmount({
        amount: summary.nextMonthProjection,
        currency: targetCurrency,
        locale,
      })}\n\n`;
      responseText += `**Average Monthly Growth Rate:** ${summary.avgMonthlyGrowthRate}%\n\n`;
      responseText += `**Peak Month:** ${metrics.peakMonth.month} - ${formatAmount(
        {
          amount: metrics.peakMonth.value,
          currency: targetCurrency,
          locale,
        },
      )}\n\n`;

      if (!showCanvas) {
        responseText += `**Summary:**\n\n${summaryText}\n\n`;
      } else {
        responseText +=
          "\n\nA detailed visual forecast analysis with charts, metrics, and insights is available.";
      }

      yield { text: responseText };

      return {
        nextMonthProjection: summary.nextMonthProjection,
        avgMonthlyGrowthRate: summary.avgMonthlyGrowthRate,
        currency: targetCurrency,
        monthlyData,
        peakMonth: metrics.peakMonth,
        unpaidInvoices: metrics.unpaidInvoices,
        billableHours: metrics.billableHours,
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
