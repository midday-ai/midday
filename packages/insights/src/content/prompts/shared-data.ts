/**
 * Shared data extraction for all insight prompts
 *
 * This ensures consistency between summary, title, story, and audio.
 * All prompts use the same facts, just formatted differently.
 */

import type { InsightSlots } from "./slots";

/**
 * Extracted insight facts - the single source of truth
 * All prompts derive their content from these facts
 */
export type InsightFacts = {
  // Period
  periodLabel: string;
  currency: string;
  currencyWord: string;

  // Week classification
  weekType: "great" | "good" | "quiet" | "challenging";
  mood: "celebratory" | "positive" | "neutral" | "supportive";

  // Core financial status (semantic descriptions, not raw numbers)
  profitStatus: ProfitStatus;
  revenueStatus: RevenueStatus;
  expensesAmount: string | null; // formatted amount or null if 0
  expensesRaw: number;
  marginPercent: number | null; // null if not meaningful (no revenue)

  // Runway
  runway: RunwayStatus;

  // Changes vs last period (semantic, not percentages)
  profitChange: string | null; // "break-even this week", "up 20%", "loss decreased", etc.
  revenueChange: string | null; // "up 30%", "down 15%", "no revenue", etc.

  // Outstanding money
  overdue: OverdueStatus;
  drafts: DraftStatus;

  // Context and highlights
  historicalContext: string | null; // "Best week since October", etc.
  isPersonalBest: boolean;
  isRecovery: boolean;
  recoveryDescription: string | null;
  streak: { count: number; description: string } | null;

  // Year over year
  yoyRevenue: string | null;
  yoyProfit: string | null;
  quarterPace: string | null;

  // Activity
  largestPayment: {
    customer: string;
    amount: string;
    rawAmount: number;
  } | null;

  // Alerts/warnings
  hasAlerts: boolean;
  hasWarnings: boolean;
  alerts: string[];
  warnings: string[];

  // First insight flag
  isFirstInsight: boolean;
};

export type ProfitStatus =
  | { type: "profit"; amount: string; rawAmount: number }
  | { type: "loss"; amount: string; rawAmount: number }
  | { type: "break-even" }
  | { type: "no-activity" };

export type RevenueStatus =
  | { type: "revenue"; amount: string; rawAmount: number }
  | { type: "no-revenue" };

export type RunwayStatus = {
  months: number;
  exhaustionDate: string | null;
  isCritical: boolean; // < 2 months
  isLow: boolean; // < 3 months
};

export type OverdueStatus = {
  hasOverdue: boolean;
  count: number;
  total: string;
  totalRaw: number;
  largest: {
    company: string;
    amount: string;
    rawAmount: number;
    daysOverdue: number;
  } | null;
  invoices: Array<{
    id: string;
    company: string;
    amount: string;
    rawAmount: number;
    daysOverdue: number;
    isUnusual?: boolean;
    unusualReason?: string;
  }>;
};

export type DraftStatus = {
  hasDrafts: boolean;
  count: number;
  total: string;
  totalRaw: number;
  drafts: Array<{
    id: string;
    company: string;
    amount: string;
    rawAmount: number;
  }>;
};

/**
 * Get currency as spoken word
 */
function getCurrencyWord(currency: string): string {
  const currencyMap: Record<string, string> = {
    SEK: "kronor",
    NOK: "kroner",
    DKK: "kroner",
    USD: "dollars",
    EUR: "euros",
    GBP: "pounds",
    CHF: "francs",
    JPY: "yen",
  };
  return currencyMap[currency] || currency.toLowerCase();
}

/**
 * Determine the emotional tone based on the week's performance
 */
function computeMood(
  slots: InsightSlots,
): "celebratory" | "positive" | "neutral" | "supportive" {
  // Always be supportive for challenging weeks (losses, no revenue, critical runway)
  if (slots.weekType === "challenging") return "supportive";

  if (slots.isPersonalBest || slots.weekType === "great") return "celebratory";

  // Only positive if there's actual profit and it's growing
  // (don't be positive about going from loss to zero)
  if (
    slots.isRecovery ||
    (slots.profitChange > 20 && slots.profitRaw > 0) ||
    slots.weekType === "good"
  ) {
    return "positive";
  }

  if (slots.weekType === "quiet") {
    return "supportive";
  }

  return "neutral";
}

/**
 * Extract all facts from slots - single source of truth
 */
