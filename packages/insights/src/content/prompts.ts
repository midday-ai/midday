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
  InsightPredictions,
  MomentumContext,
  MoneyOnTable,
  PeriodType,
  PreviousPredictionsContext,
} from "../types";
import type {
  ContentGenerationContext,
  YearOverYearContext,
} from "./generator";

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
      // Include historical context if available (e.g., "Your best week ever", "Highest since October")
      const historicalNote = m.historicalContext
        ? ` [${m.historicalContext}]`
        : "";

      // For big swings (>40%), show previous value to give context
      // This helps the AI understand "quiet week after big week" patterns
      let previousNote = "";
      if (Math.abs(m.change) > 40 && m.previousValue > 0) {
        const prevFormatted = formatMetricValue(
          m.previousValue,
          m.type,
          currency,
        );
        previousNote = ` [last ${periodName}: ${prevFormatted}]`;
      }

      return `- ${m.label}: ${formattedValue} (${changeText} vs last ${periodName})${historicalNote}${previousNote}`;
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
 * Format momentum and recovery context for the AI prompt
 */
export function formatMomentumContext(
  momentumContext: MomentumContext | undefined,
): string {
  if (!momentumContext) return "";

  const lines: string[] = [];

  // Momentum (acceleration)
  if (momentumContext.momentum) {
    const momentumDesc =
      momentumContext.momentum === "accelerating"
        ? "Growth is accelerating (growing faster than last week)"
        : momentumContext.momentum === "decelerating"
          ? "Growth is slowing down (still growing, but less than last week)"
          : "Growth is steady";
    lines.push(momentumDesc);
  }

  // Recovery
  if (momentumContext.recovery?.isRecovery) {
    lines.push(
      `RECOVERY: ${momentumContext.recovery.description} [${momentumContext.recovery.strength} bounce-back]`,
    );
  }

  if (lines.length === 0) return "";

  return `\nMOMENTUM:\n${lines.map((l) => `- ${l}`).join("\n")}`;
}

/**
 * Format previous predictions context for follow-through
 */
export function formatPreviousPredictionsContext(
  previousPredictions: PreviousPredictionsContext | undefined,
  currency: string,
): string {
  if (!previousPredictions) return "";

  const lines: string[] = [];

  // Invoices that were due
  if (previousPredictions.invoicesDue) {
    const predicted = formatMetricValue(
      previousPredictions.invoicesDue.predicted,
      "currency",
      currency,
    );
    lines.push(
      `Last week I said ${predicted} in invoices was due - how did it go?`,
    );
  }

  // Streak that was at risk
  if (previousPredictions.streakAtRisk) {
    const streakType = previousPredictions.streakAtRisk.type.replace(/_/g, " ");
    lines.push(
      `Last week you had a ${previousPredictions.streakAtRisk.count}-week ${streakType} streak going`,
    );
  }

  if (lines.length === 0) return "";

  return `\nFOLLOW-THROUGH (from last week's predictions):\n${lines.map((l) => `- ${l}`).join("\n")}`;
}

/**
 * Format forward-looking predictions context
 */
export function formatPredictionsContext(
  predictions: InsightPredictions | undefined,
  currency: string,
): string {
  if (!predictions) return "";

  const lines: string[] = [];

  // Invoices due next week
  if (predictions.invoicesDue && predictions.invoicesDue.count > 0) {
    const amount = formatMetricValue(
      predictions.invoicesDue.totalAmount,
      "currency",
      currency,
    );
    lines.push(
      `Next week: ${predictions.invoicesDue.count} invoice(s) due totaling ${amount}`,
    );
  }

  // Current streak at risk
  if (predictions.streakAtRisk) {
    const streakType = predictions.streakAtRisk.type.replace(/_/g, " ");
    lines.push(
      `Streak to maintain: ${predictions.streakAtRisk.count}-week ${streakType} streak`,
    );
  }

  if (lines.length === 0) return "";

  return `\nLOOKING AHEAD:\n${lines.map((l) => `- ${l}`).join("\n")}`;
}

