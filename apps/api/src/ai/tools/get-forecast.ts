import { getWriter } from "@ai-sdk-tools/artifacts";
import { openai } from "@ai-sdk/openai";
import type { AppContext } from "@api/ai/agents/config/shared";
import { forecastArtifact } from "@api/ai/artifacts/forecast";
import { generateArtifactDescription } from "@api/ai/utils/artifact-title";
import { getToolDateDefaults } from "@api/ai/utils/tool-date-defaults";
import { checkBankAccountsRequired } from "@api/ai/utils/tool-helpers";
import { db } from "@midday/db/client";
import { getRevenueForecast } from "@midday/db/queries";
import { formatAmount, formatDate } from "@midday/utils/format";
import { generateText } from "ai";
import { tool } from "ai";
import { format } from "date-fns";
import { z } from "zod";

const getForecastSchema = z.object({
  from: z.string().optional().describe("Start date (ISO 8601)"),
  to: z.string().optional().describe("End date (ISO 8601)"),
  currency: z
    .string()
    .describe("Currency code (ISO 4217, e.g. 'USD')")
    .nullable()
    .optional(),
  revenueType: z.enum(["gross", "net"]).default("net").describe("Revenue type"),
  forecastMonths: z
    .number()
    .default(3)
    .describe("Number of months to forecast"),
  showCanvas: z.boolean().default(false).describe("Show visual analytics"),
});

export const getForecastTool = tool({
  description:
    "Generate revenue forecast and projections - shows historical revenue trends, forecasted future revenue, growth rates, peak months, unpaid invoices, and billable hours.",
  inputSchema: getForecastSchema,
  execute: async function* (
    { from, to, currency, revenueType, forecastMonths, showCanvas },
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
      // Use fiscal year-aware defaults if dates not provided
      const defaultDates = getToolDateDefaults(appContext.fiscalYearStartMonth);
      const finalFrom = from ?? defaultDates.from;
      const finalTo = to ?? defaultDates.to;

      // Generate description based on date range
      const description = generateArtifactDescription(finalFrom, finalTo);

      // Initialize artifact only if showCanvas is true
      let analysis: ReturnType<typeof forecastArtifact.stream> | undefined;
      if (showCanvas) {
        const writer = getWriter(executionOptions);
        analysis = forecastArtifact.stream(
          {
            stage: "loading",
            currency: currency || appContext.baseCurrency || "USD",
            from: finalFrom,
            to: finalTo,
            description,
          },
          writer,
        );
      }

      const targetCurrency = currency || appContext.baseCurrency || "USD";
      const locale = appContext.locale || "en-US";

      // Fetch forecast data
      const forecastResult = await getRevenueForecast(db, {
        teamId,
        from: finalFrom,
        to: finalTo,
        forecastMonths,
        currency: currency ?? undefined,
        revenueType: revenueType ?? "net",
      });

      // Prepare monthly data for chart
      // Structure: one item per month with both actual and forecasted fields
      const monthlyData: Array<{
        month: string;
        date: string;
        actual?: number;
        forecasted?: number;
      }> = [];

      // Check if data spans multiple years
      const allDates = [
        ...forecastResult.historical.map((item) => item.date),
        ...forecastResult.forecast.map((item) => item.date),
      ];
      const years = new Set(
        allDates.map((date) => new Date(date).getFullYear()),
      );
      const spansMultipleYears = years.size > 1;

      // Add historical months with actual values only
      for (const [index, item] of forecastResult.historical.entries()) {
        const date = new Date(item.date);
        const month = spansMultipleYears
          ? format(date, "MMM ''yy")
          : format(date, "MMM");
        const isLastHistorical = index === forecastResult.historical.length - 1;

        monthlyData.push({
          month,
          date: item.date,
          actual: item.value,
          // On the last historical month (forecast start), set forecasted to same value as actual
          forecasted: isLastHistorical ? item.value : undefined,
        });
      }

      // Add forecast months with forecasted values only
      for (const item of forecastResult.forecast) {
        const date = new Date(item.date);
        const month = spansMultipleYears
          ? format(date, "MMM ''yy")
          : format(date, "MMM");
        monthlyData.push({
          month,
          date: item.date,
          actual: undefined,
          forecasted: item.value,
        });
      }

      // Find forecast start date index (last historical month index)
      const forecastStartIndex = forecastResult.historical.length - 1;

      // Update artifact with chart data
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
            })),
            ...(forecastStartIndex !== undefined && { forecastStartIndex }),
          },
        });
      }

      // Prepare metrics
      const summary = forecastResult.summary;
      const metrics = {
        peakMonth: {
          month: format(new Date(summary.peakMonth.date), "MMM"),
          value: summary.peakMonth.value,
        },
        growthRate: summary.avgMonthlyGrowthRate,
        unpaidInvoices: summary.unpaidInvoices.totalAmount,
        billableHours: summary.billableHours.totalHours,
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
            })),
            ...(forecastStartIndex !== undefined && { forecastStartIndex }),
          },
          metrics: {
            peakMonth: metrics.peakMonth.month,
            peakMonthValue: metrics.peakMonth.value,
            growthRate: metrics.growthRate,
            unpaidInvoices: metrics.unpaidInvoices,
            billableHours: metrics.billableHours,
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
            })),
            ...(forecastStartIndex !== undefined && { forecastStartIndex }),
          },
          metrics: {
            peakMonth: metrics.peakMonth.month,
            peakMonthValue: metrics.peakMonth.value,
            growthRate: metrics.growthRate,
            unpaidInvoices: metrics.unpaidInvoices,
            billableHours: metrics.billableHours,
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
