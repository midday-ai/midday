import { createLoggerWithContext } from "@midday/logger";
import { formatMetricValue } from "../../metrics/calculator";
import type {
  ExpenseAnomaly,
  InsightActivity,
  InsightAnomaly,
  InsightMetric,
  MomentumContext,
  PeriodType,
  PreviousPredictionsContext,
} from "../../types";
import type { QuarterPaceContext, YearOverYearContext } from "../generator";

const logger = createLoggerWithContext("insights:slots");

/**
 * Week classification for prompt selection
 */
export type WeekType = "great" | "good" | "quiet" | "challenging";

/**
 * Overdue invoice slot
 */
export type OverdueSlot = {
  id: string;
  company: string;
  amount: string;
  rawAmount: number;
  daysOverdue: number;
  // Payment behavior anomaly detection
  isUnusual?: boolean; // This customer usually pays faster
  unusualReason?: string; // "usually pays within 14 days"
};

/**
 * Draft invoice slot
 */
export type DraftSlot = {
  id: string;
  company: string;
  amount: string;
  rawAmount: number;
};

/**
 * Expense spike slot (significant category increase)
 */
export type ExpenseSpikeSlot = {
  category: string;
  amount: string;
  rawAmount: number;
  change: number; // percentage
  tip?: string;
};

/**
 * Revenue concentration warning
 */
export type ConcentrationWarning = {
  customerName: string;
  percentage: number;
  amount: string;
};

/**
 * The single most interesting thing about this week
 */
export type WeekHighlight =
  | { type: "personal_best"; description: string }
  | { type: "recovery"; description: string }
  | { type: "streak"; description: string }
  | { type: "big_payment"; customer: string; amount: string }
  | { type: "yoy_growth"; description: string }
  | { type: "milestone"; description: string }
  | { type: "profit_multiplier"; multiplier: number }
  | { type: "vs_average"; description: string }
  | { type: "none" };

/**
 * Anomaly slot for explicit warning signals
 */
export type AnomalySlot = {
  type: string;
  severity: "info" | "warning" | "alert";
  message: string;
};

/**
 * All pre-computed slots for AI prompts
 */
export type InsightSlots = {
  // Week classification
  weekType: WeekType;

  // The ONE most interesting thing (for story lead)
  highlight: WeekHighlight;

  // Core financials (formatted strings)
  profit: string;
  profitRaw: number;
  revenue: string;
  revenueRaw: number;
  expenses: string;
  expensesRaw: number;
  margin: string;
  marginRaw: number;
  runway: number;
  runwayExhaustionDate?: string; // "September 15, 2026" - specific date cash runs out
  cashFlow: string;
  cashFlowRaw: number;

  // Changes vs last period
  profitChange: number;
  profitDirection: "up" | "down" | "flat";
  profitChangeDescription: string; // Pre-computed, semantically correct description
  revenueChange: number;
  revenueDirection: "up" | "down" | "flat";

  // Historical context (if available)
  historicalContext?: string; // "Your best week ever", "Highest since October"
  isPersonalBest: boolean;

  // Money on table
  hasOverdue: boolean;
  overdueTotal: string;
  overdueCount: number;
  overdue: OverdueSlot[];
  largestOverdue?: OverdueSlot;

  hasDrafts: boolean;
  draftsTotal: string;
  draftsCount: number;
  drafts: DraftSlot[];

  // Expense spikes (significant category increases worth mentioning)
  hasExpenseSpikes: boolean;
  expenseSpikes: ExpenseSpikeSlot[];

  // Revenue concentration risk (>50% from one customer)
  concentrationWarning?: ConcentrationWarning;

  // Explicit anomaly warnings (pre-computed by backend)
  // Gives AI explicit signals like "low_runway is an ALERT" vs inferring from raw values
  anomalies: AnomalySlot[];
  hasAlerts: boolean; // Any severity="alert" anomalies
  hasWarnings: boolean; // Any severity="warning" anomalies

  // Activity highlights
  invoicesPaid: number;
  invoicesSent: number;
  invoicesSentChange?: string; // Pre-computed: "no activity", "+2", "-50%", etc.
  hoursTracked: number;
  newCustomers: number;
  largestPayment?: {
    customer: string;
    amount: string;
  };

  // Context
  streak?: {
    type: string;
    count: number;
    description: string;
  };
  momentum?: "accelerating" | "steady" | "decelerating";
  isRecovery: boolean;
  recoveryDescription?: string;
  vsAverage?: string; // "20% above your usual"

  // Year over year
  yoyRevenue?: string; // "up 40% vs last year"
  yoyProfit?: string;

  // Quarter pace projection
  quarterPace?: string; // "On pace for 450,000 kr this quarter — 18% ahead of Q1 last year"

  // Predictions
  nextWeekInvoicesDue?: {
    count: number;
    amount: string;
  };

  // Currency for reference
  currency: string;
  periodLabel: string;
  periodType: PeriodType;

  // First insight detection
  isFirstInsight: boolean;

  // Cash flow explanation when it differs from profit
  // Helps users understand why cash flow ≠ profit (receivables timing, etc.)
  cashFlowExplanation?: string;
};

