import type { AppContext } from "@api/ai/agents/config/shared";
import { db } from "@midday/db/client";
import {
  type Insight,
  getInsightByPeriod,
  getLatestInsight,
} from "@midday/db/queries";
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
      if (periodNumber && year) {
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

      // Build rich response with the insight data
      let responseText = "";

      // Header with period
      responseText += `## ${insight.periodLabel}\n\n`;

      // Good news section (relief-first)
      if (insight.content?.goodNews) {
        responseText += `### Good News\n${insight.content.goodNews}\n\n`;
      }

      // Key Metrics Grid (4 metrics)
      if (insight.selectedMetrics && insight.selectedMetrics.length > 0) {
        responseText += "### Key Metrics\n\n";
        responseText += "| Metric | Value | vs Previous |\n";
        responseText += "|--------|-------|-------------|\n";

        for (const metric of insight.selectedMetrics) {
          const formattedValue = formatMetricValue(
            metric.value,
            metric.type,
            currency,
            locale,
          );
          const changeText = formatChange(
            metric.change,
            metric.changeDirection,
          );
          responseText += `| ${metric.label} | ${formattedValue} | ${changeText} |\n`;
        }
        responseText += "\n";
      }

      // Story section
      if (insight.content?.story) {
        responseText += `### What Happened\n${insight.content.story}\n\n`;
      }

      // Upcoming invoices section
      if (
        insight.activity?.upcomingInvoices &&
        insight.activity.upcomingInvoices.count > 0
      ) {
        const upcoming = insight.activity.upcomingInvoices;
        responseText += "### Upcoming Invoices\n";
        responseText += `You have **${upcoming.count}** recurring invoice${upcoming.count > 1 ? "s" : ""} scheduled in the next 7 days`;
        if (upcoming.totalAmount > 0) {
          responseText += ` totaling **${formatMetricValue(upcoming.totalAmount, "currency", currency, locale)}**`;
        }
        responseText += ".\n\n";

        if (upcoming.items && upcoming.items.length > 0) {
          for (const item of upcoming.items.slice(0, 3)) {
            const amountStr = formatMetricValue(
              item.amount,
              "currency",
              currency,
              locale,
            );
            responseText += `- **${item.customerName}**: ${amountStr}`;
            if (item.frequency) {
              responseText += ` (${item.frequency})`;
            }
            responseText += "\n";
          }
          if (upcoming.items.length > 3) {
            responseText += `- ... and ${upcoming.items.length - 3} more\n`;
          }
          responseText += "\n";
        }
      }

      // Overdue invoices alert
      if (
        insight.activity?.invoicesOverdue &&
        insight.activity.invoicesOverdue > 0
      ) {
        responseText += "### Needs Attention\n";
        responseText += `You have **${insight.activity.invoicesOverdue}** overdue invoice${insight.activity.invoicesOverdue > 1 ? "s" : ""}`;
        if (insight.activity.overdueAmount) {
          responseText += ` totaling **${formatMetricValue(insight.activity.overdueAmount, "currency", currency, locale)}**`;
        }
        responseText += ". Consider following up with these customers.\n\n";
      }

      // Action items
      if (insight.content?.actions && insight.content.actions.length > 0) {
        responseText += "### Recommended Actions\n";
        for (const action of insight.content.actions) {
          responseText += `- ${action.text}\n`;
        }
        responseText += "\n";
      }

      // Celebration (if any)
      if (insight.content?.celebration) {
        responseText += `### Celebration\n${insight.content.celebration}\n\n`;
      }

      // Anomalies (notable changes)
      if (insight.anomalies && insight.anomalies.length > 0) {
        const significantAnomalies = insight.anomalies.filter(
          (a) => a.severity === "warning" || a.severity === "alert",
        );
        if (significantAnomalies.length > 0) {
          responseText += "### Notable Changes\n";
          for (const anomaly of significantAnomalies) {
            responseText += `- ${anomaly.message}\n`;
          }
          responseText += "\n";
        }
      }

      // Expense category anomalies
      if (insight.expenseAnomalies && insight.expenseAnomalies.length > 0) {
        responseText += "### Expense Alerts\n";
        for (const ea of insight.expenseAnomalies) {
          const currentFormatted = formatMetricValue(
            ea.currentAmount,
            "currency",
            currency,
            locale,
          );
          const previousFormatted = formatMetricValue(
            ea.previousAmount,
            "currency",
            currency,
            locale,
          );

          if (ea.type === "new_category") {
            responseText += `- **${ea.categoryName}** (NEW): ${currentFormatted} first-time spend\n`;
          } else if (ea.type === "category_decrease") {
            responseText += `- **${ea.categoryName}** decreased ${Math.abs(ea.change)}% (${previousFormatted} → ${currentFormatted})\n`;
          } else {
            // category_spike
            responseText += `- **${ea.categoryName}** increased ${ea.change}% (${previousFormatted} → ${currentFormatted})\n`;
          }

          if (ea.tip) {
            responseText += `  *Tip: ${ea.tip}*\n`;
          }
        }
        responseText += "\n";
      }

      yield { text: responseText };

      // Return structured data for potential UI rendering
      return {
        success: true,
        insight: {
          id: insight.id,
          periodLabel: insight.periodLabel,
          periodType: insight.periodType,
          periodYear: insight.periodYear,
          periodNumber: insight.periodNumber,
          currency,
          selectedMetrics: insight.selectedMetrics,
          content: insight.content,
          anomalies: insight.anomalies,
          expenseAnomalies: insight.expenseAnomalies,
          milestones: insight.milestones,
          activity: insight.activity,
          generatedAt: insight.generatedAt,
        },
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

function formatChange(
  change: number,
  direction: "up" | "down" | "flat",
): string {
  if (direction === "flat" || Math.abs(change) < 0.5) {
    return "→ stable";
  }

  const arrow = direction === "up" ? "↑" : "↓";
  const sign = direction === "up" ? "+" : "";
  return `${arrow} ${sign}${change.toFixed(1)}%`;
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
      return { year, number: year };
    default:
      return { year, number: getISOWeek(now) };
  }
}
