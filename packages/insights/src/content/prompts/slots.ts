import { formatMetricValue } from "../../metrics/calculator";
import type {
  ExpenseAnomaly,
  InsightActivity,
  InsightMetric,
  MomentumContext,
  PeriodType,
  PreviousPredictionsContext,
} from "../../types";
import type { YearOverYearContext } from "../generator";

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
  cashFlow: string;
  cashFlowRaw: number;

  // Changes vs last period
  profitChange: number;
  profitDirection: "up" | "down" | "flat";
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

  // Activity highlights
  invoicesPaid: number;
  invoicesSent: number;
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

  // 3. Significant streak (3+ weeks)
  if (data.streak && data.streak.count >= 3) {
    return { type: "streak", description: data.streak.description };
  }

  // 4. Big profit multiplier (3x or more vs last week)
  if (data.previousProfitRaw > 0 && data.profitRaw > 0) {
    const multiplier = data.profitRaw / data.previousProfitRaw;
    if (multiplier >= 3) {
      return { type: "profit_multiplier", multiplier: Math.round(multiplier) };
    }
  }

  // 5. YoY growth (significant)
  if (data.yoyProfit?.includes("up")) {
    return { type: "yoy_growth", description: `Profit ${data.yoyProfit}` };
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
    previousPredictions?: PreviousPredictionsContext;
    runwayMonths?: number;
    weeksOfHistory?: number;
    expenseAnomalies?: ExpenseAnomaly[];
    revenueConcentration?: {
      topCustomer: { name: string; revenue: number; percentage: number } | null;
      isConcentrated: boolean;
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
  const revenueRaw = revenueMetric?.value ?? 0;
  const expensesRaw = expensesMetric?.value ?? 0;
  const marginRaw =
    marginMetric?.value ??
    (revenueRaw > 0 ? (profitRaw / revenueRaw) * 100 : 0);
  const cashFlowRaw = cashFlowMetric?.value ?? 0;
  const runway = context?.runwayMonths ?? runwayMetric?.value ?? 0;

  // Changes
  const profitChange = profitMetric?.change ?? 0;
  const profitDirection = profitMetric?.changeDirection ?? "flat";
  const revenueChange = revenueMetric?.change ?? 0;
  const revenueDirection = revenueMetric?.changeDirection ?? "flat";

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

  // Money on table - Overdue
  const moneyOnTable = activity.moneyOnTable;
  const overdue: OverdueSlot[] =
    moneyOnTable?.overdueInvoices.map((inv) => ({
      id: inv.id,
      company: inv.customerName,
      amount: formatMetricValue(inv.amount, "currency", currency),
      rawAmount: inv.amount,
      daysOverdue: inv.daysOverdue,
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
    cashFlow: formatMetricValue(cashFlowRaw, "currency", currency),
    cashFlowRaw,

    // Changes
    profitChange,
    profitDirection,
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

    // Activity
    invoicesPaid: activity.invoicesPaid,
    invoicesSent: activity.invoicesSent,
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

    // Predictions
    nextWeekInvoicesDue: undefined, // TODO: Wire up predictions

    // Meta
    currency,
    periodLabel,
    periodType,

    // First insight detection
    isFirstInsight: (context?.weeksOfHistory ?? 0) === 0,
  };
}
