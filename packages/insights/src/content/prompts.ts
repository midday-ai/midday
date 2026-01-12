/**
 * AI prompt templates for insight content generation
 */
import { PERIOD_TYPE_LABELS } from "../constants";
import { formatMetricValue } from "../metrics/calculator";
import type {
  ExpenseAnomaly,
  InsightActivity,
  InsightAnomaly,
  InsightMetric,
  PeriodType,
} from "../types";

/**
 * Get the period name for display in prompts
 */
export function getPeriodName(periodType: PeriodType): string {
  return periodType === "weekly"
    ? "week"
    : PERIOD_TYPE_LABELS[periodType].toLowerCase();
}

/**
 * Format metrics for the AI prompt
 */
export function formatMetricsContext(
  metrics: InsightMetric[],
  periodType: PeriodType,
  currency: string,
): string {
  const periodName = getPeriodName(periodType);

  return metrics
    .map((m) => {
      const changeText =
        m.changeDirection === "up"
          ? `+${m.change.toFixed(1)}%`
          : m.changeDirection === "down"
            ? `${m.change.toFixed(1)}%`
            : "unchanged";
      const formattedValue = formatMetricValue(m.value, m.type, currency);
      return `- ${m.label}: ${formattedValue} (${changeText} vs last ${periodName})`;
    })
    .join("\n");
}

/**
 * Format anomalies for the AI prompt
 */
export function formatAnomaliesContext(anomalies: InsightAnomaly[]): string {
  if (anomalies.length === 0) {
    return "No significant anomalies detected.";
  }
  return anomalies.map((a) => `- ${a.message}`).join("\n");
}

/**
 * Format upcoming invoices context
 */
export function formatUpcomingInvoicesContext(
  activity: InsightActivity,
  currency: string,
): string {
  if (!activity.upcomingInvoices || activity.upcomingInvoices.count === 0) {
    return "";
  }

  const { count, totalAmount, items } = activity.upcomingInvoices;
  const formattedTotal = formatMetricValue(totalAmount, "currency", currency);

  let context = `\nUpcoming Recurring Invoices (next 7 days):\n- ${count} invoice(s) scheduled, totaling ${formattedTotal}`;

  if (items && items.length > 0) {
    const topItems = items.slice(0, 3);
    const formattedItems = topItems
      .map(
        (i) =>
          `${i.customerName} (${formatMetricValue(i.amount, "currency", currency)})`,
      )
      .join(", ");
    context += `\n- Top upcoming: ${formattedItems}`;
  }

  return context;
}

/**
 * Format overdue invoices context
 */
export function formatOverdueContext(
  activity: InsightActivity,
  currency: string,
): string {
  if (activity.invoicesOverdue === 0) {
    return "";
  }

  let context = `\nOverdue Invoices:\n- ${activity.invoicesOverdue} overdue invoice(s)`;
  if (activity.overdueAmount) {
    context += ` totaling ${formatMetricValue(activity.overdueAmount, "currency", currency)}`;
  }

  return context;
}

/**
 * Format expense anomalies for the AI prompt
 */
export function formatExpenseAnomaliesContext(
  expenseAnomalies: ExpenseAnomaly[],
  currency: string,
): string {
  if (expenseAnomalies.length === 0) {
    return "";
  }

  const lines = expenseAnomalies.map((ea) => {
    const currentFormatted = formatMetricValue(
      ea.currentAmount,
      "currency",
      currency,
    );
    const previousFormatted = formatMetricValue(
      ea.previousAmount,
      "currency",
      currency,
    );

    if (ea.type === "new_category") {
      return `- NEW: ${ea.categoryName} - ${currentFormatted} (first time this category)`;
    }
    if (ea.type === "category_decrease") {
      return `- ${ea.categoryName} decreased ${Math.abs(ea.change)}% (${previousFormatted} → ${currentFormatted})`;
    }
    // category_spike
    return `- ${ea.categoryName} increased ${ea.change}% (${previousFormatted} → ${currentFormatted})`;
  });

  return `\nExpense Category Changes:\n${lines.join("\n")}`;
}