/**
 * Get notable context for the period (milestone, streak, recovery, etc.)
 * Used by summary and title prompts to lead with what's interesting
 */
export function getNotableContext(slots: InsightSlots): string | null {
  if (slots.isPersonalBest && slots.historicalContext) {
    return slots.historicalContext;
  }
  if (slots.isRecovery && slots.recoveryDescription) {
    return slots.recoveryDescription;
  }
  if (slots.streak && slots.streak.count >= 3) {
    return slots.streak.description;
  }
  if (slots.vsAverage) {
    return slots.vsAverage;
  }
  return null;
}

/**
 * Get tone guidance for prompts based on week type
 * Helps AI match the appropriate voice for the situation
 */
export function getToneGuidance(weekType: WeekType): string {
  switch (weekType) {
    case "great":
      return "Tone: Confident and acknowledging — recognize the achievement without being over-the-top. Sound like a trusted advisor noting a milestone.";
    case "good":
      return "Tone: Warm and professional — matter-of-fact with a positive undercurrent. Business as usual, things are working.";
    case "quiet":
      return "Tone: Brief and reassuring — no drama about low activity. Acknowledge the quiet period without concern.";
    case "challenging":
      return "Tone: Direct and constructive — honest about the situation but focused on the buffer (runway) and clear next steps. No alarm, just clarity.";
  }
}

/**
 * Primary action type for story prompt
 */
export type PrimaryAction = {
  type: "overdue" | "draft" | "expense_spike" | "concentration";
  description: string;
  amount: string;
  company?: string;
  daysOverdue?: number;
  category?: string;
  change?: number;
};

/**
 * Select the single most important action to highlight
 * Priority: overdue > drafts > expense spikes > concentration warning
 */
export function selectPrimaryAction(slots: InsightSlots): PrimaryAction | null {
  // Priority 1: Overdue invoices (money you're owed)
  if (slots.hasOverdue && slots.largestOverdue) {
    return {
      type: "overdue",
      description: `Collect ${slots.largestOverdue.amount} overdue from ${slots.largestOverdue.company}`,
      amount: slots.largestOverdue.amount,
      company: slots.largestOverdue.company,
      daysOverdue: slots.largestOverdue.daysOverdue,
    };
  }

  // Priority 2: Draft invoices ready to send
  if (slots.hasDrafts && slots.drafts.length > 0) {
    const topDraft = slots.drafts.reduce((max, d) =>
      d.rawAmount > max.rawAmount ? d : max,
    );
    return {
      type: "draft",
      description: `Send the ${topDraft.amount} draft invoice to ${topDraft.company}`,
      amount: topDraft.amount,
      company: topDraft.company,
    };
  }

  // Priority 3: Expense spikes worth reviewing
  if (slots.hasExpenseSpikes && slots.expenseSpikes.length > 0) {
    const topSpike = slots.expenseSpikes[0]!;
    return {
      type: "expense_spike",
      description: `Review ${topSpike.category} spending — up ${topSpike.change}% to ${topSpike.amount}`,
      amount: topSpike.amount,
      category: topSpike.category,
      change: topSpike.change,
    };
  }

  // Priority 4: Revenue concentration risk
  if (slots.concentrationWarning) {
    return {
      type: "concentration",
      description: `${slots.concentrationWarning.percentage}% of revenue from ${slots.concentrationWarning.customerName} — consider diversifying`,
      amount: slots.concentrationWarning.amount,
      company: slots.concentrationWarning.customerName,
    };
  }

  return null;
}

