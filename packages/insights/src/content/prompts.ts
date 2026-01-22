/**
 * AI prompt templates for insight content generation
 *
 * "What Matters Now" format - action-first, specific names/amounts, one priority
 */
import { PERIOD_TYPE_LABELS } from "../constants";
import { formatMetricValue } from "../metrics/calculator";
import type {
  ExpenseAnomaly,
  InsightActivity,
  InsightAnomaly,
  InsightContext,
  InsightMetric,
  InsightSentiment,
  MoneyOnTable,
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

  let context = `\nScheduled Revenue (next 7 days):\n- ${count} recurring invoice(s) going out to clients, totaling ${formattedTotal}`;

  if (items && items.length > 0) {
    const topItems = items.slice(0, 3);
    const formattedItems = topItems
      .map(
        (i) =>
          `${i.customerName} (${formatMetricValue(i.amount, "currency", currency)})`,
      )
      .join(", ");
    context += `\n- Billing: ${formattedItems}`;
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
 * Format detailed "Money on Table" context with specific customer names and amounts
 * This is the key differentiator - specific, actionable information
 */
export function formatMoneyOnTableContext(
  moneyOnTable: MoneyOnTable | undefined,
  currency: string,
): string {
  if (!moneyOnTable) return "";

  const sections: string[] = [];

  // Overdue invoices with customer names and days
  if (moneyOnTable.overdueInvoices.length > 0) {
    const overdueLines = moneyOnTable.overdueInvoices
      .slice(0, 3) // Top 3 only
      .map((inv) => {
        const amount = formatMetricValue(inv.amount, "currency", currency);
        return `  - ${inv.customerName}: ${amount} (${inv.daysOverdue} days overdue)`;
      });
    sections.push(`Overdue Invoices:\n${overdueLines.join("\n")}`);
  }

  // Unbilled work with project names
  if (moneyOnTable.unbilledWork.length > 0) {
    const unbilledLines = moneyOnTable.unbilledWork
      .slice(0, 3) // Top 3 only
      .map((work) => {
        const amount = formatMetricValue(
          work.billableAmount,
          "currency",
          currency,
        );
        const projectInfo = work.customerName
          ? `${work.projectName} (${work.customerName})`
          : work.projectName;
        return `  - ${projectInfo}: ${work.hours}h = ${amount}`;
      });
    sections.push(`Unbilled Work:\n${unbilledLines.join("\n")}`);
  }

  // Draft invoices ready to send
  if (moneyOnTable.draftInvoices.length > 0) {
    const draftLines = moneyOnTable.draftInvoices
      .slice(0, 3) // Top 3 only
      .map((inv) => {
        const amount = formatMetricValue(inv.amount, "currency", currency);
        return `  - ${inv.customerName}: ${amount} (ready to send)`;
      });
    sections.push(`Draft Invoices Ready:\n${draftLines.join("\n")}`);
  }

  if (sections.length === 0) return "";

  const totalFormatted = formatMetricValue(
    moneyOnTable.totalAmount,
    "currency",
    currency,
  );
  return `\nMONEY ON THE TABLE: ${totalFormatted} total\n${sections.join("\n\n")}`;
}

/**
 * Format comparison context (rolling averages and streaks) for the AI prompt
 */
export function formatComparisonContext(
  context: InsightContext | undefined,
  currency: string,
): string {
  if (!context) return "";

  const lines: string[] = [];

  // Rolling average comparison
  if (context.rollingAverage && context.comparison) {
    const avgFormatted = formatMetricValue(
      context.rollingAverage.revenue,
      "currency",
      currency,
    );
    lines.push(
      `Your usual weekly revenue: ${avgFormatted} (${context.rollingAverage.weeksIncluded}-week average)`,
    );
    lines.push(`This week vs usual: ${context.comparison.description}`);
  }

  // Streak info
  if (context.streak) {
    lines.push(`Streak: ${context.streak.description}`);
  }

  if (lines.length === 0) return "";

  return `\nCOMPARISON CONTEXT:\n${lines.map((l) => `- ${l}`).join("\n")}`;
}

/**
 * Determine if this is a "nothing notable" week
 */
export function isNothingNotableWeek(
  metrics: InsightMetric[],
  activity: InsightActivity,
): boolean {
  // Check if all key metrics are zero or flat
  const revenueMetric = metrics.find((m) => m.type === "revenue");
  const hasRevenue = revenueMetric && revenueMetric.value > 0;
  const hasOverdue = activity.invoicesOverdue > 0;
  const hasUnbilled = activity.unbilledHours > 5; // More than 5 hours
  const hasActivity =
    activity.invoicesSent > 0 ||
    activity.invoicesPaid > 0 ||
    activity.hoursTracked > 0 ||
    activity.newCustomers > 0;

  // If there's nothing actionable and no significant activity
  return !hasRevenue && !hasOverdue && !hasUnbilled && !hasActivity;
}

/**
 * Build the main prompt for AI content generation
 *
 * "What Matters Now" format - action-first, specific, one priority
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
  const expenseAnomaliesContext = formatExpenseAnomaliesContext(
    expenseAnomalies,
    currency,
  );

  // New detailed money-on-table context with specific names
  const moneyOnTableContext = formatMoneyOnTableContext(
    activity.moneyOnTable,
    currency,
  );

  // Comparison context (rolling averages and streaks)
  const comparisonContext = formatComparisonContext(activity.context, currency);

  // Check if this is a "nothing notable" week
  const isQuietWeek = isNothingNotableWeek(selectedMetrics, activity);

  // Quiet week prompt
  if (isQuietWeek) {
    return `You're reviewing ${periodLabel} for a business owner. It was a quiet week with minimal activity.

THE DATA:
${metricsContext}
${upcomingContext}

WRITE A CALM, REASSURING SUMMARY:

1. TITLE (12-15 words): Reassure them it's okay. Frame it as a weekly check-in.
   Examples:
   - "Quiet week - nothing needs your attention right now"
   - "Calm week, but $1,200 coming in Monday from Acme"
   - "All clear this week - your books are in good shape"

2. SENTIMENT: "neutral"

3. OPENER (max 10 words): Reassure them, mention what's coming.
   Good: "Quiet week - nothing urgent."
   Good: "No action needed this week."

4. STORY (1-2 sentences): What's coming next week, or a reassuring note about their position.

5. ACTIONS: Only include if there's genuinely something to do. Otherwise empty array.

6. CELEBRATION: null (nothing to celebrate in a quiet week)

Be calm and reassuring. A quiet week is not a bad week.`;
  }

  // Standard "What Matters Now" prompt
  return `You're a trusted business advisor reviewing ${periodLabel} for an SMB owner. They're busy - give them what matters.

THE DATA:
${metricsContext}
${comparisonContext}
${moneyOnTableContext}
${anomaliesContext}${expenseAnomaliesContext}${upcomingContext}

WRITE A "WHAT MATTERS NOW" SUMMARY:

1. TITLE (15-20 words): The first thing they see. Combine the main highlight with secondary context.
   
   Write like a trusted advisor catching them up on their week. Be conversational, not clinical.
   
   FORMAT: [Main thing] + [But here's the bigger picture]
   
   GOOD EXAMPLES by priority:
   
   A) MONEY TO COLLECT (overdue):
      - "Acme's $4,500 is two weeks late - worth a nudge. Rest of your week looks solid."
      - "One thing to chase: Lost Island owes you 15 870 kr. Otherwise a good week."
   
   B) MONEY TO BILL (unbilled/drafts):
      - "You've got 12 billable hours on TechStart sitting there. Revenue's up 15% too."
      - "Quick win: $3,200 draft invoice to Acme ready to send. Third strong week running."
   
   C) WIN TO CELEBRATE:
      - "Nice week - $4,200 came in, about 20% above your usual. Momentum's building."
      - "You're on a run - third growth week straight, $3,100 this time."
   
   D) STEADY STATE:
      - "Solid week - $2,800 in, everyone paid on time. Right where you usually are."
      - "Quiet week at $1,900, but 6 months runway and nothing chasing you."
   
   E) NEEDS ATTENTION:
      - "Lighter week at $1,200, about 30% below usual. Worth keeping an eye on."
      - "Revenue's down a bit this week, but no overdue invoices and expenses are stable."
   
   BAD EXAMPLES (too clinical/notification-like):
      - "$4,500 overdue from Acme Corp - 15 days late." (no context, sounds like an alert)
      - "Revenue: $3,200. One overdue invoice." (just listing facts)
      - "Invoice #1234 is 15 days past due." (sounds like accounting software)
   
   STYLE RULES:
   - ALWAYS balance the news - if something needs attention, mention what's going well too
   - Write amounts naturally: "15 870 kr" not "SEK 15,870", "$4,500" not "USD 4500"
   - NO alarm words: "urgent", "critical", "warning", "alert", "overdue from" (say "owes you" instead)
   - Use contractions and casual phrasing: "worth a nudge", "sitting there", "on a run"
   - Sound like a helpful friend giving a quick update, not a notification

2. SENTIMENT: "positive" | "neutral" | "challenging"
   - positive: Growth, wins, money coming in
   - neutral: Steady, nothing urgent
   - challenging: Needs attention, but constructive

3. OPENER (max 15 words): Set up the story - what's the main thing happening?
   GOOD: "Lost Island usually pays fast, so this one's a bit unusual."
   GOOD: "This was actually your strongest week since October."
   GOOD: "You put in solid hours on TechStart but haven't billed for them yet."
   BAD: "This week had some highlights and challenges." (boring, no personality)

4. STORY (3-4 sentences): Tell the story of their week. What happened, why it matters, what's the situation.
   
   Write like you're catching up with a friend over coffee. Connect the dots between different things.
   ALWAYS weave in the COMPARISON CONTEXT if available - how this week compares to their usual, any streaks.
   
   GOOD EXAMPLE (overdue + comparison):
   "Lost Island's invoice has been sitting there for three weeks now - they usually pay within a few days. 
   Worth reaching out since it's not like them. The good news is the rest of your week was solid - 
   you're actually 15% above your usual revenue, which makes this the third growth week in a row."
   
   GOOD EXAMPLE (good week + streak):
   "The money's flowing nicely right now. You brought in $4,200 this week, which is about 20% more 
   than your usual $3,500. That's three weeks of growth in a row now - you're building real momentum. 
   If you keep this pace through the month, you'll hit your best quarter yet."
   
   GOOD EXAMPLE (steady + context):
   "Pretty standard week - $2,800 came in, which is right in line with your average. Everyone paid 
   on time, nothing's overdue, and your runway is healthy. Sometimes a week that just hums along 
   is exactly what you need."
   
   GOOD EXAMPLE (slower week + perspective):
   "Lighter week at $1,800, about 25% below your usual $2,400. But there's no cause for alarm - 
   no overdue invoices, expenses are stable, and you've got plenty of runway. Could just be 
   normal fluctuation, but worth keeping an eye on next week."
   
   BAD: "Revenue increased by 20%. Expenses were $1,200. One invoice is overdue." (just listing facts)

5. ACTIONS (1-2 items): What should they actually do? Be specific and friendly.
   Primary action should be the single most impactful thing they can do.
   GOOD: "Send Acme a friendly reminder about the $2,800."
   GOOD: "Invoice TechStart for the 12.5 hours ($1,875)."
   BAD: "Follow up on overdue invoices." (which ones? how much?)
   
   If there's genuinely nothing to do, return an empty array.

6. CELEBRATION: Only for genuine wins. Otherwise null.
   GOOD: "First ${periodName} with all invoices paid on time!"
   GOOD: "You crossed $10K monthly revenue!"
   null if nothing worth celebrating.

TONE & STYLE:
- Sound like a trusted friend who looked at your numbers, not a notification system
- Use contractions naturally: "hasn't", "it's", "you've", "that's", "you're"
- NO alarm words: never say "urgent", "critical", "immediately", "action required", "warning"
- Write amounts naturally for the locale: "15 870 kr" not "SEK 15,870"
- Always use specific customer names and amounts
- One clear priority is better than a list of five things`;
}

/**
 * Get fallback content when AI generation fails
 */
export function getFallbackContent(
  periodLabel: string,
  _periodType: PeriodType,
  activity?: InsightActivity,
): {
  title: string;
  sentiment: InsightSentiment;
  opener: string;
  story: string;
  actions: Array<{ text: string }>;
  celebration?: string;
} {
  // If there's money on the table, mention it even in fallback
  const moneyOnTable = activity?.moneyOnTable;
  if (moneyOnTable && moneyOnTable.totalAmount > 0) {
    const hasOverdue = moneyOnTable.overdueInvoices.length > 0;
    const topOverdue = moneyOnTable.overdueInvoices[0];

    return {
      title:
        hasOverdue && topOverdue
          ? `${topOverdue.customerName} owes you - check your ${periodLabel} summary.`
          : `${periodLabel} summary ready - review your numbers.`,
      sentiment: "neutral",
      opener: hasOverdue
        ? "You have outstanding invoices to follow up on."
        : `${periodLabel} summary is ready.`,
      story:
        "Your weekly numbers are ready for review. Check the dashboard for detailed metrics and any items needing attention.",
      actions: hasOverdue
        ? [{ text: "Review overdue invoices" }]
        : [{ text: "Review your dashboard" }],
    };
  }

  return {
    title: `${periodLabel} summary ready.`,
    sentiment: "neutral",
    opener: "Your weekly summary is ready.",
    story:
      "Check your dashboard for the detailed numbers and any items needing attention.",
    actions: [],
  };
}
