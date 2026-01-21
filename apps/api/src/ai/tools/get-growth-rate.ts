import { getWriter } from "@ai-sdk-tools/artifacts";
import type { AppContext } from "@api/ai/agents/config/shared";
import { growthRateArtifact } from "@api/ai/artifacts/growth-rate";
import { generateArtifactDescription } from "@api/ai/utils/artifact-title";
import { resolveToolParams } from "@api/ai/utils/period-dates";
import { checkBankAccountsRequired } from "@api/ai/utils/tool-helpers";
import { db } from "@midday/db/client";
import { getGrowthRate } from "@midday/db/queries";
import { formatAmount } from "@midday/utils/format";
import { tool } from "ai";
import { z } from "zod";

const getGrowthRateSchema = z.object({
  dateRange: z
    .enum(["3-months", "6-months", "this-year", "1-year", "2-years", "5-years"])
    .optional()
    .describe("Historical period"),
  from: z.string().optional().describe("Start date (yyyy-MM-dd)"),
  to: z.string().optional().describe("End date (yyyy-MM-dd)"),
  currency: z.string().nullable().optional().describe("Currency code"),
  type: z
    .enum(["revenue", "profit"])
    .default("revenue")
    .describe("Growth type: revenue or profit"),
  revenueType: z.enum(["gross", "net"]).optional().describe("Revenue type"),
  period: z
    .enum(["monthly", "quarterly", "yearly"])
    .default("quarterly")
    .describe("Comparison period: monthly, quarterly (default), or yearly"),
  showCanvas: z.boolean().default(false).describe("Show visual canvas"),
});