/**
 * Compute the single most interesting highlight of the week
 * Priority order matters - first match wins
 */
function computeHighlight(data: {
  isPersonalBest: boolean;
  historicalContext?: string;
  isRecovery: boolean;
  recoveryDescription?: string;
  streak?: { type: string; count: number; description: string };
  largestPayment?: { customer: string; amount: string };
  yoyProfit?: string;
  profitChange: number;
  profitRaw: number;
  previousProfitRaw: number;
  vsAverage?: string;
}): WeekHighlight {
  // 1. Personal best - always the lead
  if (data.isPersonalBest && data.historicalContext) {
    return { type: "personal_best", description: data.historicalContext };
  }

  // 2. Recovery after down weeks
  if (data.isRecovery && data.recoveryDescription) {
    return { type: "recovery", description: data.recoveryDescription };
  }

  // 3. Significant streak (3+ weeks profitable, or 2+ weeks declining)
  if (data.streak) {
    // Revenue decline is more urgent - highlight at 2+ weeks
    if (data.streak.type === "revenue_decline" && data.streak.count >= 2) {
      return { type: "streak", description: data.streak.description };
    }
    // Other positive streaks at 3+ weeks
    if (data.streak.count >= 3) {
      return { type: "streak", description: data.streak.description };
    }
  }

  // 4. Big profit multiplier (3x or more vs last week)
  if (data.previousProfitRaw > 0 && data.profitRaw > 0) {
    const multiplier = data.profitRaw / data.previousProfitRaw;
    if (multiplier >= 3) {
      return { type: "profit_multiplier", multiplier: Math.round(multiplier) };
    }
  }

  // 5. YoY comparison (significant growth or decline)
  if (data.yoyProfit) {
    if (data.yoyProfit.includes("up")) {
      return { type: "yoy_growth", description: `Profit ${data.yoyProfit}` };
    }
    // Also highlight significant YoY decline (important context)
    if (data.yoyProfit.includes("down") && data.profitRaw < 0) {
      return { type: "yoy_growth", description: `Profit ${data.yoyProfit}` };
    }
  }

  // 6. Big payment
  if (data.largestPayment) {
    return {
      type: "big_payment",
      customer: data.largestPayment.customer,
      amount: data.largestPayment.amount,
    };
  }

  // 7. vs Average
  if (data.vsAverage) {
    return { type: "vs_average", description: data.vsAverage };
  }

  return { type: "none" };
}

/**
 * Compute a semantically correct profit change description
 * This prevents misleading interpretations like "profit doubled" when loss just decreased
 */