export function extractFacts(slots: InsightSlots): InsightFacts {
  // Determine profit status
  let profitStatus: ProfitStatus;
  if (slots.profitRaw > 0) {
    profitStatus = {
      type: "profit",
      amount: slots.profit,
      rawAmount: slots.profitRaw,
    };
  } else if (slots.profitRaw < 0) {
    profitStatus = {
      type: "loss",
      amount: slots.profit.replace("-", ""), // Remove negative sign for display
      rawAmount: Math.abs(slots.profitRaw),
    };
  } else if (slots.revenueRaw === 0 && slots.expensesRaw === 0) {
    profitStatus = { type: "no-activity" };
  } else {
    profitStatus = { type: "break-even" };
  }

  // Determine revenue status
  const revenueStatus: RevenueStatus =
    slots.revenueRaw > 0
      ? { type: "revenue", amount: slots.revenue, rawAmount: slots.revenueRaw }
      : { type: "no-revenue" };

  // Runway status
  const runway: RunwayStatus = {
    months: slots.runway,
    exhaustionDate: slots.runwayExhaustionDate || null,
    isCritical: slots.runway < 2,
    isLow: slots.runway < 3,
  };

  // Overdue status
  const overdue: OverdueStatus = {
    hasOverdue: slots.hasOverdue,
    count: slots.overdueCount,
    total: slots.overdueTotal,
    totalRaw: slots.overdue.reduce((sum, inv) => sum + inv.rawAmount, 0),
    largest: slots.largestOverdue
      ? {
          company: slots.largestOverdue.company,
          amount: slots.largestOverdue.amount,
          rawAmount: slots.largestOverdue.rawAmount,
          daysOverdue: slots.largestOverdue.daysOverdue,
        }
      : null,
    invoices: slots.overdue.map((inv) => ({
      id: inv.id,
      company: inv.company,
      amount: inv.amount,
      rawAmount: inv.rawAmount,
      daysOverdue: inv.daysOverdue,
      isUnusual: inv.isUnusual,
      unusualReason: inv.unusualReason,
    })),
  };

  // Draft status
  const drafts: DraftStatus = {
    hasDrafts: slots.hasDrafts,
    count: slots.draftsCount,
    total: slots.draftsTotal,
    totalRaw: slots.drafts.reduce((sum, d) => sum + d.rawAmount, 0),
    drafts: slots.drafts.map((d) => ({
      id: d.id,
      company: d.company,
      amount: d.amount,
      rawAmount: d.rawAmount,
    })),
  };

  // Profit change - use semantic description
  let profitChange: string | null = null;
  if (
    Math.abs(slots.profitChange) >= 5 &&
    slots.profitChangeDescription &&
    slots.profitChangeDescription !== "flat vs last week"
  ) {
    profitChange = slots.profitChangeDescription;
  }

  // Revenue change
  let revenueChange: string | null = null;
  if (slots.revenueRaw === 0) {
    revenueChange = "no revenue this week";
  } else if (Math.abs(slots.revenueChange) >= 15) {
    const direction = slots.revenueChange > 0 ? "up" : "down";
    revenueChange = `${direction} ${Math.abs(Math.round(slots.revenueChange))}%`;
  }

  // Extract alerts and warnings (handle undefined anomalies for eval tests)
  const anomalies = slots.anomalies ?? [];
  const alerts = anomalies
    .filter((a) => a.severity === "alert")
    .map((a) => a.message);
  const warnings = anomalies
    .filter((a) => a.severity === "warning")
    .map((a) => a.message);

  return {
    periodLabel: slots.periodLabel,
    currency: slots.currency,
    currencyWord: getCurrencyWord(slots.currency),

    weekType: slots.weekType,
    mood: computeMood(slots),

    profitStatus,
    revenueStatus,
    expensesAmount: slots.expensesRaw > 0 ? slots.expenses : null,
    expensesRaw: slots.expensesRaw,
    marginPercent: slots.revenueRaw > 0 ? slots.marginRaw : null,

    runway,

    profitChange,
    revenueChange,

    overdue,
    drafts,

    historicalContext: slots.historicalContext || null,
    isPersonalBest: slots.isPersonalBest,
    isRecovery: slots.isRecovery,
    recoveryDescription: slots.recoveryDescription || null,
    streak: slots.streak
      ? { count: slots.streak.count, description: slots.streak.description }
      : null,

    yoyRevenue: slots.yoyRevenue || null,
    yoyProfit: slots.yoyProfit || null,
    quarterPace: slots.quarterPace || null,

    largestPayment: slots.largestPayment
      ? {
          customer: slots.largestPayment.customer,
          amount: slots.largestPayment.amount,
          rawAmount: Number.parseFloat(
            slots.largestPayment.amount.replace(/[^0-9.-]/g, ""),
          ),
        }
      : null,

    hasAlerts: slots.hasAlerts ?? false,
    hasWarnings: slots.hasWarnings ?? false,
    alerts,
    warnings,

    isFirstInsight: slots.isFirstInsight ?? false,
  };
}

/**
 * Get the primary headline fact (what leads the insight)
 */
export function getHeadlineFact(facts: InsightFacts): string {
  // Personal best always leads
  if (facts.isPersonalBest && facts.historicalContext) {
    return facts.historicalContext;
  }

  // Recovery story
  if (facts.isRecovery && facts.recoveryDescription) {
    return facts.recoveryDescription;
  }

  // Streak
  if (facts.streak && facts.streak.count >= 3) {
    return facts.streak.description;
  }

  // No activity
  if (facts.profitStatus.type === "no-activity") {
    return "No financial activity this week";
  }

  // Break-even after loss
  if (facts.profitStatus.type === "break-even") {
    return "Break-even this week";
  }

  // Loss
  if (facts.profitStatus.type === "loss") {
    return `${facts.profitStatus.amount} loss this week`;
  }

  // Profit
  if (facts.profitStatus.type === "profit") {
    return `${facts.profitStatus.amount} profit this week`;
  }

  return facts.periodLabel;
}