export const getGrowthRateTool = tool({
  description:
    "Calculate growth rate - shows period-over-period comparisons and trends.",
  inputSchema: getGrowthRateSchema,
  execute: async function* (
    { dateRange, from, to, currency, type, revenueType, period, showCanvas },
    executionOptions,
  ) {
    const appContext = executionOptions.experimental_context as AppContext;
    const teamId = appContext.teamId as string;

    if (!teamId) {
      yield {
        text: "Unable to retrieve growth rate: Team ID not found in context.",
      };
      return {
        growthRate: 0,
        currentTotal: 0,
        prevTotal: 0,
        currency: currency || appContext.baseCurrency || "USD",
        period,
        trend: "neutral",
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
        toolName: "getGrowthRate",
        appContext,
        aiParams: {
          dateRange,
          from,
          to,
          currency,
          revenueType,
          // Pass through other params
          type,
          period,
          showCanvas,
        },
      });

      const finalFrom = resolved.from;
      const finalTo = resolved.to;
      const finalCurrency = resolved.currency;
      const finalRevenueType = resolved.revenueType ?? "net";

      // Generate description based on date range
      const description = generateArtifactDescription(finalFrom, finalTo);

      // Initialize artifact only if showCanvas is true
      let analysis: ReturnType<typeof growthRateArtifact.stream> | undefined;
      if (showCanvas) {
        const writer = getWriter(executionOptions);
        analysis = growthRateArtifact.stream(
          {
            stage: "loading",
            currency: finalCurrency || "USD",
            from: finalFrom,
            to: finalTo,
            description,
            type,
            revenueType: finalRevenueType,
            period,
          },
          writer,
        );
      }

      const result = await getGrowthRate(db, {
        teamId,
        from: finalFrom,
        to: finalTo,
        currency: finalCurrency ?? undefined,
        type,
        revenueType: finalRevenueType,
        period,
      });

      const growthRate = result.summary.periodGrowthRate;
      const currentTotal = result.summary.currentTotal;
      const prevTotal = result.summary.previousTotal;
      const targetCurrency =
        result.summary.currency || appContext.baseCurrency || "USD";
      const locale = appContext.locale || "en-US";
      const trend = result.summary.trend;

      // Format totals
      const formattedCurrentTotal = formatAmount({
        amount: Math.abs(currentTotal),
        currency: targetCurrency,
        locale,
      });

      const formattedPrevTotal = formatAmount({
        amount: Math.abs(prevTotal),
        currency: targetCurrency,
        locale,
      });

      // Build response text
      const typeLabel = type === "profit" ? "Profit" : "Revenue";
      const revenueTypeLabel = finalRevenueType === "gross" ? "Gross" : "Net";
      const periodLabelLower =
        period === "monthly"
          ? "month"
          : period === "quarterly"
            ? "quarter"
            : "year";
      const periodLabelUpper =
        period === "monthly"
          ? "Month"
          : period === "quarterly"
            ? "Quarter"
            : "Year";

      let responseText = `**${revenueTypeLabel} ${typeLabel} Growth Rate:** ${growthRate > 0 ? "+" : ""}${growthRate.toFixed(1)}%\n\n`;

      responseText += "**Period-over-Period Comparison:**\n";
      responseText += `- Current ${periodLabelLower}: ${formattedCurrentTotal}\n`;
      responseText += `- Previous ${periodLabelLower}: ${formattedPrevTotal}\n`;
      responseText += `- Growth Rate: ${growthRate > 0 ? "+" : ""}${growthRate.toFixed(1)}%\n\n`;

      // Add trend interpretation
      if (trend === "positive") {
        responseText += `Your ${typeLabel.toLowerCase()} has grown ${Math.abs(growthRate).toFixed(1)}% compared to the previous ${periodLabelLower}, indicating positive business growth. `;
        if (growthRate > 10) {
          responseText +=
            "This is a strong growth rate, suggesting excellent business performance.";
        } else if (growthRate > 5) {
          responseText +=
            "This is a healthy growth rate, indicating steady business expansion.";
        } else {
          responseText +=
            "This moderate growth rate shows consistent business progress.";
        }
      } else if (trend === "negative") {
        responseText += `Your ${typeLabel.toLowerCase()} has decreased ${Math.abs(growthRate).toFixed(1)}% compared to the previous ${periodLabelLower}. `;
        responseText +=
          "Consider reviewing your business strategies, market conditions, or operational efficiency to address this decline.";
      } else {
        responseText += `Your ${typeLabel.toLowerCase()} has remained relatively stable compared to the previous ${periodLabelLower}. `;
        responseText +=
          "While stability is positive, consider strategies to accelerate growth.";
      }

      // Prepare chart data for artifact
      // For growth rate, we'll show multiple periods if available
      // For now, we'll create a simple comparison chart

      const chartData = [
        {
          period: `Current ${periodLabelUpper}`,
          currentTotal,
          previousTotal: prevTotal,
          growthRate,
        },
        {
          period: `Previous ${periodLabelUpper}`,
          currentTotal: prevTotal,
          previousTotal: prevTotal,
          growthRate: 0,
        },
      ];

      // Update artifact with chart data if showCanvas is true
      if (showCanvas && analysis) {
        await analysis.update({
          stage: "chart_ready",
          currency: targetCurrency,
          from: finalFrom,
          to: finalTo,
          description,
          type,
          revenueType: finalRevenueType,
          period,
          chart: {
            periodData: chartData,
          },
        });
      }

      // Update artifact with metrics if showCanvas is true
      if (showCanvas && analysis) {
        await analysis.update({
          stage: "metrics_ready",
          currency: targetCurrency,
          type,
          revenueType: finalRevenueType,
          period,
          chart: {
            periodData: chartData,
          },
          metrics: {
            currentGrowthRate: growthRate,
            currentTotal,
            previousTotal: prevTotal,
            changeAmount: currentTotal - prevTotal,
            trend: trend as "positive" | "negative" | "neutral",
          },
        });
      }

      // Generate summary for artifact
      let summaryText = "";
      if (trend === "positive") {
        summaryText = `Your ${typeLabel.toLowerCase()} has grown ${Math.abs(growthRate).toFixed(1)}% compared to the previous ${periodLabelLower} (${formattedPrevTotal} to ${formattedCurrentTotal}). `;
        if (growthRate > 10) {
          summaryText +=
            "This is a strong growth rate, suggesting excellent business performance.";
        } else if (growthRate > 5) {
          summaryText +=
            "This is a healthy growth rate, indicating steady business expansion.";
        } else {
          summaryText +=
            "This moderate growth rate shows consistent business progress.";
        }
      } else if (trend === "negative") {
        summaryText = `Your ${typeLabel.toLowerCase()} has decreased ${Math.abs(growthRate).toFixed(1)}% compared to the previous ${periodLabelLower}. `;
        summaryText +=
          "Consider reviewing your business strategies, market conditions, or operational efficiency to address this decline.";
      } else {
        summaryText = `Your ${typeLabel.toLowerCase()} has remained relatively stable compared to the previous ${periodLabelLower}. `;
        summaryText +=
          "While stability is positive, consider strategies to accelerate growth.";
      }

      // Update artifact with analysis if showCanvas is true
      if (showCanvas && analysis) {
        await analysis.update({
          stage: "analysis_ready",
          currency: targetCurrency,
          from: finalFrom,
          to: finalTo,
          description,
          type,
          revenueType: finalRevenueType,
          period,
          chart: {
            periodData: chartData,
          },
          metrics: {
            currentGrowthRate: growthRate,
            currentTotal,
            previousTotal: prevTotal,
            changeAmount: currentTotal - prevTotal,
            trend: trend as "positive" | "negative" | "neutral",
          },
          analysis: {
            summary: summaryText,
            recommendations: [
              trend === "negative"
                ? "Review business strategies and market conditions to address declining growth"
                : trend === "positive" && growthRate < 5
                  ? "Consider strategies to accelerate growth further"
                  : "Continue focusing on growth initiatives",
              currentTotal === 0
                ? "Ensure transactions are properly categorized"
                : "Monitor growth trends regularly",
            ],
          },
        });
      }

      // Mention canvas if requested
      if (showCanvas) {
        responseText +=
          "\n\nA detailed visual growth rate analysis with charts and trends is available.";
      }

      yield { text: responseText };

      return {
        growthRate,
        periodGrowthRate: result.summary.periodGrowthRate,
        currentTotal,
        prevTotal,
        currency: targetCurrency,
        period,
        type,
        revenueType: finalRevenueType,
        trend,
        changeAmount: currentTotal - prevTotal,
      };
    } catch (error) {
      yield {
        text: `Failed to retrieve growth rate: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
      return {
        growthRate: 0,
        currentTotal: 0,
        prevTotal: 0,
        currency: currency || appContext.baseCurrency || "USD",
        period,
        trend: "neutral",
      };
    }
  },
});
