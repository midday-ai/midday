import { createLoggerWithContext } from "@midday/logger";
import { parseISO } from "date-fns";

const logger = createLoggerWithContext("matching");

export const CALIBRATION_LIMITS = {
  MAX_ADJUSTMENT: 0.03, // Max 3% threshold adjustment per calibration
  MIN_SAMPLES_AUTO: 5, // Minimum samples for auto-match calibration
  MIN_SAMPLES_SUGGESTED: 3, // Minimum samples for suggested-match calibration
  MIN_SAMPLES_CONSERVATIVE: 8, // Higher threshold for conservative adjustments
} as const;

// Type definitions for matching utilities
type AmountComparableItem = {
  amount: number | null;
  currency: string | null;
  baseAmount?: number | null;
  baseCurrency?: string | null;
};

export const COMMON_VAT_RATES = [
  0.05, 0.06, 0.07, 0.075, 0.08, 0.1, 0.12, 0.19, 0.2, 0.21, 0.22, 0.25,
] as const;

export type MatchType = "auto_matched" | "high_confidence" | "suggested";

type CrossCurrencyComparableItem = {
  amount?: number | null;
  currency?: string | null;
  baseAmount?: number | null;
  baseCurrency?: string | null;
};

// Helper functions for cross-currency matching
export function isCrossCurrencyMatch(
  item1: CrossCurrencyComparableItem,
  item2: CrossCurrencyComparableItem,
  tolerancePercent = 0.02,
  minTolerance = 15,
): boolean {
  // Must have different currencies
  if (!item1.currency || !item2.currency || item1.currency === item2.currency) {
    return false;
  }

  // Must have same base currency
  if (
    !item1.baseCurrency ||
    !item2.baseCurrency ||
    item1.baseCurrency !== item2.baseCurrency
  ) {
    return false;
  }

  // Must have base amounts
  if (!item1.baseAmount || !item2.baseAmount) {
    return false;
  }

  const baseAmount1 = Math.abs(item1.baseAmount);
  const baseAmount2 = Math.abs(item2.baseAmount);
  const difference = Math.abs(baseAmount1 - baseAmount2);
  const avgAmount = (baseAmount1 + baseAmount2) / 2;

  // Tiered tolerance based on amount size to balance accuracy and usability
  let adjustedTolerance: number;
  let toleranceCategory: string;
  let effectiveTolerancePercent: number;

  if (avgAmount < 100) {
    // Small amounts: More conservative (rounding errors, fees, small transactions)
    adjustedTolerance = Math.max(10, avgAmount * 0.04);
    toleranceCategory = "small";
    effectiveTolerancePercent = 0.04;
  } else if (avgAmount < 1000) {
    // Medium amounts: More conservative tolerance
    adjustedTolerance = Math.max(15, avgAmount * 0.02);
    toleranceCategory = "medium";
    effectiveTolerancePercent = 0.02;
  } else {
    // Large amounts: Very strict (exchange rate should be stable)
    adjustedTolerance = Math.max(25, avgAmount * 0.015);
    toleranceCategory = "large";
    effectiveTolerancePercent = 0.015;
  }

  const isMatch = difference < adjustedTolerance;
  const actualTolerancePercent = adjustedTolerance / avgAmount;

  // Enhanced logging with risk assessment
  logger.info("CROSS-CURRENCY MATCH DEBUG", {
    item1: {
      currency: item1.currency,
      amount: item1.amount,
      baseCurrency: item1.baseCurrency,
      baseAmount: item1.baseAmount,
    },
    item2: {
      currency: item2.currency,
      amount: item2.amount,
      baseCurrency: item2.baseCurrency,
      baseAmount: item2.baseAmount,
    },
    calculation: {
      baseAmount1,
      baseAmount2,
      difference,
      avgAmount,
      tolerance: adjustedTolerance,
      originalTolerancePercent: tolerancePercent,
      effectiveTolerancePercent,
      actualTolerancePercent,
      minTolerance,
    },
    riskAssessment: {
      amountCategory: toleranceCategory,
      isHighRisk: actualTolerancePercent > 0.1, // Flag >10% effective tolerance
      isConservative: actualTolerancePercent <= 0.05, // Flag ≤5% tolerance
      toleranceSource:
        adjustedTolerance ===
        Math.max(15, avgAmount * effectiveTolerancePercent)
          ? adjustedTolerance === 15 ||
            adjustedTolerance === 25 ||
            adjustedTolerance === 50
            ? "minimum"
            : "percentage"
          : "percentage",
    },
    result: isMatch,
  });

  return isMatch;
}