export function computeProfitChangeDescription(
  currentProfit: number,
  previousProfit: number,
  changePercent: number,
): string {
  const absChange = Math.abs(changePercent);

  // No significant change
  if (absChange < 5) {
    return "flat vs last week";
  }

  // Both periods profitable - straightforward
  if (currentProfit > 0 && previousProfit > 0) {
    return changePercent > 0
      ? `up ${Math.round(absChange)}% vs last week`
      : `down ${Math.round(absChange)}% vs last week`;
  }

  // Both periods in loss - describe loss change correctly
  if (currentProfit < 0 && previousProfit < 0) {
    if (currentProfit > previousProfit) {
      // Loss decreased (e.g., -189k to -7k)
      return `loss decreased ${Math.round(absChange)}% vs last week`;
    }
    // Loss increased
    return `loss increased ${Math.round(absChange)}% vs last week`;
  }

  // Crossed from loss to profit
  if (currentProfit > 0 && previousProfit < 0) {
    return "returned to profit";
  }

  // Crossed from profit to loss
  if (currentProfit < 0 && previousProfit > 0) {
    return "turned to loss";
  }

  // From zero
  if (previousProfit === 0 && currentProfit !== 0) {
    return currentProfit > 0 ? "profit this week" : "loss this week";
  }

  // To zero
  if (currentProfit === 0) {
    return "break-even this week";
  }

  return "vs last week";
}

/**
 * Determine week type based on metrics
 */
function determineWeekType(
  profitRaw: number,
  profitChange: number,
  revenueRaw: number,
  revenueChange: number,
  isPersonalBest: boolean,
): WeekType {
  // Great: Personal best OR profit up significantly with good margins
  if (isPersonalBest) return "great";
  if (profitRaw > 0 && profitChange > 50) return "great";

  // Challenging: Negative profit OR revenue down significantly
  if (profitRaw < 0) return "challenging";
  if (revenueRaw === 0) return "challenging";
  if (revenueChange < -30) return "challenging";

  // Quiet: Low activity, flat or small changes
  if (revenueRaw > 0 && Math.abs(revenueChange) < 10 && profitRaw >= 0) {
    return "quiet";
  }

  // Good: Everything else positive
  return "good";
}

/**
 * Compute all slots from raw insight data
 */
