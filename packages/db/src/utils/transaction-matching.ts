import { createLoggerWithContext } from "@midday/logger";
import { parseISO } from "date-fns";

const logger = createLoggerWithContext("matching");

// Configuration constants
export const EMBEDDING_THRESHOLDS = {
  PERFECT_MATCH: 0.15, // Very similar embeddings
  STRONG_MATCH: 0.35, // Strong semantic similarity
  GOOD_MATCH: 0.45, // Moderate similarity (original value)
  WEAK_MATCH: 0.6, // Weak but possible match (original value)
} as const;

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

  // If both amounts are missing, return neutral score
  if (!amount1 || !amount2) return 0.5;

  // PRIORITY 1: Exact currency and amount match
  if (currency1 && currency2 && currency1 === currency2) {
    return calculateAmountDifferenceScore(amount1, amount2, "exact_currency");
  }

  // PRIORITY 2: Use base currency amounts if available and different currencies
  const baseAmount1 = item1.baseAmount;
  const baseCurrency1 = item1.baseCurrency;
  const baseAmount2 = item2.baseAmount;
  const baseCurrency2 = item2.baseCurrency;

  // If we have base amounts and they're in the same base currency, use those
  if (
    baseAmount1 &&
    baseAmount2 &&
    baseCurrency1 &&
    baseCurrency2 &&
    baseCurrency1 === baseCurrency2
  ) {
    // Enhanced base currency matching - more tolerant for cross-currency transactions
    const matchType =
      currency1 !== currency2 ? "cross_currency_base" : "base_currency";
    return calculateAmountDifferenceScore(baseAmount1, baseAmount2, matchType);
  }

  // PRIORITY 4: Different currencies, no base amount conversion available
  // Give partial credit but penalize for currency mismatch
  if (currency1 !== currency2) {
    // Additional check: if signs are different AND amounts are vastly different, this is likely wrong
    const sameSign =
      (amount1 > 0 && amount2 > 0) || (amount1 < 0 && amount2 < 0);
    const absAmount1 = Math.abs(amount1);
    const absAmount2 = Math.abs(amount2);
    const ratio =
      Math.max(absAmount1, absAmount2) / Math.min(absAmount1, absAmount2);

    // If opposite signs AND ratio > 5:1, this is very likely a false match
    if (!sameSign && ratio > 5) {
      return 0.1; // Very low score for suspicious cross-currency matches
    }

    const rawScore = calculateAmountDifferenceScore(
      amount1,
      amount2,
      "different_currency",
    );
    // Increased penalty for cross-currency matches that we can't properly convert
    return rawScore * 0.4; // 60% penalty for unresolved currency difference
  }

  // Fallback: same logic as before
  return calculateAmountDifferenceScore(amount1, amount2, "fallback");
}

function calculateAmountDifferenceScore(
  amount1: number,
  amount2: number,
  matchType:
    | "exact_currency"
    | "base_currency"
    | "cross_currency_base"
    | "team_base"
    | "different_currency"
    | "fallback",
): number {
  // Smart cross-perspective matching: only use absolute values for specific cases
  let useAbsoluteValues = false;

  // Handle invoice (positive) to payment (negative) scenarios
  // This applies to all match types, not just cross-currency
  const _sameSign =
    (amount1 > 0 && amount2 > 0) || (amount1 < 0 && amount2 < 0);
  const oppositeSigns =
    (amount1 > 0 && amount2 < 0) || (amount1 < 0 && amount2 > 0);

  // Use absolute values for opposite signs (invoice vs payment scenario)
  if (oppositeSigns) {
    useAbsoluteValues = true;
  }

  const compareAmount1 = useAbsoluteValues ? Math.abs(amount1) : amount1;
  const compareAmount2 = useAbsoluteValues ? Math.abs(amount2) : amount2;
  const diff = Math.abs(compareAmount1 - compareAmount2);
  const maxAmount = Math.max(
    Math.abs(compareAmount1),
    Math.abs(compareAmount2),
  );

  if (maxAmount === 0) return amount1 === amount2 ? 1 : 0;

  const percentageDiff = diff / maxAmount;

  // Adjust scoring based on match type
  let baseScore = 0;

  // Apply penalty for cross-perspective matching to reduce false positives
  let crossPerspectivePenalty = 1.0;
  if (useAbsoluteValues) {
    // Require tighter tolerance for opposite-sign matching
    // For cross-currency different-sign matches, be much more conservative
    if (matchType === "different_currency") {
      crossPerspectivePenalty = 0.3; // 70% penalty for cross-currency opposite signs
    } else {
      crossPerspectivePenalty = 0.7; // 30% penalty for same-currency opposite signs
    }
  }

  if (percentageDiff === 0) {
    baseScore = 1.0;
  } else if (percentageDiff <= 0.01) {
    // 1% tolerance
    baseScore = 0.98;
  } else if (percentageDiff <= 0.02) {
    // 2% tolerance
    baseScore = 0.95;
  } else if (percentageDiff <= 0.025) {
    // 2.5% tolerance
    baseScore = 0.92;
  } else if (percentageDiff <= 0.03) {
    // 3% tolerance
    baseScore = 0.9;
  } else if (percentageDiff <= 0.05) {
    // 5% tolerance
    baseScore = 0.85;
  } else if (percentageDiff <= 0.1) {
    // 10% tolerance
    baseScore = 0.6;
  } else if (percentageDiff <= 0.2) {
    // 20% tolerance
    baseScore = 0.3;
  } else {
    baseScore = 0;
  }

  // Apply bonuses/penalties based on match type
  switch (matchType) {
    case "exact_currency":
      // Bonus for exact currency match - this is the strongest signal
      return Math.min(1.0, baseScore * 1.1);

    case "base_currency":
    case "team_base":
      // Slight bonus for proper base currency conversion
      return Math.min(1.0, baseScore * 1.05);

    case "cross_currency_base":
      // Cross-currency but using base amounts - good conversion, apply cross-perspective penalty if needed
      return Math.min(1.0, baseScore * 1.03 * crossPerspectivePenalty);

    default:
      // For different_currency and fallback cases, apply cross-perspective penalty
      return baseScore * crossPerspectivePenalty;
  }
}

export function calculateCurrencyScore(
  currency1?: string,
  currency2?: string,
): number {
  if (!currency1 || !currency2) return 0.5;

  // HIGHEST PRIORITY: Exact currency match
  if (currency1 === currency2) return 1.0;

  // LOWER PRIORITY: Different currencies - be more conservative
  // Cross-currency matching should have lower confidence
  return 0.3; // Reduced from 0.5 to be more conservative
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