/**
 * Get the primary action to highlight
 */
export function getPrimaryAction(
  facts: InsightFacts,
): { description: string; company?: string; amount: string } | null {
  // Priority 1: Overdue invoices
  if (facts.overdue.hasOverdue && facts.overdue.largest) {
    return {
      description: `Collect ${facts.overdue.largest.amount} overdue from ${facts.overdue.largest.company}`,
      company: facts.overdue.largest.company,
      amount: facts.overdue.largest.amount,
    };
  }

  // Priority 2: Drafts
  if (facts.drafts.hasDrafts && facts.drafts.drafts.length > 0) {
    const topDraft = facts.drafts.drafts.reduce((max, d) =>
      d.rawAmount > max.rawAmount ? d : max,
    );
    return {
      description: `Send the ${topDraft.amount} draft to ${topDraft.company}`,
      company: topDraft.company,
      amount: topDraft.amount,
    };
  }

  return null;
}

/**
 * Get tone guidance for prompts based on mood
 */
export function getToneGuidanceFromFacts(facts: InsightFacts): string {
  switch (facts.mood) {
    case "celebratory":
      return "Sound confident and pleased, but understated. Let the numbers speak for themselves.";
    case "positive":
      return "Sound calm and assured. Acknowledge progress without overstating.";
    case "supportive":
      return "Sound steady and pragmatic. Focus on actionable next steps.";
    default:
      return "Sound clear and informative.";
  }
}

/**
 * Format a number for natural speech
 */
export function formatNumberForSpeech(value: number): string {
  const rounded = Math.round(value);

  if (rounded < 1000) {
    return rounded.toString();
  }

  if (rounded < 10000) {
    const thousands = Math.floor(rounded / 1000);
    const hundreds = Math.round((rounded % 1000) / 100) * 100;
    if (hundreds > 0) {
      return `${thousands} thousand ${hundreds}`;
    }
    return `${thousands} thousand`;
  }

  if (rounded < 100000) {
    const thousands = Math.round(rounded / 1000);
    return `${thousands} thousand`;
  }

  if (rounded < 1000000) {
    const hundreds = Math.round(rounded / 1000);
    return `${hundreds} thousand`;
  }

  const millions = (rounded / 1000000).toFixed(1);
  return `${millions} million`;
}

/**
 * Get profit description for prompts (written format)
 */
export function getProfitDescription(facts: InsightFacts): string {
  switch (facts.profitStatus.type) {
    case "profit":
      return `${facts.profitStatus.amount} profit`;
    case "loss":
      return `${facts.profitStatus.amount} loss`;
    case "break-even":
      return "break-even (no profit or loss)";
    case "no-activity":
      return "no financial activity";
  }
}

/**
 * Get profit description for audio (spoken format)
 */
export function getProfitDescriptionSpoken(facts: InsightFacts): string {
  switch (facts.profitStatus.type) {
    case "profit":
      return `${formatNumberForSpeech(facts.profitStatus.rawAmount)} ${facts.currencyWord} profit`;
    case "loss":
      return `${formatNumberForSpeech(facts.profitStatus.rawAmount)} ${facts.currencyWord} loss`;
    case "break-even":
      return "break-even, no profit or loss";
    case "no-activity":
      return "no financial activity";
  }
}

/**
 * Get revenue description for prompts (written format)
 */
export function getRevenueDescription(facts: InsightFacts): string {
  if (facts.revenueStatus.type === "revenue") {
    return `${facts.revenueStatus.amount} revenue`;
  }
  return "no revenue";
}

/**
 * Get revenue description for audio (spoken format)
 */
export function getRevenueDescriptionSpoken(facts: InsightFacts): string {
  if (facts.revenueStatus.type === "revenue") {
    return `${formatNumberForSpeech(facts.revenueStatus.rawAmount)} ${facts.currencyWord} in revenue`;
  }
  return "no revenue";
}

/**
 * Get runway description with appropriate urgency
 */
export function getRunwayDescription(facts: InsightFacts): string {
  const { months, exhaustionDate, isCritical } = facts.runway;

  if (isCritical && exhaustionDate) {
    return `only ${months} month${months !== 1 ? "s" : ""} of runway until ${exhaustionDate}`;
  }

  if (exhaustionDate) {
    return `${months} months of runway (until ${exhaustionDate})`;
  }

  return `${months} months of runway`;
}

/**
 * Banned words for all prompts - prevents filler language
 */
export const BANNED_WORDS = [
  "solid",
  "healthy",
  "strong",
  "great",
  "robust",
  "excellent",
  "remarkable",
  "impressive",
  "amazing",
  "outstanding",
  "significant",
];

/**
 * Words to avoid when runway is critical (< 2 months)
 */
export const CRITICAL_RUNWAY_BANNED_WORDS = [
  "reassuring",
  "comfortable",
  "steady",
  "stable",
  "flexibility",
  "buffer",
  "cushion",
  "gives you time",
  "no rush",
];