export function computeSlots(
  metrics: InsightMetric[],
  activity: InsightActivity,
  currency: string,
  periodLabel: string,
  periodType: PeriodType,
  context?: {
    momentumContext?: MomentumContext;
    yearOverYear?: YearOverYearContext;
    quarterPace?: QuarterPaceContext;
    previousPredictions?: PreviousPredictionsContext;
    runwayMonths?: number;
    periodEnd?: Date; // For calculating dates relative to period
    weeksOfHistory?: number;
    expenseAnomalies?: ExpenseAnomaly[];
    revenueConcentration?: {
      topCustomer: { name: string; revenue: number; percentage: number } | null;
      isConcentrated: boolean;
    };
    anomalies?: InsightAnomaly[];
    /** All computed metrics (for activity metric change descriptions) */
    allMetrics?: Record<string, InsightMetric>;
    /** Forward-looking predictions for next week */
    predictions?: {
      invoicesDue?: {
        count: number;
        totalAmount: number;
        currency: string;
      };
    };
  },
): InsightSlots {
  // Extract metrics
  const profitMetric = metrics.find(
    (m) => m.type === "net_profit" || m.type === "profit",
  );
  const revenueMetric = metrics.find((m) => m.type === "revenue");
  const expensesMetric = metrics.find((m) => m.type === "expenses");
  const marginMetric = metrics.find(
    (m) => m.type === "profit_margin" || m.type === "margin",
  );
  const cashFlowMetric = metrics.find((m) => m.type === "cash_flow");
  const runwayMetric = metrics.find((m) => m.type === "runway_months");

  // Raw values
  const profitRaw = profitMetric?.value ?? 0;
  let revenueRaw = revenueMetric?.value ?? 0;
  let expensesRaw = expensesMetric?.value ?? 0;

  // CRITICAL: Data consistency defense
  // The math MUST hold: profit = revenue - expenses

  // Case 1: If expenses is 0 but profit < revenue, derive expenses
  const impliedExpenses = revenueRaw - profitRaw;
  if (expensesRaw === 0 && impliedExpenses > 0) {
    logger.warn("Data fix: expenses derived in slots", {
      originalExpenses: 0,
      derivedExpenses: impliedExpenses,
      revenue: revenueRaw,
      profit: profitRaw,
    });
    expensesRaw = impliedExpenses;
  }

  // Case 2: If revenue is 0 but profit + expenses suggests otherwise, derive revenue
  // This happens when transactions aren't categorized as revenue but show up in profit
  const impliedRevenue = profitRaw + expensesRaw;
  if (revenueRaw === 0 && impliedRevenue > 0 && profitRaw > 0) {
    logger.warn("Data fix: revenue derived in slots", {
      originalRevenue: 0,
      derivedRevenue: impliedRevenue,
      profit: profitRaw,
      expenses: expensesRaw,
    });
    revenueRaw = impliedRevenue;
  }

  const marginRaw =
    marginMetric?.value ??
    (revenueRaw > 0 ? (profitRaw / revenueRaw) * 100 : 0);
  const cashFlowRaw = cashFlowMetric?.value ?? 0;
  const runway = context?.runwayMonths ?? runwayMetric?.value ?? 0;

  // Calculate runway exhaustion date (when cash runs out)
  // Use period end date if available, otherwise fall back to today
  let runwayExhaustionDate: string | undefined;
  if (runway > 0 && runway < 24) {
    // Only show date if runway is meaningful (< 2 years)
    const baseDate = context?.periodEnd
      ? new Date(context.periodEnd)
      : new Date();
    const exhaustionDate = new Date(baseDate);
    exhaustionDate.setDate(exhaustionDate.getDate() + Math.round(runway * 30));
    // Format as "September 15, 2026"
    runwayExhaustionDate = exhaustionDate.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  // Cash flow explanation when it differs significantly from profit
  // This helps users understand why cash flow ≠ profit (receivables timing, etc.)
  let cashFlowExplanation: string | undefined;
  const cashFlowDiff = Math.abs(cashFlowRaw - profitRaw);
  const significantDiffThreshold = Math.max(Math.abs(profitRaw) * 0.2, 500); // 20% or 500, whichever is larger

  if (cashFlowDiff > significantDiffThreshold && profitRaw !== 0) {
    if (cashFlowRaw > profitRaw) {
      // Cash flow higher than profit: likely collected receivables from previous periods
      cashFlowExplanation =
        "Cash flow exceeds profit due to collected receivables from previous periods";
    } else {
      // Cash flow lower than profit: likely revenue not yet collected (invoices outstanding)
      cashFlowExplanation =
        "Cash flow is lower than profit because some revenue hasn't been collected yet";
    }
  }

  // Changes
  const profitChange = profitMetric?.change ?? 0;
  const profitDirection = profitMetric?.changeDirection ?? "flat";
  const revenueChange = revenueMetric?.change ?? 0;
  const revenueDirection = revenueMetric?.changeDirection ?? "flat";
  const previousProfitRaw = profitMetric?.previousValue ?? 0;

  // Pre-computed, semantically correct change description
  // This prevents the AI from misinterpreting "+96%" as "doubled" when we're still in loss
  const profitChangeDescription = computeProfitChangeDescription(
    profitRaw,
    previousProfitRaw,
    profitChange,
  );

  // Historical context
  const historicalContext =
    profitMetric?.historicalContext || revenueMetric?.historicalContext;
  const isPersonalBest =
    historicalContext?.includes("best") ||
    historicalContext?.includes("ever") ||
    false;

  // Week type
  const weekType = determineWeekType(
    profitRaw,
    profitChange,
    revenueRaw,
    revenueChange,
    isPersonalBest,
  );

  // Money on table - Overdue (with payment behavior anomaly detection)
  const moneyOnTable = activity.moneyOnTable;
  const overdue: OverdueSlot[] =
    moneyOnTable?.overdueInvoices.map((inv) => ({
      id: inv.id,
      company: inv.customerName,
      amount: formatMetricValue(inv.amount, "currency", currency),
      rawAmount: inv.amount,
      daysOverdue: inv.daysOverdue,
      isUnusual: inv.isUnusual,
      unusualReason: inv.unusualReason,
    })) ?? [];
  const largestOverdue =
    overdue.length > 0
      ? overdue.reduce((max, inv) =>
          inv.rawAmount > max.rawAmount ? inv : max,
        )
      : undefined;

  // Money on table - Drafts
  const drafts: DraftSlot[] =
    moneyOnTable?.draftInvoices.map((inv) => ({
      id: inv.id,
      company: inv.customerName,
      amount: formatMetricValue(inv.amount, "currency", currency),
      rawAmount: inv.amount,
    })) ?? [];

  // Activity context
  const activityContext = activity.context;

  // Year over year
  const yoy = context?.yearOverYear;
  let yoyRevenue: string | undefined;
  let yoyProfit: string | undefined;
  if (yoy?.hasComparison) {
    if (yoy.revenueChangePercent !== 0) {
      const dir = yoy.revenueChangePercent > 0 ? "up" : "down";
      yoyRevenue = `${dir} ${Math.abs(yoy.revenueChangePercent).toFixed(0)}% vs last year`;
    }
    if (yoy.profitChangePercent !== 0) {
      const dir = yoy.profitChangePercent > 0 ? "up" : "down";
      yoyProfit = `${dir} ${Math.abs(yoy.profitChangePercent).toFixed(0)}% vs last year`;
    }
  }

  // Quarter pace projection
  let quarterPace: string | undefined;
  const qp = context?.quarterPace;
  if (qp && qp.projectedRevenue > 0) {
    const projectedFormatted = formatMetricValue(
      qp.projectedRevenue,
      "currency",
      currency,
    );
    if (qp.hasComparison && qp.vsLastYearPercent !== 0) {
      const dir = qp.vsLastYearPercent > 0 ? "ahead of" : "behind";
      const pct = Math.abs(qp.vsLastYearPercent);
      quarterPace = `On pace for ${projectedFormatted} this Q${qp.currentQuarter} — ${pct}% ${dir} Q${qp.currentQuarter} last year`;
    } else {
      quarterPace = `On pace for ${projectedFormatted} this Q${qp.currentQuarter}`;
    }
  }

  // Momentum
  const momentumCtx = context?.momentumContext;

  // Process expense anomalies - only significant spikes (>50% increase)
  const expenseSpikes: ExpenseSpikeSlot[] = (context?.expenseAnomalies ?? [])
    .filter(
      (ea) =>
        (ea.type === "category_spike" && ea.change >= 50) ||
        ea.type === "new_category",
    )
    .slice(0, 2) // Max 2 spikes for actions
    .map((ea) => ({
      category: ea.categoryName,
      amount: formatMetricValue(ea.currentAmount, "currency", currency),
      rawAmount: ea.currentAmount,
      change: Math.round(ea.change),
      tip: ea.tip,
    }));

  // Process revenue concentration warning
  const concentrationWarning: ConcentrationWarning | undefined =
    context?.revenueConcentration?.isConcentrated &&
    context.revenueConcentration.topCustomer
      ? {
          customerName: context.revenueConcentration.topCustomer.name,
          percentage: context.revenueConcentration.topCustomer.percentage,
          amount: formatMetricValue(
            context.revenueConcentration.topCustomer.revenue,
            "currency",
            currency,
          ),
        }
      : undefined;

  // Compute the week highlight (single most interesting thing)
  const highlight = computeHighlight({
    isPersonalBest,
    historicalContext,
    isRecovery: momentumCtx?.recovery?.isRecovery ?? false,
    recoveryDescription: momentumCtx?.recovery?.description,
    streak: activityContext?.streak,
    largestPayment: activity.largestPayment
      ? {
          customer: activity.largestPayment.customer,
          amount: formatMetricValue(
            activity.largestPayment.amount,
            "currency",
            currency,
          ),
        }
      : undefined,
    yoyProfit,
    profitChange,
    profitRaw,
    previousProfitRaw: profitMetric?.previousValue ?? 0,
    vsAverage: activityContext?.comparison?.description,
  });

  // Process anomalies into slots
  const anomalies: AnomalySlot[] = (context?.anomalies ?? []).map((a) => ({
    type: a.type,
    severity: a.severity,
    message: a.message,
  }));
  const hasAlerts = anomalies.some((a) => a.severity === "alert");
  const hasWarnings = anomalies.some((a) => a.severity === "warning");

  return {
    weekType,
    highlight,

    // Core financials
    profit: formatMetricValue(profitRaw, "currency", currency),
    profitRaw,
    revenue: formatMetricValue(revenueRaw, "currency", currency),
    revenueRaw,
    expenses: formatMetricValue(expensesRaw, "currency", currency),
    expensesRaw,
    margin: marginRaw.toFixed(1),
    marginRaw,
    runway: Math.round(runway),
    runwayExhaustionDate,
    cashFlow: formatMetricValue(cashFlowRaw, "currency", currency),
    cashFlowRaw,
    cashFlowExplanation,

    // Changes
    profitChange,
    profitDirection,
    profitChangeDescription,
    revenueChange,
    revenueDirection,

    // Historical
    historicalContext,
    isPersonalBest,

    // Overdue
    hasOverdue: overdue.length > 0,
    overdueTotal: formatMetricValue(
      moneyOnTable?.overdueInvoices.reduce((sum, inv) => sum + inv.amount, 0) ??
        0,
      "currency",
      currency,
    ),
    overdueCount: overdue.length,
    overdue,
    largestOverdue,

    // Drafts
    hasDrafts: drafts.length > 0,
    draftsTotal: formatMetricValue(
      moneyOnTable?.draftInvoices.reduce((sum, inv) => sum + inv.amount, 0) ??
        0,
      "currency",
      currency,
    ),
    draftsCount: drafts.length,
    drafts,

    // Expense spikes
    hasExpenseSpikes: expenseSpikes.length > 0,
    expenseSpikes,

    // Revenue concentration risk
    concentrationWarning,

    // Explicit anomaly warnings
    anomalies,
    hasAlerts,
    hasWarnings,

    // Activity (with pre-computed change descriptions from allMetrics)
    invoicesPaid: activity.invoicesPaid,
    invoicesSent: activity.invoicesSent,
    invoicesSentChange:
      context?.allMetrics?.invoices_sent?.changeDescription ?? undefined,
    hoursTracked: activity.hoursTracked,
    newCustomers: activity.newCustomers,
    largestPayment: activity.largestPayment
      ? {
          customer: activity.largestPayment.customer,
          amount: formatMetricValue(
            activity.largestPayment.amount,
            "currency",
            currency,
          ),
        }
      : undefined,

    // Context
    streak: activityContext?.streak
      ? {
          type: activityContext.streak.type,
          count: activityContext.streak.count,
          description: activityContext.streak.description,
        }
      : undefined,
    momentum: momentumCtx?.momentum,
    isRecovery: momentumCtx?.recovery?.isRecovery ?? false,
    recoveryDescription: momentumCtx?.recovery?.description,
    vsAverage: activityContext?.comparison?.description,

    // YoY
    yoyRevenue,
    yoyProfit,

    // Quarter pace
    quarterPace,

    // Predictions - forward-looking data for next week
    nextWeekInvoicesDue: context?.predictions?.invoicesDue
      ? {
          count: context.predictions.invoicesDue.count,
          amount: formatMetricValue(
            context.predictions.invoicesDue.totalAmount,
            "currency",
            currency,
          ),
        }
      : undefined,

    // Meta
    currency,
    periodLabel,
    periodType,

    // First insight detection
    isFirstInsight: (context?.weeksOfHistory ?? 0) === 0,
  };
}