// Helper scoring functions
export function calculateAmountScore(
  item1: AmountComparableItem,
  item2: AmountComparableItem,
): number {
  const amount1 = item1.amount;
  const currency1 = item1.currency;
  const amount2 = item2.amount;
  const currency2 = item2.currency;

  if (!amount1 || !amount2) return 0.5;

  const absAmount1 = Math.abs(amount1);
  const absAmount2 = Math.abs(amount2);
  const maxAmount = Math.max(absAmount1, absAmount2);
  const percentageDiff = Math.abs(absAmount1 - absAmount2) / maxAmount;

  // Same-currency amount scoring with VAT-aware fallback.
  if (currency1 && currency2 && currency1 === currency2) {
    if (percentageDiff === 0) return 1.0;
    if (percentageDiff <= 0.01) return 0.98;
    if (percentageDiff <= 0.02) return 0.95;
    if (percentageDiff <= 0.05) return 0.85;
    if (percentageDiff <= 0.1) return 0.6;
    if (percentageDiff <= 0.2) return 0.3;

    const ratio = maxAmount / Math.max(Math.min(absAmount1, absAmount2), 1e-9);
    const ratioMinusOne = ratio - 1;
    for (const vatRate of COMMON_VAT_RATES) {
      if (Math.abs(ratioMinusOne - vatRate) <= 0.015) {
        return 0.88;
      }
    }

    return 0;
  }

  // Cross-currency scoring should primarily use base amounts.
  const baseAmount1 = item1.baseAmount ? Math.abs(item1.baseAmount) : null;
  const baseAmount2 = item2.baseAmount ? Math.abs(item2.baseAmount) : null;
  const baseCurrency1 = item1.baseCurrency;
  const baseCurrency2 = item2.baseCurrency;

  if (
    baseAmount1 &&
    baseAmount2 &&
    baseCurrency1 &&
    baseCurrency2 &&
    baseCurrency1 === baseCurrency2
  ) {
    const maxBaseAmount = Math.max(baseAmount1, baseAmount2);
    const avgBaseAmount = (baseAmount1 + baseAmount2) / 2;
    const basePercentageDiff =
      Math.abs(baseAmount1 - baseAmount2) / maxBaseAmount;

    if (basePercentageDiff === 0) return 1.0;

    if (avgBaseAmount >= 5000) {
      // Large cross-currency: tighter scoring — exchange rate spreads
      // should be minimal for large transfers.
      if (basePercentageDiff <= 0.015) return 0.95;
      if (basePercentageDiff <= 0.03) return 0.75;
      if (basePercentageDiff <= 0.05) return 0.5;
      if (basePercentageDiff <= 0.1) return 0.3;
      return 0;
    }

    if (basePercentageDiff <= 0.02) return 0.9;
    if (basePercentageDiff <= 0.05) return 0.8;
    if (basePercentageDiff <= 0.1) return 0.65;
    if (basePercentageDiff <= 0.15) return 0.45;
    if (basePercentageDiff <= 0.25) return 0.25;
    return 0;
  }

  // Fallback for cross-currency without usable base amounts.
  const ratio =
    Math.max(absAmount1, absAmount2) /
    Math.max(Math.min(absAmount1, absAmount2), 1e-9);
  if (ratio > 5) return 0.1;
  if (percentageDiff <= 0.05) return 0.7;
  if (percentageDiff <= 0.2) return 0.4;
  return 0.1;
}

export function calculateCurrencyScore(
  currency1?: string,
  currency2?: string,
  baseCurrency1?: string | null,
  baseCurrency2?: string | null,
): number {
  if (!currency1 || !currency2) return 0.5;

  // HIGHEST PRIORITY: Exact currency match
  if (currency1 === currency2) return 1.0;

  // Lower confidence, but still meaningful if both convert to same base currency.
  if (baseCurrency1 && baseCurrency2 && baseCurrency1 === baseCurrency2) {
    return 0.7;
  }

  return 0.3;
}

const COMPANY_SUFFIXES = new Set([
  "inc",
  "llc",
  "ltd",
  "ab",
  "gmbh",
  "pty",
  "co",
  "corp",
  "sa",
  "srl",
  "as",
  "oy",
  "oyj",
  "ag",
  "bv",
  "nv",
  "se",
  "plc",
  "pbc",
  "sarl",
  "oü",
  "ou",
  "ug",
  "kg",
  "mbh",
  "lda",
  "limited",
  "incorporated",
  "corporation",
]);