/**
 * Build the main prompt for AI content generation
 */
export function buildInsightPrompt(
  selectedMetrics: InsightMetric[],
  anomalies: InsightAnomaly[],
  activity: InsightActivity,
  periodLabel: string,
  periodType: PeriodType,
  currency: string,
  expenseAnomalies: ExpenseAnomaly[] = [],
): string {
  const periodName = getPeriodName(periodType);
  const metricsContext = formatMetricsContext(
    selectedMetrics,
    periodType,
    currency,
  );
  const anomaliesContext = formatAnomaliesContext(anomalies);
  const upcomingContext = formatUpcomingInvoicesContext(activity, currency);
  const overdueContext = formatOverdueContext(activity, currency);
  const expenseAnomaliesContext = formatExpenseAnomaliesContext(
    expenseAnomalies,
    currency,
  );

  // Build action hints based on activity
  const actionHints: string[] = [];
  if (activity.invoicesOverdue > 0) {
    actionHints.push("Include following up on overdue invoices.");
  }
  if (activity.upcomingInvoices?.count) {
    actionHints.push("Consider mentioning preparing for upcoming invoices.");
  }
  // Add expense anomaly hints
  const warningExpenseAnomalies = expenseAnomalies.filter(
    (ea) => ea.severity === "warning",
  );
  if (warningExpenseAnomalies.length > 0) {
    actionHints.push(
      "Recommend reviewing the expense categories that spiked significantly.",
    );
  }
  const actionHintsText =
    actionHints.length > 0 ? ` ${actionHints.join(" ")}` : "";

  // Build story hints
  const storyHints: string[] = [];
  if (activity.upcomingInvoices?.count) {
    storyHints.push(
      "Mention the upcoming scheduled invoices as expected revenue.",
    );
  }
  // Add expense anomaly story hints
  if (expenseAnomalies.length > 0) {
    storyHints.push(
      "If relevant, briefly mention notable expense category changes.",
    );
  }
  const storyHintsText =
    storyHints.length > 0 ? ` ${storyHints.join(" ")}` : "";

  return `You are a friendly business advisor helping a small business owner understand their ${periodName}ly performance.

Period: ${periodLabel}

Key Metrics:
${metricsContext}

Notable Changes:
${anomaliesContext}${expenseAnomaliesContext}${upcomingContext}${overdueContext}

Generate a business insight summary with these exact sections:

1. GOOD NEWS (1-2 sentences): Start with something positive. Even if overall performance is down, find a silver lining. Be specific and reassuring.

2. STORY (2-3 sentences): Explain what happened this ${periodName} in plain language. Connect the dots between metrics. Don't just repeat numbers - explain what they mean.${storyHintsText}

3. ACTIONS (3-4 bullet points): Specific, actionable recommendations. Each should be concrete and achievable this ${periodName}. Format as short imperative sentences.${actionHintsText}

4. CELEBRATION (optional, 1 sentence): If there's a milestone, streak, or achievement worth celebrating, mention it. Otherwise, leave empty.

Tone: Warm, professional, encouraging. Like a trusted advisor who genuinely cares about their success.`;
}

/**
 * Get fallback content when AI generation fails
 */
export function getFallbackContent(
  periodLabel: string,
  periodType: PeriodType,
): {
  goodNews: string;
  story: string;
  actions: Array<{ text: string; type?: string }>;
  celebration?: string;
} {
  const periodName = getPeriodName(periodType);

  return {
    goodNews: `Your ${periodName}ly summary for ${periodLabel} is ready.`,
    story: `Here's a snapshot of your business performance. Review the key metrics to understand how things are progressing.`,
    actions: [
      { text: "Review your top expense categories", type: "review" },
      { text: "Follow up on any pending invoices", type: "follow_up" },
      { text: "Check your cash flow forecast", type: "review" },
    ],
  };
}