/**
 * Format year-over-year comparison context
 */
export function formatYearOverYearContext(
  yoy: YearOverYearContext | undefined,
  currency: string,
): string {
  if (!yoy || !yoy.hasComparison) return "";

  const lines: string[] = [];
  const lastYearRevFormatted = formatMetricValue(
    yoy.lastYearRevenue,
    "currency",
    currency,
  );

  // Revenue YoY
  if (yoy.revenueChangePercent !== 0) {
    const direction = yoy.revenueChangePercent > 0 ? "up" : "down";
    const absChange = Math.abs(yoy.revenueChangePercent);
    lines.push(
      `Revenue vs same week last year: ${direction} ${absChange}% (was ${lastYearRevFormatted})`,
    );
  } else {
    lines.push(`Revenue same as this week last year (${lastYearRevFormatted})`);
  }

  if (lines.length === 0) return "";

  return `\nYEAR-OVER-YEAR:\n${lines.map((l) => `- ${l}`).join("\n")}`;
}

/**
 * Format runway context (especially important for slow weeks)
 */
export function formatRunwayContext(
  runwayMonths: number | undefined,
  isSlowWeek: boolean,
): string {
  if (!runwayMonths || runwayMonths <= 0) return "";

  // Always show if less than 6 months (important)
  // Show on slow weeks for reassurance
  // Show if very healthy (12+ months) as a positive
  const shouldShow = runwayMonths < 6 || isSlowWeek || runwayMonths >= 12;

  if (!shouldShow) return "";

  let description: string;
  if (runwayMonths >= 12) {
    description = `${Math.round(runwayMonths)} months of runway - very healthy position`;
  } else if (runwayMonths >= 6) {
    description = `${Math.round(runwayMonths)} months of runway - solid buffer`;
  } else if (runwayMonths >= 3) {
    description = `${Math.round(runwayMonths)} months of runway - worth keeping an eye on`;
  } else {
    description = `${Math.round(runwayMonths)} months of runway - needs attention`;
  }

  return `\nRUNWAY (based on last 3 months burn rate):\n- ${description}`;
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
  context: ContentGenerationContext = {},
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

  // Momentum and recovery context
  const momentumContextStr = formatMomentumContext(context.momentumContext);

  // Previous predictions for follow-through
  const previousPredictionsStr = formatPreviousPredictionsContext(
    context.previousPredictions,
    currency,
  );

  // Forward-looking predictions
  const predictionsStr = formatPredictionsContext(
    context.predictions,
    currency,
  );

  // Year-over-year comparison
  const yoyContextStr = formatYearOverYearContext(
    context.yearOverYear,
    currency,
  );

  // Check if this is a "nothing notable" week or a slow week
  const isQuietWeek = isNothingNotableWeek(selectedMetrics, activity);
  const revenueMetric = selectedMetrics.find((m) => m.type === "revenue");
  const isSlowWeek = revenueMetric && revenueMetric.change < -15; // Down more than 15%

  // Runway context (especially important for slow weeks)
  const runwayContextStr = formatRunwayContext(
    context.runwayMonths,
    isSlowWeek ?? false,
  );

  // Quiet week prompt
  if (isQuietWeek) {
    return `You're reviewing ${periodLabel} for a business owner. It was a quiet week with minimal activity.

THE DATA:
${metricsContext}
${runwayContextStr}
${yoyContextStr}
${upcomingContext}

WRITE A CALM, REASSURING SUMMARY:

1. TITLE (20-35 words): Informative hook with amounts only.
   
   Examples:
   - "Quiet week with 45k kr revenue, 12k kr expenses. Nothing needs attention, 8 months runway."
   - "Steady week - 89k kr revenue, 37k kr profit. All invoices paid, books in good shape."
   - "Calm week ahead. 52k kr revenue locked in, plus $1,200 coming Monday from [Customer]."

2. SUMMARY (25-35 words): Clean description with amounts only.
   Examples:
   - "Quiet week with no revenue movement, but you've got 8 months runway and $12k in the bank. Nothing needs your attention right now."
   - "Calm week - $2,100 in expenses, nothing overdue. You've got $1,200 coming in Monday from [Customer] to kick off next week."
   - "All clear this week. Revenue steady at $3,400, expenses at $2,900. Your books are in good shape with 6 months runway."

3. STORY (1-2 sentences): What's coming next week, or a reassuring note about their position.
   IMPORTANT: If RUNWAY is shown, mention it! "You've got X months of runway" is the most reassuring thing you can say.

4. ACTIONS: Only include if there's genuinely something to do. Otherwise empty array.

Be calm and reassuring. A quiet week is not a bad week.`;
  }

  // Standard "What Matters Now" prompt
  return `You're a trusted business advisor reviewing ${periodLabel} for an SMB owner. They're busy - give them what matters.

THE DATA:
${metricsContext}
${comparisonContext}
${yoyContextStr}
${runwayContextStr}
${momentumContextStr}
${moneyOnTableContext}
${anomaliesContext}${expenseAnomaliesContext}${upcomingContext}
${previousPredictionsStr}
${predictionsStr}

CRITICAL - DO NOT HALLUCINATE:
- ONLY use customer names that appear in the data above
- ONLY use amounts that appear in the data above
- If you mention a customer, they MUST be in MONEY ON THE TABLE or OVERDUE INVOICES
- NEVER make up or estimate amounts - use exact figures from the data

WRITE A "WHAT MATTERS NOW" SUMMARY:

1. TITLE (20-35 words): Week snapshot for widget cards. Key numbers with context.
   
   RULES:
   - Lead with profit and add context (margin %, revenue comparison, or trend)
   - Include runway months
   - Mention any overdue with customer name and amount
   - Use full amounts (260,000 kr not "260k kr")
   - Use REAL customer names from the data
   - NO superlatives like "best week", "strong week", "great week" - let numbers speak
   
   GOOD WEEKS:
   - "338,958 kr profit on 350,000 kr revenue - healthy 97% margin. 14 months runway. Lost Island AB owes 750 kr."
   - "45,000 kr profit with expenses at just 5,000 kr. Everyone paid on time. 12 months runway."
   - "89,000 kr profit, up from 60,000 kr last week. Runway solid at 14 months."
   
   ZERO/LOSS WEEKS (lead with runway for reassurance):
   - "No payments landed this week - just timing. 14 months runway, no stress. Lost Island AB owes 750 kr."
   - "22,266 kr in expenses, no revenue this week. With 14 months runway, you're in good shape."
   
   BAD:
   - "Your best week!" (loses meaning if repeated)
   - "Strong week:", "Great week:" (generic superlatives)
   - "You faced a loss" (alarming)
   - Abbreviated amounts like "260k" (unprofessional)

2. SUMMARY (30-50 words): DETAILED description for the insight view. Full picture.
   
   INCLUDE ALL:
   - Profit amount (lead with this when positive/impressive)
   - Revenue amount
   - Expenses amount  
   - Runway months (ALWAYS include - most reassuring metric)
   - Any overdue with customer name and amount
   
   FORMAT:
   - Use precise amounts from the data (260,340 kr not "260k")
   - Write naturally for the locale
   
   GOOD WEEKS:
   - "260,340 kr profit this week on 269,668 kr revenue, expenses at 9,328 kr. [Customer] owes you 750 kr. 14 months runway, a strong position."
   
   ZERO/LOSS WEEKS:
   - "Quieter week with no payments landing - just timing. Expenses at 22,266 kr. With 14 months runway, no stress. Lost Island AB still owes 750 kr."
   - Lead with reassurance, not the loss
   - NEVER say "profit loss of -X" - say "expenses at X" or "22,266 kr in costs this week"
   
   BAD:
   - "You faced a profit loss of -22,266 kr" (alarming, redundant)
   - "Expenses skyrocketing" (alarm word)
   - Missing runway on a bad week (runway is the reassurance!)

3. STORY (2-3 sentences): Add NEW context and celebrate wins - the summary has the numbers.
   
   The STORY should make the owner FEEL something:
   
   CELEBRATE WINS (when applicable):
   - Big profit jump? "Profit up 7x - that's the kind of week you remember."
   - Best week? "This is the week you'll look back on. Real momentum building."
   - Growth streak? "Three weeks of growth. You're not just lucky, you're building something."
   
   ADD UNIQUE CONTEXT:
   - Historical: "Your best since October" or "First time above 200k"
   - Patterns: "[Customer] usually pays fast - this delay is out of character"
   - Implications: "At this pace, Q1 is going to be your best yet"
   - Momentum: "You've got real momentum now"
   
   DO NOT REPEAT (already in summary/actions):
   - Exact revenue/expense amounts
   - "worth checking in" or "send a reminder" (that's in actions)
   - Runway months
   
   GOOD EXAMPLES:
   "Your best week since October - and profit up 7x. You're building real momentum heading into
   the new year. [Customer] usually pays fast, so the delay is out of character for them."
   
   "This is the kind of week that changes quarters. Three growth weeks in a row now, and your
   margins are looking healthier than ever. Keep this energy."
   
   BAD (flat, repeats things):
   "This is your best week since October, showing impressive growth. [Customer] usually pays
   promptly, so it's worth checking in with them." (repeats action)

4. ACTIONS (1-2 items): ONLY from the data provided. NEVER make up names or amounts.
   
   PRIORITY ORDER (if data exists):
   1. Overdue invoices → "Send [Customer] a friendly reminder about the [amount]"
   2. Draft invoices ready → "Send [Customer] the invoice for [amount]"
   3. Unbilled work → "Invoice [Customer/Project] for [hours] hours ([amount])"
   
   CRITICAL RULES:
   - ONLY use customer names from MONEY ON THE TABLE section
   - ONLY use amounts from the data - NEVER estimate or round
   - If overdue invoices exist, the FIRST action MUST be about the overdue
   - If no actionable data, return empty array
   
   BAD: "Follow up on overdue invoices" (which ones? how much?)
   BAD: Making up customer names not in the data

TONE & STYLE:
- Sound like a smart friend who's genuinely excited about your wins
- Be conversational: "hasn't", "it's", "you've", "that's", "you're"
- NO alarm words: never say "urgent", "critical", "immediately", "action required", "warning"
- Write amounts naturally for the locale: "269,668 kr" not "SEK 269,668" - use full amounts, not abbreviations
- Always use specific customer names and amounts
- Make them FEEL something - pride in wins, confidence in their position
- One clear priority is better than a list of five things

IMPORTANT - PERSONAL BESTS (CELEBRATE THESE!):
- [Your best week ever] or [Your most profitable week ever] → This is HUGE. Lead with it. Make them feel proud.
- [Highest since X] or [Most profitable since X] → Real achievement. "Your best since October" hits different.
- Big profit jump (500%+) → Call it out: "Profit up 7x" or "margins looking incredible"
- These moments are why someone runs a business. Help them savor it.

IMPORTANT - FOLLOW-THROUGH LOOP:
- If FOLLOW-THROUGH section shows predictions from last week, OPEN with how that turned out
- Example: "Last week I said $6K was due - $5,200 came in (87%). Not bad!"
- This creates accountability and trust - they'll look forward to seeing if predictions came true

IMPORTANT - LOOKING AHEAD:
- If LOOKING AHEAD section shows what's coming, weave it into the story or actions
- Example: "Next week looks busy - $7,100 in invoices due. Keep the momentum going."
- This creates anticipation for next week's insight

IMPORTANT - MOMENTUM & RECOVERY:
- If MOMENTUM shows "accelerating", mention that growth is speeding up (this is exciting!)
- If MOMENTUM shows "decelerating", frame constructively - "still growing, just catching your breath"
- If RECOVERY is present, celebrate the bounce-back: "Bounced back strong after a couple slow weeks"

IMPORTANT - YEAR-OVER-YEAR (THE BIG PICTURE):
- If YEAR-OVER-YEAR section is present, USE IT! This gives the owner crucial long-term perspective
- Good weeks: "Up 15% vs last week AND 40% vs this time last year. Your Q1 is shaping up nicely."
- Slow weeks: "Quieter week, but you're still up 25% vs this time last year. The trend is your friend."
- Down YoY: Be honest but constructive - "Down a bit from last year, but let's see what next week brings."
- YoY comparisons are powerful because they account for seasonality

IMPORTANT - RUNWAY (THE SAFETY NET):
- If RUNWAY section is present, weave it into the narrative
- Slow weeks with good runway: "Lighter week at $1,800, but you've got 8 months of runway. No stress."
- This is THE most reassuring sentence you can write for a worried business owner
- Low runway (< 3 months): Mention it matter-of-factly, not alarmingly - "Runway's at X months based on recent spending"
- High runway (12+ months): Use it to celebrate stability - "You're in a strong position"
- REMEMBER: Runway is calculated from 3 months of burn rate - one unusual month can skew it

UNDERSTANDING BIG SWINGS:
- Revenue down 50%+ from last week? It's almost ALWAYS timing (big invoice paid last week, not this week)
- Frame it as: "Quieter week at $X after last week's $Y" - this explains the drop without alarm
- Compare to AVERAGE, not just last week: "About X% below your usual" is more meaningful
- Invoice-based businesses are naturally lumpy - help them see the pattern, not panic at each swing

BAD WEEK REFRAMING RULES:
- Revenue down after a high week → "A breather after last week's big payments"
- Revenue down 50%+ → Almost certainly timing, frame as "quieter week" not "crash"
- Revenue down but still on streak → "Quieter week, but you're still up X% this year"
- Revenue flat → "Holding steady" (not "no growth")
- NEVER make the owner feel bad about a slow week - always find the constructive angle

ZERO REVENUE / LOSS WEEK RULES:
- Zero revenue is NORMAL for invoice-based businesses - it's just timing
- Frame as: "No payments landed this week - that's just timing" 
- Expenses in a zero-revenue week are likely normal monthly costs, NOT "skyrocketing"
- ALWAYS lead with runway: "14 months runway means no stress"
- Negative profit = "22,266 kr in expenses this week" NOT "profit loss of -22,266 kr"
- NEVER use: "skyrocketing", "plummeting", "crashed", "loss", "deficit"
- DO use: "quieter week", "no payments this week", "expenses at X", "breather"

STYLE - DO NOT:
- End with "Let me know if you need anything!" or similar ChatGPT-style phrases
- Use phrases like "I hope this helps" or "Feel free to ask"
- Sound like an AI assistant - sound like a trusted advisor giving a quick update
- Offer to do more analysis unless specifically relevant`;
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
  summary: string;
  story: string;
  actions: Array<{ text: string }>;
} {
  // If there's money on the table, mention it even in fallback
  const moneyOnTable = activity?.moneyOnTable;
  if (moneyOnTable && moneyOnTable.totalAmount > 0) {
    const hasOverdue = moneyOnTable.overdueInvoices.length > 0;
    const topOverdue = moneyOnTable.overdueInvoices[0];

    return {
      title:
        hasOverdue && topOverdue
          ? `${topOverdue.customerName} owes you - check your summary.`
          : `${periodLabel} summary ready.`,
      summary:
        hasOverdue && topOverdue
          ? `You have outstanding invoices to follow up on. ${topOverdue.customerName} owes you - check your ${periodLabel} summary for details.`
          : `${periodLabel} summary is ready. Check the dashboard for your detailed metrics.`,
      story:
        "Your weekly numbers are ready for review. Check the dashboard for detailed metrics and any items needing attention.",
      actions: hasOverdue
        ? [{ text: "Review overdue invoices" }]
        : [{ text: "Review your dashboard" }],
    };
  }

  return {
    title: `${periodLabel} summary ready.`,
    summary: `Your ${periodLabel} summary is ready. Check the dashboard for detailed numbers and any items needing attention.`,
    story:
      "Check your dashboard for the detailed numbers and any items needing attention.",
    actions: [],
  };
}
