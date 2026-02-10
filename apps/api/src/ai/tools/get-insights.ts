import type { AppContext } from "@api/ai/agents/config/shared";
import { db } from "@midday/db/client";
import {
  getInsightByPeriod,
  getLatestInsight,
  hasEarlierInsight,
  type Insight,
} from "@midday/db/queries";
import { getPeriodLabel } from "@midday/insights";
import { formatAmount } from "@midday/utils/format";
import { tool } from "ai";
import { getISOWeek, getMonth, getQuarter, getYear } from "date-fns";
import { z } from "zod";

const getInsightsSchema = z.object({
  periodType: z
    .enum(["weekly", "monthly", "quarterly", "yearly"])
    .default("weekly")
    .describe("Type of insight period"),
  periodNumber: z
    .number()
    .optional()
    .describe("Period number (week 1-53, month 1-12, quarter 1-4)"),
  year: z.number().optional().describe("Year for the insight period"),
});

export const getInsightsTool = tool({
  description:
    "Get AI-generated business insights summary for a period (weekly, monthly, quarterly, or yearly). Shows key metrics with comparisons, achievements, and personalized recommendations.",
  inputSchema: getInsightsSchema,
  execute: async function* (
    { periodType, periodNumber, year },
    executionOptions,
  ) {
    const appContext = executionOptions.experimental_context as AppContext;
    const teamId = appContext.teamId as string;

    if (!teamId) {
      yield {
        text: "Unable to retrieve insights: Team ID not found.",
      };
      return { success: false };
    }

    try {
      let insight: Insight | null = null;

      // If specific period requested, fetch it
      // Use explicit undefined checks to distinguish "not provided" from "provided as zero"
      if (periodNumber !== undefined && year !== undefined) {
        insight = await getInsightByPeriod(db, {
          teamId,
          periodType,
          periodYear: year,
          periodNumber,
        });
      } else {
        // Get the most recent insight of the requested type
        insight = await getLatestInsight(db, {
          teamId,
          periodType,
        });
      }

      if (!insight || insight.status !== "completed") {
        yield {
          text: `No ${periodType} insights available yet. Insights are generated automatically and will appear here once ready.`,
        };
        return { success: false, reason: "not_found" };
      }

      const locale = appContext.locale || "en-US";
      const currency = insight.currency || appContext.baseCurrency || "USD";

      // Build conversational "What Matters Now" response using AI-generated content
      let responseText = "";

      // Period label as context
      const periodLabel = getPeriodLabel(
        insight.periodType,
        insight.periodYear,
        insight.periodNumber,
      );

      // Lead with the AI-generated title (the main insight)
      if (insight.title) {
        responseText += `**${periodLabel}**\n\n`;
        responseText += `${insight.title}\n\n`;
      } else {
        responseText += `## ${periodLabel}\n\n`;
      }

      // The story - this is the heart of the insight
      if (insight.content?.story) {
        responseText += `${insight.content.story}\n\n`;
      }

      // Action items (specific and actionable)
      if (insight.content?.actions && insight.content.actions.length > 0) {
        responseText += "**What to do:**\n";
        for (const action of insight.content.actions) {
          responseText += `- ${action.text}\n`;
        }
        responseText += "\n";
      }

      // Overdue invoices (if any)
      if (
        insight.activity?.invoicesOverdue &&
        insight.activity.invoicesOverdue > 0
      ) {
        responseText += "**Needs attention:**\n";
        responseText += `- ${insight.activity.invoicesOverdue} overdue invoice${insight.activity.invoicesOverdue > 1 ? "s" : ""}`;
        if (insight.activity.overdueAmount) {
          responseText += ` (${formatMetricValue(insight.activity.overdueAmount, "currency", currency, locale)})`;
        }
        responseText += "\n\n";
      }

      // Key numbers (compact, not a table)
      if (insight.selectedMetrics && insight.selectedMetrics.length > 0) {
        responseText += "**The numbers:**\n";
        for (const metric of insight.selectedMetrics.slice(0, 4)) {
          const formattedValue = formatMetricValue(
            metric.value,
            metric.type,
            currency,
            locale,
          );
          const changeText = formatChangeCompact(
            metric.change,
            metric.changeDirection,
          );
          responseText += `- ${metric.label}: ${formattedValue} ${changeText}\n`;
        }
        responseText += "\n";
      }

      // Expense changes (only spikes, not decreases - decreases are good!)
      if (insight.expenseAnomalies && insight.expenseAnomalies.length > 0) {
        const spikes = insight.expenseAnomalies.filter(
          (ea) => ea.type === "category_spike" || ea.type === "new_category",
        );
        if (spikes.length > 0) {
          responseText += "**Expense heads up:**\n";
          for (const ea of spikes.slice(0, 3)) {
            const currentFormatted = formatMetricValue(
              ea.currentAmount,
              "currency",
              currency,
              locale,
            );
            if (ea.type === "new_category") {
              responseText += `- New: ${ea.categoryName} (${currentFormatted})\n`;
            } else {
              responseText += `- ${ea.categoryName} up ${ea.change}% to ${currentFormatted}\n`;
            }
          }
          responseText += "\n";
        }
      }

      // Check if this is the first insight for the team
      // (no earlier completed insights exist)
      const isFirstInsight = !(await hasEarlierInsight(db, {
        teamId,
        periodType: insight.periodType,
        periodYear: insight.periodYear,
        periodNumber: insight.periodNumber,
      }));

      // Yield insight data for direct rendering in chat UI
      const insightData = {
        id: insight.id,
        periodLabel,
        periodType: insight.periodType,
        periodYear: insight.periodYear,
        periodNumber: insight.periodNumber,
        currency,
        title: insight.title,
        selectedMetrics: insight.selectedMetrics,
        content: insight.content,
        anomalies: insight.anomalies,
        expenseAnomalies: insight.expenseAnomalies,
        milestones: insight.milestones,
        activity: insight.activity,
        predictions: insight.predictions,
        generatedAt: insight.generatedAt,
        isFirstInsight,
      };

      yield {
        text: responseText,
        success: true,
        insight: insightData,
      };

      // Return for AI context - include insight so extractInsightData() can find it
      return {
        success: true,
        insight: insightData,
        instruction:
          "The insight has been displayed to the user. Do not repeat or summarize it.",
      };
    } catch (error) {
      yield {
        text: `Failed to retrieve insights: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
      return { success: false, reason: "error" };
    }
  },
});

function formatMetricValue(
  value: number,
  type: string,
  currency: string,
  locale: string,
): string {
  // Percentage metrics
  if (
    type.includes("margin") ||
    type.includes("rate") ||
    type === "profit_margin"
  ) {
    return `${value.toFixed(1)}%`;
  }

  // Duration metrics
  if (type === "runway_months") {
    return `${value.toFixed(1)} months`;
  }

  if (
    type === "hours_tracked" ||
    type === "billable_hours" ||
    type === "unbilled_hours"
  ) {
    return `${value.toFixed(1)}h`;
  }

  // Count metrics
  if (
    type.includes("invoices") ||
    type.includes("customers") ||
    type === "new_customers" ||
    type === "active_customers" ||
    type === "receipts_matched" ||
    type === "transactions_categorized"
  ) {
    return value.toLocaleString(locale);
  }

  // Currency metrics (default)
  return (
    formatAmount({
      amount: value,
      currency: currency || "USD",
      locale,
    }) ?? value.toLocaleString(locale)
  );
}

function formatChangeCompact(
  change: number,
  direction: "up" | "down" | "flat",
): string {
  if (direction === "flat" || Math.abs(change) < 0.5) {
    return "(steady)";
  }

  const sign = direction === "up" ? "+" : "-";
  return `(${sign}${Math.abs(Math.round(change))}%)`;
}

// Helper to get current period info
export function getCurrentPeriodInfo(periodType: string): {
  year: number;
  number: number;
} {
  const now = new Date();
  const year = getYear(now);

  switch (periodType) {
    case "weekly":
      return { year, number: getISOWeek(now) };
    case "monthly":
      return { year, number: getMonth(now) + 1 };
    case "quarterly":
      return { year, number: getQuarter(now) };
    case "yearly":
      // For yearly periods, periodNumber is the year itself
      return { year, number: year };
    default:
      return { year, number: getISOWeek(now) };
  }
}
