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
  InsightSentiment,
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
 * Format unbilled hours context - this is a KEY Midday insight
 */
function formatUnbilledContext(
  activity: InsightActivity,
  currency: string,
): string {
  if (!activity.unbilledHours || activity.unbilledHours === 0) {
    return "";
  }

  const hours = activity.unbilledHours;
  const amount = activity.billableAmount ?? 0;

  if (amount > 0) {
    return `\nUnbilled Work:\n- ${hours.toFixed(1)} hours worth ${formatMetricValue(amount, "currency", currency)} not yet invoiced`;
  }
  return `\nUnbilled Work:\n- ${hours.toFixed(1)} hours not yet invoiced`;
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
  const unbilledContext = formatUnbilledContext(activity, currency);

  return `You're a smart business friend who just looked at ${periodLabel}'s numbers. Give a quick summary.

THE DATA:
${metricsContext}
${anomaliesContext}${expenseAnomaliesContext}${unbilledContext}${upcomingContext}${overdueContext}

WRITE THIS:

1. TITLE (max 15 words): A natural summary combining key numbers.
   REQUIRED FORMAT: "Revenue [X], Expenses [Y], Net [Z]. [One other metric]. [Short sentiment]!"
   
   - Always start with "Revenue", "Expenses", and "Net" (if revenue > 0).
   - Use the EXACT currency format from the data.
   - Add exactly one other relevant metric (hours, overdue, customers).
   - End with a very short 2-word sentiment (e.g., "Strong week!", "Quiet week!", "Tough week!", "Nice progress!").
   
   CORRECT Examples:
   - "Revenue $4,200, Expenses $1,800, Net $2,400. 3 new customers. Strong week!"
   - "Revenue $0, Expenses $17K. 4.8 hours tracked. Quiet week."
   - "Revenue €2,100, Expenses €1,200, Net €900. All paid. Solid week!"
   - "Revenue $0, Expenses $1,200. $4.5K in overdue invoices. Tough week."

2. SENTIMENT: Pick one: "positive" | "neutral" | "challenging"

3. OPENER (max 10 words): The single most important thing. Be blunt.
   Good: "Slow week—hours dropped 59%."
   Good: "Revenue up 25%, nice work."
   Good: "You've got $4,500 in overdue invoices."
   Bad: "This week presented some challenges..." (too vague)

4. STORY (exactly 2 sentences): Connect the dots between 2-3 data points. Use specific numbers and names.
   Good: "Hours tracked fell but you categorized more expenses. The $900 Lost Island invoice is ready to send."
   Bad: "There were mixed results this week with some areas improving." (no specifics)

5. ACTIONS (exactly 2 items): What to DO. Be specific with names and amounts.
   Good: "Send the $900 Lost Island invoice."
   Good: "Review why professional services jumped to $17K."
   Bad: "Consider reviewing expense categories." (too vague)

6. CELEBRATION: Only if there's a genuine win. Otherwise return null.
   Good: "First week with all invoices paid on time!"
   Leave null if nothing worth celebrating.

RULES:
- Use actual numbers, names, and amounts from the data
- No corporate speak or filler words
- Talk like you're texting a friend who asked "how's my business doing?"
- If something needs attention, say it directly`;
}

/**
 * Get fallback content when AI generation fails
 */
export function getFallbackContent(
  periodLabel: string,
  _periodType: PeriodType,
): {
  title: string;
  sentiment: InsightSentiment;
  opener: string;
  story: string;
  actions: Array<{ text: string }>;
  celebration?: string;
} {
  return {
    title: `${periodLabel} summary`,
    sentiment: "neutral",
    opener: `${periodLabel} summary ready.`,
    story:
      "Check your dashboard for the detailed numbers. The key metrics are waiting for your review.",
    actions: [
      { text: "Review your numbers in the dashboard" },
      { text: "Check any pending invoices" },
    ],
  };
}