function normalizeNameTokens(name: string): string[] {
  if (!name) return [];
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[.,\-_'"()&]/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0 && !COMPANY_SUFFIXES.has(t));
}

/**
 * Scores name similarity between an inbox display name and a transaction name/merchant.
 * Uses multiple strategies: Jaccard token overlap, substring containment, and prefix matching.
 * Takes the best score from comparing against both transactionName and merchantName.
 */
export function calculateNameScore(
  inboxName: string | null | undefined,
  transactionName: string | null | undefined,
  merchantName: string | null | undefined,
  aliasScore?: number,
): number {
  if (!inboxName) return 0;

  const inboxTokens = normalizeNameTokens(inboxName);
  if (inboxTokens.length === 0) return 0;

  const scores: number[] = [];

  for (const compareName of [merchantName, transactionName]) {
    if (!compareName) continue;

    const compareTokens = normalizeNameTokens(compareName);
    if (compareTokens.length === 0) continue;

    const inboxSet = new Set(inboxTokens);
    const compareSet = new Set(compareTokens);
    const intersection = new Set(
      [...inboxSet].filter((t) => compareSet.has(t)),
    );
    const union = new Set([...inboxSet, ...compareSet]);

    if (union.size > 0) {
      scores.push(intersection.size / union.size);
    }

    // Containment: one name fully contained in the other
    const inboxJoined = inboxTokens.join(" ");
    const compareJoined = compareTokens.join(" ");
    if (
      inboxJoined.length >= 3 &&
      compareJoined.length >= 3 &&
      (inboxJoined.includes(compareJoined) ||
        compareJoined.includes(inboxJoined))
    ) {
      scores.push(0.85);
    }

    // Prefix match: first significant token matches
    if (
      inboxTokens[0] &&
      compareTokens[0] &&
      inboxTokens[0].length >= 3 &&
      inboxTokens[0] === compareTokens[0]
    ) {
      scores.push(0.6);
    }

    // Concatenated token match handles names like "ElevenLabs" vs "Eleven Labs".
    const inboxConcatenated = inboxTokens.join("");
    const compareConcatenated = compareTokens.join("");
    if (
      inboxConcatenated.length >= 4 &&
      compareConcatenated.length >= 4 &&
      (inboxConcatenated === compareConcatenated ||
        inboxConcatenated.includes(compareConcatenated) ||
        compareConcatenated.includes(inboxConcatenated))
    ) {
      scores.push(inboxConcatenated === compareConcatenated ? 0.95 : 0.8);
    }
  }

  if (typeof aliasScore === "number" && aliasScore > 0) {
    scores.push(aliasScore);
  }

  return scores.length > 0 ? Math.max(...scores) : 0;
}

type ScoreMatchInput = {
  nameScore: number;
  amountScore: number;
  dateScore: number;
  currencyScore: number;
  isSameCurrency: boolean;
  isExactAmount: boolean;
  declinePenalty?: number;
};

export function scoreMatch({
  nameScore,
  amountScore,
  dateScore,
  currencyScore,
  isSameCurrency,
  isExactAmount,
  declinePenalty = 0,
}: ScoreMatchInput): number {
  // Cross-currency with a strong name match: the vendor is already identified,
  // so amount differences are mostly FX noise. Shift weight toward date to
  // disambiguate recurring charges from different months.
  const isCrossCurrencyKnownVendor = !isSameCurrency && nameScore >= 0.8;
  const amountWeight = isCrossCurrencyKnownVendor ? 20 : 30;
  const dateWeight = isCrossCurrencyKnownVendor ? 25 : 15;
  const totalWeight = 10 + amountWeight + dateWeight + 5;

  const weightedBase =
    (nameScore * 10 +
      amountScore * amountWeight +
      dateScore * dateWeight +
      currencyScore * 5) /
    totalWeight;

  let confidence = weightedBase;

  if (isExactAmount && nameScore >= 0.5 && dateScore >= 0.7) {
    confidence = Math.max(confidence, 0.92);
  } else if (isExactAmount && nameScore >= 0.3 && dateScore >= 0.5) {
    confidence = Math.max(confidence, 0.85);
  } else if (isExactAmount && isSameCurrency && dateScore >= 0.6) {
    confidence = Math.max(confidence, 0.78);
  }

  // Cross-currency additive boost instead of a hard floor — preserves the
  // natural score spread so date can still discriminate between months.
  if (
    !isSameCurrency &&
    nameScore >= 0.5 &&
    amountScore >= 0.6 &&
    dateScore >= 0.3
  ) {
    confidence = Math.max(confidence, confidence + 0.05);
  }

  if (nameScore === 0) {
    confidence *= 0.55;
  }

  if (dateScore < 0.2) {
    confidence *= 0.65;
  }

  if (declinePenalty > 0) {
    confidence -= declinePenalty;
  }

  return Math.max(0, Math.min(1, confidence));
}

export function calculateDateScore(
  inboxDate: string,
  transactionDate: string,
  inboxType?: string | null,
): number {
  const inboxDateObj = parseISO(inboxDate);
  const transactionDateObj = parseISO(transactionDate);

  const diffDays = Math.abs(
    (inboxDateObj.getTime() - transactionDateObj.getTime()) /
      (1000 * 60 * 60 * 24),
  );

  // Signed difference: positive = transaction AFTER inbox date, negative = transaction BEFORE inbox date
  const signedDiffDays =
    (transactionDateObj.getTime() - inboxDateObj.getTime()) /
    (1000 * 60 * 60 * 24);

  const type = inboxType || "expense"; // Default to expense if not specified

  if (type === "invoice") {
    // INVOICE LOGIC: Payment usually comes AFTER invoice date
    // Account for 3-day open banking delay
    if (signedDiffDays > 0) {
      // Common payment terms with tolerance (adjusted for 3-day banking delay)
      if (signedDiffDays >= 24 && signedDiffDays <= 38) return 0.98; // Net 30 (27-35 days + 3-day delay)
      if (signedDiffDays >= 55 && signedDiffDays <= 68) return 0.96; // Net 60 (58-65 days + 3-day delay)
      if (signedDiffDays >= 85 && signedDiffDays <= 98) return 0.94; // Net 90 (88-95 days + 3-day delay)
      if (signedDiffDays >= 10 && signedDiffDays <= 20) return 0.95; // Net 15 (13-17 days + 3-day delay)
      if (signedDiffDays >= 3 && signedDiffDays <= 11) return 0.93; // Net 7 (6-8 days + 3-day delay)

      // Immediate payment (accounting for banking delay)
      if (signedDiffDays <= 6) return 0.99; // 0-3 days + 3-day banking delay

      // Extended payment terms (up to 120 days + delay)
      if (signedDiffDays <= 123)
        return Math.max(0.7, 0.9 - (signedDiffDays - 33) * 0.002);
    }
    // Payment BEFORE invoice (advance payment, accounting for delay)
    else if (signedDiffDays >= -10) {
      return 0.85; // Lower score for advance payments (extended for banking delay)
    }
  } else {
    // EXPENSE LOGIC: Receipt usually comes AFTER transaction
    // Account for 3-day banking delay - transaction appears 3 days after it actually happened
    if (signedDiffDays < 0) {
      // Transaction happened BEFORE receipt (normal expense flow)
      const absDays = Math.abs(signedDiffDays);
      // Adjust for banking delay - transaction actually happened ~3 days earlier
      const adjustedDays = absDays + 3;

      if (adjustedDays <= 4) return 0.99; // Same day or next day (accounting for delay)
      if (adjustedDays <= 10) return 0.95; // Within a week (accounting for delay)
      if (adjustedDays <= 33) return 0.9; // Within a month (accounting for delay)
      if (adjustedDays <= 63) return 0.8; // Within 2 months (accounting for delay)
      if (adjustedDays <= 93) return 0.7; // Very late receipt (accounting for delay)
    }
    // Receipt BEFORE transaction (less common - but account for banking delay)
    else if (signedDiffDays <= 10) {
      // Receipt up to 10 days before transaction date (accounting for 3-day delay + some tolerance)
      return 0.85; // Could be normal timing with banking delay
    }
  }

  // Standard proximity scoring
  if (diffDays === 0) return 1.0;
  if (diffDays <= 1) return 0.95;
  if (diffDays <= 3) return 0.85;
  if (diffDays <= 7) return 0.75;
  if (diffDays <= 14) return 0.6;
  if (diffDays <= 30) return Math.max(0.3, 1 - (diffDays / 30) * 0.7);

  return 0.1; // Very old = minimal score but not zero
}
