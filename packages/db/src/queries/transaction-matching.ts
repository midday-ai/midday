import { createLoggerWithContext } from "@midday/logger";
import { parseISO } from "date-fns";
import type { Database } from "../client";
import {
  inbox,
  inboxEmbeddings,
  transactionAttachments,
  transactionEmbeddings,
  transactionMatchSuggestions,
  transactions,
} from "../schema";

const logger = createLoggerWithContext("matching");

import {
  and,
  cosineDistance,
  desc,
  eq,
  inArray,
  isNotNull,
  isNull,
  notExists,
  sql,
} from "drizzle-orm";
import {
  CALIBRATION_LIMITS,
  calculateAmountScore,
  calculateCurrencyScore,
  calculateDateScore,
  EMBEDDING_THRESHOLDS,
  isCrossCurrencyMatch,
} from "../utils/transaction-matching";

export type FindMatchesParams = {
  teamId: string;
  inboxId: string;
};

export type FindInboxMatchesParams = {
  teamId: string;
  transactionId: string;
};

export type MatchResult = {
  transactionId: string;
  name: string;
  amount: number;
  currency: string;
  date: string;
  embeddingScore: number;
  amountScore: number;
  currencyScore: number;
  dateScore: number;
  confidenceScore: number;
  matchType: "auto_matched" | "high_confidence" | "suggested";
  isAlreadyMatched: boolean;
};

export type InboxMatchResult = {
  inboxId: string;
  displayName: string | null;
  amount: number | null;
  currency: string | null;
  date: string;
  embeddingScore: number;
  amountScore: number;
  currencyScore: number;
  dateScore: number;
  confidenceScore: number;
  matchType: "auto_matched" | "high_confidence" | "suggested";
  isAlreadyMatched: boolean;
};

export type CreateMatchSuggestionParams = {
  teamId: string;
  inboxId: string;
  transactionId: string;
  confidenceScore: number;
  amountScore: number;
  currencyScore: number;
  dateScore: number;
  embeddingScore: number;

  matchType: "auto_matched" | "high_confidence" | "suggested";
  matchDetails: Record<string, any>;
  status?: "pending" | "confirmed" | "declined";
  userId?: string;
};

export type InboxSuggestion = {
  id: string;
  transactionId: string;
  transactionName: string;
  transactionAmount: number;
  transactionCurrency: string;
  transactionDate: string;
  confidenceScore: number;
  matchType: "auto_matched" | "high_confidence" | "suggested";
  status: "pending" | "confirmed" | "declined" | "expired";
};

// Suggestion calibration system - learns from user feedback to improve suggestion quality
export type TeamCalibrationData = {
  teamId: string;
  totalSuggestions: number;
  confirmedSuggestions: number;
  declinedSuggestions: number;
  unmatchedSuggestions: number; // Post-match negative feedback
  avgConfidenceConfirmed: number;
  avgConfidenceDeclined: number;
  avgConfidenceUnmatched: number; // Confidence of unmatched pairs
  suggestedMatchAccuracy: number;
  calibratedSuggestedThreshold: number;
  lastUpdated: string;
};

// Get team's suggestion calibration data and adjust suggestion threshold based on user feedback
export async function getTeamCalibration(
  db: Database,
  teamId: string,
): Promise<TeamCalibrationData> {
  // Default threshold for fallback
  const defaultSuggestedThreshold = 0.6;

  // Get historical performance data from last 90 days
  const performanceData = await db
    .select({
      matchType: transactionMatchSuggestions.matchType,
      status: transactionMatchSuggestions.status,
      confidenceScore: transactionMatchSuggestions.confidenceScore,
      createdAt: transactionMatchSuggestions.createdAt,
    })
    .from(transactionMatchSuggestions)
    .where(
      and(
        eq(transactionMatchSuggestions.teamId, teamId),
        inArray(transactionMatchSuggestions.status, [
          "confirmed",
          "declined",
          "unmatched",
        ]),
        // Only look at last 90 days for relevance
        sql`${transactionMatchSuggestions.createdAt} > NOW() - INTERVAL '90 days'`,
      ),
    );

  if (performanceData.length < 5) {
    // Not enough data - use default threshold
    return {
      teamId,
      totalSuggestions: performanceData.length,
      confirmedSuggestions: 0,
      declinedSuggestions: 0,
      unmatchedSuggestions: 0,
      avgConfidenceConfirmed: 0,
      avgConfidenceDeclined: 0,
      avgConfidenceUnmatched: 0,
      suggestedMatchAccuracy: 0,
      calibratedSuggestedThreshold: defaultSuggestedThreshold,
      lastUpdated: new Date().toISOString(),
    };
  }

  // Calculate performance metrics
  const confirmed = performanceData.filter((d) => d.status === "confirmed");
  const declined = performanceData.filter((d) => d.status === "declined");
  const unmatched = performanceData.filter((d) => d.status === "unmatched"); // Post-match negative feedback

  const avgConfidenceConfirmed =
    confirmed.length > 0
      ? confirmed.reduce((sum, d) => sum + Number(d.confidenceScore), 0) /
        confirmed.length
      : 0;

  const avgConfidenceDeclined =
    declined.length > 0
      ? declined.reduce((sum, d) => sum + Number(d.confidenceScore), 0) /
        declined.length
      : 0;

  // Include unmatched feedback in confidence analysis (these were wrong matches)
  const avgConfidenceUnmatched =
    unmatched.length > 0
      ? unmatched.reduce((sum, d) => sum + Number(d.confidenceScore), 0) /
        unmatched.length
      : 0;

  // Treat "unmatched" as negative feedback (like declined)
  const negativeOutcomes = [...declined, ...unmatched];
  const avgConfidenceNegative =
    negativeOutcomes.length > 0
      ? negativeOutcomes.reduce(
          (sum, d) => sum + Number(d.confidenceScore),
          0,
        ) / negativeOutcomes.length
      : avgConfidenceDeclined; // Fallback to declined-only average

  const suggestedMatchAccuracy =
    performanceData.length > 0 ? confirmed.length / performanceData.length : 0;

  // Calibrate suggestion threshold based on performance
  // Note: Auto-match threshold is now fixed - merchant patterns handle auto-matching decisions
  let calibratedSuggestedThreshold = defaultSuggestedThreshold;

  // Suggested match threshold - responsive to user feedback with globally reduced sample requirements
  if (
    suggestedMatchAccuracy > 0.9 &&
    confirmed.length >= CALIBRATION_LIMITS.MIN_SAMPLES_CONSERVATIVE
  ) {
    // Excellent user acceptance - suggest more aggressively
    const adjustment = Math.min(CALIBRATION_LIMITS.MAX_ADJUSTMENT, 0.03);
    calibratedSuggestedThreshold = Math.max(
      0.65,
      defaultSuggestedThreshold - adjustment,
    );
  } else if (
    suggestedMatchAccuracy > 0.8 &&
    confirmed.length >= CALIBRATION_LIMITS.MIN_SAMPLES_SUGGESTED
  ) {
    // Good user acceptance - slight improvement
    const adjustment = Math.min(CALIBRATION_LIMITS.MAX_ADJUSTMENT, 0.02);
    calibratedSuggestedThreshold = Math.max(
      0.67,
      defaultSuggestedThreshold - adjustment,
    );
  } else if (
    suggestedMatchAccuracy < 0.3 &&
    declined.length >= CALIBRATION_LIMITS.MIN_SAMPLES_SUGGESTED
  ) {
    // Poor acceptance - be more selective
    const adjustment = Math.min(CALIBRATION_LIMITS.MAX_ADJUSTMENT, 0.03);
    calibratedSuggestedThreshold = Math.min(
      0.85,
      defaultSuggestedThreshold + adjustment,
    );
  }

  // Confidence gap analysis - conservative learning from score patterns (including unmatch feedback)
  if (
    avgConfidenceConfirmed > 0 &&
    avgConfidenceNegative > 0 &&
    confirmed.length >= CALIBRATION_LIMITS.MIN_SAMPLES_SUGGESTED
  ) {
    const confidenceGap = avgConfidenceConfirmed - avgConfidenceNegative;

    if (confidenceGap > 0.2) {
      // Very clear separation - be more aggressive but conservatively
      const adjustment = Math.min(CALIBRATION_LIMITS.MAX_ADJUSTMENT, 0.025);
      calibratedSuggestedThreshold = Math.max(
        0.65,
        calibratedSuggestedThreshold - adjustment,
      );
    } else if (confidenceGap < 0.08) {
      // Poor separation - user can't distinguish good from bad matches
      const adjustment = Math.min(CALIBRATION_LIMITS.MAX_ADJUSTMENT, 0.02);
      calibratedSuggestedThreshold = Math.min(
        0.82,
        calibratedSuggestedThreshold + adjustment,
      );
    }
  }

  // Volume-based adjustments - conservative engagement-based tuning
  if (confirmed.length > 25 && suggestedMatchAccuracy > 0.8) {
    // High engagement team with good accuracy - slightly more aggressive
    const adjustment = Math.min(CALIBRATION_LIMITS.MAX_ADJUSTMENT, 0.015);
    calibratedSuggestedThreshold = Math.max(
      0.67,
      calibratedSuggestedThreshold - adjustment,
    );
  }

  if (negativeOutcomes.length > 20 && suggestedMatchAccuracy < 0.7) {
    // High negative feedback volume (declined + unmatched) with poor accuracy - be more conservative
    const adjustment = Math.min(CALIBRATION_LIMITS.MAX_ADJUSTMENT, 0.025);
    calibratedSuggestedThreshold = Math.min(
      0.85,
      calibratedSuggestedThreshold + adjustment,
    );
  }

  return {
    teamId,
    totalSuggestions: performanceData.length,
    confirmedSuggestions: confirmed.length,
    declinedSuggestions: declined.length,
    unmatchedSuggestions: unmatched.length,
    avgConfidenceConfirmed,
    avgConfidenceDeclined,
    avgConfidenceUnmatched,
    suggestedMatchAccuracy,
    calibratedSuggestedThreshold,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Semantic merchant pattern analysis - find similar merchant patterns using embeddings
 *
 * This function analyzes historical match patterns for semantically similar merchants
 * to determine if auto-matching should be enabled for a specific merchant pair.
 *
 * Requirements for auto-matching:
 * - At least 3 confirmed matches for similar merchant patterns
 * - 90%+ accuracy rate (confirmed vs declined/unmatched)
 * - Maximum 1 negative signal (declined or unmatched)
 * - Average confidence >= 85%
 * - Patterns within last 6 months
 */
async function findSimilarMerchantPatterns(
  db: Database,
  teamId: string,
  inboxEmbedding: number[],
  transactionEmbedding: number[],
): Promise<{
  canAutoMatch: boolean;
  confidence: number;
  historicalAccuracy: number;
  matchCount: number;
  reason: string;
}> {
  // Find historically similar matches using embedding similarity
  // This leverages existing embedding infrastructure
  const historicalMatches = await db
    .select({
      status: transactionMatchSuggestions.status,
      confidenceScore: transactionMatchSuggestions.confidenceScore,
      embeddingScore: transactionMatchSuggestions.embeddingScore,
      createdAt: transactionMatchSuggestions.createdAt,
    })
    .from(transactionMatchSuggestions)
    .innerJoin(
      inboxEmbeddings,
      eq(transactionMatchSuggestions.inboxId, inboxEmbeddings.inboxId),
    )
    .innerJoin(
      transactionEmbeddings,
      eq(
        transactionMatchSuggestions.transactionId,
        transactionEmbeddings.transactionId,
      ),
    )
    .where(
      and(
        eq(transactionMatchSuggestions.teamId, teamId),
        inArray(transactionMatchSuggestions.status, [
          "confirmed",
          "declined",
          "unmatched",
        ]),
        isNotNull(inboxEmbeddings.embedding),
        isNotNull(transactionEmbeddings.embedding),
        // Find semantically similar inbox items (same merchant)
        sql`${cosineDistance(inboxEmbeddings.embedding, inboxEmbedding)} < 0.15`,
        // Find semantically similar transactions (same merchant)
        sql`${cosineDistance(transactionEmbeddings.embedding, transactionEmbedding)} < 0.15`,
        // Only recent history (last 6 months)
        sql`${transactionMatchSuggestions.createdAt} > NOW() - INTERVAL '6 months'`,
      ),
    )
    .orderBy(desc(transactionMatchSuggestions.createdAt))
    .limit(20);

  if (historicalMatches.length < 3) {
    return {
      canAutoMatch: false,
      confidence: 0,
      historicalAccuracy: 0,
      matchCount: 0,
      reason: `insufficient_history_${historicalMatches.length}`,
    };
  }

  // Analyze the pattern
  const confirmed = historicalMatches.filter((m) => m.status === "confirmed");
  const negative = historicalMatches.filter(
    (m) => m.status === "declined" || m.status === "unmatched",
  );

  const accuracy = confirmed.length / historicalMatches.length;
  const avgConfidence =
    confirmed.length > 0
      ? confirmed.reduce((sum, m) => sum + Number(m.confidenceScore), 0) /
        confirmed.length
      : 0;

  // Conservative criteria for auto-matching
  const canAutoMatch =
    confirmed.length >= 3 && // At least 3 confirmations
    accuracy >= 0.9 && // 90%+ accuracy
    negative.length <= 1 && // Max 1 negative signal
    avgConfidence >= 0.85 && // Good average confidence
    historicalMatches.length >= 3; // Ensure minimum sample size

  return {
    canAutoMatch,
    confidence: avgConfidence,
    historicalAccuracy: accuracy,
    matchCount: confirmed.length,
    reason: canAutoMatch
      ? `eligible_${confirmed.length}_matches_${(accuracy * 100).toFixed(0)}pct_accuracy`
      : `ineligible_${confirmed.length}_matches_${(accuracy * 100).toFixed(0)}pct_accuracy_${negative.length}_negative`,
  };
}

// Core matching algorithm - find best transaction match for inbox item
export async function findMatches(
  db: Database,
  params: FindMatchesParams,
): Promise<MatchResult | null> {
  const { teamId, inboxId } = params;

  // Get team-specific calibrated thresholds based on user feedback
  const calibration = await getTeamCalibration(db, teamId);

  // Log calibration for debugging - only when suggestion threshold is adjusted
  const thresholdAdjusted = calibration.calibratedSuggestedThreshold !== 0.6;

  if (thresholdAdjusted) {
    logger.info("🔧 SUGGESTION CALIBRATION ACTIVE", {
      teamId,
      originalSuggestedThreshold: 0.6,
      calibratedSuggestedThreshold: calibration.calibratedSuggestedThreshold,
      autoMatchThreshold: 0.9, // Fixed - no longer calibrated
      adjustmentReason: `Based on ${calibration.totalSuggestions} past suggestions (${calibration.confirmedSuggestions} confirmed, ${calibration.declinedSuggestions} declined). Accuracy: ${(calibration.suggestedMatchAccuracy * 100).toFixed(1)}%`,
      note: "Auto-matching uses merchant-specific patterns, not global calibration",
      totalSuggestions: calibration.totalSuggestions,
      suggestedMatchAccuracy: calibration.suggestedMatchAccuracy,
    });
  }

  // Conservative production weights - require stronger semantic validation for same-currency matches
  const teamWeights = {
    embeddingWeight: 0.5, // Increased: Require stronger semantic similarity to prevent false matches
    amountWeight: 0.35, // Keep financial accuracy high - critical for correctness
    currencyWeight: 0.1, // Reduced: Currency match is less meaningful when most transactions use same currency
    dateWeight: 0.05, // Supporting signal for temporal alignment
    autoMatchThreshold: 0.9, // Fixed conservative threshold - proven merchants bypass the 85% cap
    suggestedMatchThreshold: Math.max(
      0.75,
      calibration.calibratedSuggestedThreshold,
    ), // HIGHER threshold: Be more conservative for suggestions
  };

  // Get inbox item with embedding
  const inboxData = await db
    .select({
      id: inbox.id,
      displayName: inbox.displayName,
      amount: inbox.amount,
      currency: inbox.currency,
      baseAmount: inbox.baseAmount,
      baseCurrency: inbox.baseCurrency,
      date: inbox.date,
      embedding: inboxEmbeddings.embedding,
      website: inbox.website,
      type: inbox.type,
    })
    .from(inbox)
    .leftJoin(inboxEmbeddings, eq(inbox.id, inboxEmbeddings.inboxId))
    .where(and(eq(inbox.id, inboxId), eq(inbox.teamId, teamId)))
    .limit(1);

  if (!inboxData.length) {
    logger.warn("INBOX ITEM MISSING", {
      inboxId,
      teamId,
      inboxDataLength: inboxData.length,
    });
    return null;
  }

  const inboxItem = inboxData[0]!;

  // Require inbox embedding for quality matching
  if (!inboxItem.embedding) {
    logger.warn("INBOX EMBEDDING MISSING - skipping match", {
      inboxId,
      teamId,
      displayName: inboxItem.displayName,
    });
    return null;
  }

  // Require actual document date for meaningful matching
  if (!inboxItem.date) {
    logger.warn("INBOX DATE MISSING - skipping match", {
      inboxId,
      teamId,
      displayName: inboxItem.displayName,
    });
    return null;
  }

  // Log the matched inbox item details
  logger.info(
    `INBOX: ${inboxItem.displayName} | ${inboxItem.amount} ${inboxItem.currency} | ${inboxItem.date} | ${inboxItem.type} | embedding: ${!!inboxItem.embedding}`,
    { teamId, inboxId },
  );

  // Pre-calculate all complex matching parameters in JavaScript
  const inboxAmount = inboxItem.amount || 0;
  const inboxBaseAmount = inboxItem.baseAmount || 0;
  const inboxCurrency = inboxItem.currency || "";
  const inboxBaseCurrency = inboxItem.baseCurrency || "";
  const inboxType = inboxItem.type || "expense";

  // Tier tolerance calculations
  const tier2Tolerance = Math.max(50, inboxAmount * 0.1);
  const tier3Tolerance = Math.max(100, inboxAmount * 0.2);

  // Perfect match date ranges (account for 3-day banking delay)
  const perfectExpenseStart = "93 days";
  const perfectExpenseEnd = "10 days";
  const perfectInvoiceStart = "10 days";
  const perfectInvoiceEnd = "123 days";

  // Semantic match date ranges (moderate ranges)
  const semanticExpenseStart = "63 days";
  const semanticExpenseEnd = "17 days";
  const semanticInvoiceStart = "17 days";
  const semanticInvoiceEnd = "93 days";

  // Conservative date ranges
  const conservativeStart = "33 days";
  const conservativeEnd = "48 days";

  // FINAL SOLUTION: Split complex query into separate simple queries to avoid PostgreSQL limits
  // This maintains all sophisticated matching logic while staying within PostgreSQL's capabilities

  const candidateTransactions: any[] = [];

  try {
    // QUERY 1: Perfect financial matches (exact amount + currency)
    const perfectMatches = await db
      .select({
        transactionId: transactions.id,
        name: transactions.name,
        amount: transactions.amount,
        currency: transactions.currency,
        baseAmount: transactions.baseAmount,
        baseCurrency: transactions.baseCurrency,
        date: transactions.date,
        counterpartyName: transactions.counterpartyName,
        merchantName: transactions.merchantName,
        description: transactions.description,
        recurring: transactions.recurring,
        embeddingScore:
          sql<number>`(${inboxEmbeddings.embedding} <-> ${transactionEmbeddings.embedding})`.as(
            "embedding_score",
          ),
        embedding: sql<number[] | null>`${transactionEmbeddings.embedding}`.as(
          "embedding",
        ),
        isAlreadyMatched: sql<boolean>`false`,
      })
      .from(transactions)
      .innerJoin(
        transactionEmbeddings,
        and(
          eq(transactions.id, transactionEmbeddings.transactionId),
          isNotNull(transactionEmbeddings.embedding),
        ),
      )
      .innerJoin(
        inboxEmbeddings,
        and(
          eq(inboxEmbeddings.inboxId, inboxId),
          isNotNull(inboxEmbeddings.embedding),
        ),
      )
      .where(
        and(
          eq(transactions.teamId, teamId),
          eq(transactions.status, "posted"),
          // Only match transactions that have an actual date
          isNotNull(transactions.date),
          // Exclude transactions that already have pending suggestions
          notExists(
            db
              .select({ id: transactionMatchSuggestions.id })
              .from(transactionMatchSuggestions)
              .where(
                and(
                  eq(
                    transactionMatchSuggestions.transactionId,
                    transactions.id,
                  ),
                  eq(transactionMatchSuggestions.teamId, teamId),
                  eq(transactionMatchSuggestions.status, "pending"),
                ),
              ),
          ),
          // Perfect financial matches with both regular and base currency options
          sql`(
            (ABS(ABS(${transactions.amount}) - ABS(${inboxAmount})) < 0.01 
             AND ${transactions.currency} = ${inboxCurrency}
             AND (${inboxEmbeddings.embedding} <-> ${transactionEmbeddings.embedding}) < ${EMBEDDING_THRESHOLDS.WEAK_MATCH})
            OR
                         (ABS(ABS(COALESCE(${transactions.baseAmount}, 0)) - ABS(${inboxBaseAmount})) < GREATEST(50, ABS(${inboxBaseAmount}) * 0.15)
              AND COALESCE(${transactions.baseCurrency}, '') = ${inboxBaseCurrency}
              AND ${transactions.baseCurrency} IS NOT NULL 
              AND ${inboxBaseCurrency} != ''
              AND (${inboxEmbeddings.embedding} <-> ${transactionEmbeddings.embedding}) < ${EMBEDDING_THRESHOLDS.WEAK_MATCH})
          )`,
          // Perfect match date ranges with document-type awareness and banking delays
          sql`(
            (${inboxType} = 'expense' 
             AND ${transactions.date} BETWEEN ${sql.param(inboxItem.date)}::date - INTERVAL '${sql.raw(perfectExpenseStart)}' 
                 AND ${sql.param(inboxItem.date)}::date + INTERVAL '${sql.raw(perfectExpenseEnd)}')
            OR
            (${inboxType} = 'invoice'
             AND ${transactions.date} BETWEEN ${sql.param(inboxItem.date)}::date - INTERVAL '${sql.raw(perfectInvoiceStart)}'
                 AND ${sql.param(inboxItem.date)}::date + INTERVAL '${sql.raw(perfectInvoiceEnd)}')
          )`,
          // Exclude already matched
          sql`NOT EXISTS (SELECT 1 FROM ${transactionAttachments} WHERE ${transactionAttachments.transactionId} = ${transactions.id} AND ${transactionAttachments.teamId} = ${teamId})`,
        ),
      )
      // Order perfect matches by: 1) exact amount match, 2) date proximity, 3) embedding similarity
      .orderBy(
        sql`(
          CASE WHEN ABS(ABS(${transactions.amount}) - ABS(${inboxAmount})) < 0.01 
               AND ${transactions.currency} = ${inboxCurrency} 
               THEN 0 ELSE 1 END
        )`, // Exact financial matches first
        sql`ABS(${transactions.date} - ${sql.param(inboxItem.date)}::date)`, // Then by date proximity
        sql`(${inboxEmbeddings.embedding} <-> ${transactionEmbeddings.embedding})`, // Finally by embedding similarity
      )
      .limit(5);

    candidateTransactions.push(...perfectMatches);
    logger.info("QUERY 1 - Perfect financial matches", {
      inboxId,
      params: {
        inboxAmount,
        inboxCurrency,
        inboxDate: inboxItem.date,
        inboxType,
        embeddingThreshold: EMBEDDING_THRESHOLDS.WEAK_MATCH,
      },
      found: perfectMatches.length,
      totalCandidates: candidateTransactions.length,
      sampleResults: perfectMatches.slice(0, 2).map((t) => ({
        id: t.transactionId,
        name: t.name,
        amount: t.amount,
        currency: t.currency,
        embeddingScore: t.embeddingScore,
      })),
    });

    // QUERY 2: Perfect base currency matches (if we need more and have base currency)
    const shouldRunQuery2 =
      candidateTransactions.length < 15 &&
      inboxBaseCurrency &&
      inboxBaseCurrency !== "";

    logger.info("QUERY 2 - Base currency matching check", {
      inboxId,
      candidateCount: candidateTransactions.length,
      inboxBaseCurrency,
      inboxBaseAmount,
      willRun: shouldRunQuery2,
    });

    if (shouldRunQuery2) {
      const baseMatches = await db
        .select({
          transactionId: transactions.id,
          name: transactions.name,
          amount: transactions.amount,
          currency: transactions.currency,
          baseAmount: transactions.baseAmount,
          baseCurrency: transactions.baseCurrency,
          date: transactions.date,
          counterpartyName: transactions.counterpartyName,
          merchantName: transactions.merchantName,
          description: transactions.description,
          recurring: transactions.recurring,
          embeddingScore:
            sql<number>`(${inboxEmbeddings.embedding} <-> ${transactionEmbeddings.embedding})`.as(
              "embedding_score",
            ),
          embedding: sql<
            number[] | null
          >`${transactionEmbeddings.embedding}`.as("embedding"),
          isAlreadyMatched: sql<boolean>`false`,
        })
        .from(transactions)
        .innerJoin(
          transactionEmbeddings,
          and(
            eq(transactions.id, transactionEmbeddings.transactionId),
            isNotNull(transactionEmbeddings.embedding),
          ),
        )
        .innerJoin(
          inboxEmbeddings,
          and(
            eq(inboxEmbeddings.inboxId, inboxId),
            isNotNull(inboxEmbeddings.embedding),
          ),
        )
        .where(
          and(
            eq(transactions.teamId, teamId),
            eq(transactions.status, "posted"),
            // Only match transactions that have an actual date
            isNotNull(transactions.date),
            // Exclude transactions that already have pending suggestions
            notExists(
              db
                .select({ id: transactionMatchSuggestions.id })
                .from(transactionMatchSuggestions)
                .where(
                  and(
                    eq(
                      transactionMatchSuggestions.transactionId,
                      transactions.id,
                    ),
                    eq(transactionMatchSuggestions.teamId, teamId),
                    eq(transactionMatchSuggestions.status, "pending"),
                  ),
                ),
            ),
            // Perfect base currency matches (percentage-based tolerance for currency conversion)
            sql`ABS(ABS(COALESCE(${transactions.baseAmount}, 0)) - ABS(${inboxBaseAmount})) < GREATEST(50, ABS(${inboxBaseAmount}) * 0.15)`,
            sql`COALESCE(${transactions.baseCurrency}, '') = ${inboxBaseCurrency}`,
            isNotNull(transactions.baseCurrency),
            sql`(${inboxEmbeddings.embedding} <-> ${transactionEmbeddings.embedding}) < ${EMBEDDING_THRESHOLDS.WEAK_MATCH}`,
            // Perfect match date ranges
            sql`(
              (${inboxType} = 'expense' 
               AND ${transactions.date} BETWEEN ${sql.param(inboxItem.date)}::date - INTERVAL '${sql.raw(perfectExpenseStart)}' 
                   AND ${sql.param(inboxItem.date)}::date + INTERVAL '${sql.raw(perfectExpenseEnd)}')
              OR
              (${inboxType} = 'invoice'
               AND ${transactions.date} BETWEEN ${sql.param(inboxItem.date)}::date - INTERVAL '${sql.raw(perfectInvoiceStart)}'
                   AND ${sql.param(inboxItem.date)}::date + INTERVAL '${sql.raw(perfectInvoiceEnd)}')
            )`,
            // Exclude already matched
            sql`NOT EXISTS (SELECT 1 FROM ${transactionAttachments} WHERE ${transactionAttachments.transactionId} = ${transactions.id} AND ${transactionAttachments.teamId} = ${teamId})`,
            // Exclude already found transactions
            candidateTransactions.length > 0
              ? sql`${transactions.id} NOT IN (${sql.join(
                  candidateTransactions.map((c) => sql`${c.transactionId}`),
                  sql`, `,
                )})`
              : sql`1=1`,
          ),
        )
        // Order base currency matches by: 1) base amount accuracy, 2) date proximity, 3) embedding similarity
        .orderBy(
          sql`ABS(ABS(COALESCE(${transactions.baseAmount}, 0)) - ABS(${inboxBaseAmount}))`, // Best base amount match first
          sql`ABS(${transactions.date} - ${sql.param(inboxItem.date)}::date)`, // Then by date proximity
          sql`(${inboxEmbeddings.embedding} <-> ${transactionEmbeddings.embedding})`, // Finally by embedding similarity
        )
        .limit(5);

      candidateTransactions.push(...baseMatches);
      logger.info("QUERY 2 - Base currency matches", {
        inboxId,
        params: {
          inboxBaseAmount,
          inboxBaseCurrency,
          embeddingThreshold: EMBEDDING_THRESHOLDS.WEAK_MATCH,
          tolerance: Math.max(50, Math.abs(inboxBaseAmount) * 0.15),
        },
        found: baseMatches.length,
        totalCandidates: candidateTransactions.length,
        sampleResults: baseMatches.slice(0, 2).map((t) => ({
          id: t.transactionId,
          name: t.name,
          baseAmount: t.baseAmount,
          baseCurrency: t.baseCurrency,
          embeddingScore: t.embeddingScore,
          amountDiff: Math.abs(
            Math.abs(t.baseAmount || 0) - Math.abs(inboxBaseAmount),
          ),
        })),
      });
    }

    // QUERY 3: Strong semantic matches (if we need more)
    if (candidateTransactions.length < 8) {
      const semanticMatches = await db
        .select({
          transactionId: transactions.id,
          name: transactions.name,
          amount: transactions.amount,
          currency: transactions.currency,
          baseAmount: transactions.baseAmount,
          baseCurrency: transactions.baseCurrency,
          date: transactions.date,
          counterpartyName: transactions.counterpartyName,
          merchantName: transactions.merchantName,
          description: transactions.description,
          recurring: transactions.recurring,
          embeddingScore:
            sql<number>`(${inboxEmbeddings.embedding} <-> ${transactionEmbeddings.embedding})`.as(
              "embedding_score",
            ),
          embedding: sql<
            number[] | null
          >`${transactionEmbeddings.embedding}`.as("embedding"),
          isAlreadyMatched: sql<boolean>`false`,
        })
        .from(transactions)
        .innerJoin(
          transactionEmbeddings,
          and(
            eq(transactions.id, transactionEmbeddings.transactionId),
            isNotNull(transactionEmbeddings.embedding),
          ),
        )
        .innerJoin(
          inboxEmbeddings,
          and(
            eq(inboxEmbeddings.inboxId, inboxId),
            isNotNull(inboxEmbeddings.embedding),
          ),
        )
        .where(
          and(
            eq(transactions.teamId, teamId),
            eq(transactions.status, "posted"),
            // Only match transactions that have an actual date
            isNotNull(transactions.date),
            // Exclude transactions that already have pending suggestions
            notExists(
              db
                .select({ id: transactionMatchSuggestions.id })
                .from(transactionMatchSuggestions)
                .where(
                  and(
                    eq(
                      transactionMatchSuggestions.transactionId,
                      transactions.id,
                    ),
                    eq(transactionMatchSuggestions.teamId, teamId),
                    eq(transactionMatchSuggestions.status, "pending"),
                  ),
                ),
            ),
            // Strong semantic similarity
            sql`(${inboxEmbeddings.embedding} <-> ${transactionEmbeddings.embedding}) < ${EMBEDDING_THRESHOLDS.STRONG_MATCH}`,
            // Moderate financial alignment
            sql`ABS(ABS(${transactions.amount}) - ABS(${inboxAmount})) < ${tier2Tolerance}`,
            // Semantic match date ranges with document-type awareness and banking delays
            sql`(
              (${inboxType} = 'expense'
               AND ${transactions.date} BETWEEN ${sql.param(inboxItem.date)}::date - INTERVAL '${sql.raw(semanticExpenseStart)}'
                   AND ${sql.param(inboxItem.date)}::date + INTERVAL '${sql.raw(semanticExpenseEnd)}')
              OR
              (${inboxType} = 'invoice'
               AND ${transactions.date} BETWEEN ${sql.param(inboxItem.date)}::date - INTERVAL '${sql.raw(semanticInvoiceStart)}'
                   AND ${sql.param(inboxItem.date)}::date + INTERVAL '${sql.raw(semanticInvoiceEnd)}')
            )`,
            // Exclude already matched
            sql`NOT EXISTS (SELECT 1 FROM ${transactionAttachments} WHERE ${transactionAttachments.transactionId} = ${transactions.id} AND ${transactionAttachments.teamId} = ${teamId})`,
            // Exclude already found transactions
            candidateTransactions.length > 0
              ? sql`${transactions.id} NOT IN (${sql.join(
                  candidateTransactions.map((c) => sql`${c.transactionId}`),
                  sql`, `,
                )})`
              : sql`1=1`,
          ),
        )
        // Order semantic matches by: 1) embedding similarity, 2) amount accuracy, 3) date proximity
        .orderBy(
          sql`(${inboxEmbeddings.embedding} <-> ${transactionEmbeddings.embedding})`, // Best semantic match first
          sql`ABS(ABS(${transactions.amount}) - ABS(${inboxAmount}))`, // Then by amount accuracy
          sql`ABS(${transactions.date} - ${sql.param(inboxItem.date)}::date)`, // Finally by date proximity
        )
        .limit(10);

      candidateTransactions.push(...semanticMatches);
      logger.info("QUERY 3 - Strong semantic matches", {
        inboxId,
        params: {
          embeddingThreshold: EMBEDDING_THRESHOLDS.STRONG_MATCH,
          tier2Tolerance,
        },
        found: semanticMatches.length,
        totalCandidates: candidateTransactions.length,
        sampleResults: semanticMatches.slice(0, 2).map((t) => ({
          id: t.transactionId,
          name: t.name,
          amount: t.amount,
          embeddingScore: t.embeddingScore,
        })),
      });
    }

    // QUERY 4: Good semantic matches (if we still need more)
    if (candidateTransactions.length < 15) {
      const goodMatches = await db
        .select({
          transactionId: transactions.id,
          name: transactions.name,
          amount: transactions.amount,
          currency: transactions.currency,
          baseAmount: transactions.baseAmount,
          baseCurrency: transactions.baseCurrency,
          date: transactions.date,
          counterpartyName: transactions.counterpartyName,
          merchantName: transactions.merchantName,
          description: transactions.description,
          recurring: transactions.recurring,
          embeddingScore:
            sql<number>`(${inboxEmbeddings.embedding} <-> ${transactionEmbeddings.embedding})`.as(
              "embedding_score",
            ),
          embedding: sql<
            number[] | null
          >`${transactionEmbeddings.embedding}`.as("embedding"),
          isAlreadyMatched: sql<boolean>`false`,
        })
        .from(transactions)
        .innerJoin(
          transactionEmbeddings,
          and(
            eq(transactions.id, transactionEmbeddings.transactionId),
            isNotNull(transactionEmbeddings.embedding),
          ),
        )
        .innerJoin(
          inboxEmbeddings,
          and(
            eq(inboxEmbeddings.inboxId, inboxId),
            isNotNull(inboxEmbeddings.embedding),
          ),
        )
        .where(
          and(
            eq(transactions.teamId, teamId),
            eq(transactions.status, "posted"),
            // Only match transactions that have an actual date
            isNotNull(transactions.date),
            // Exclude transactions that already have pending suggestions
            notExists(
              db
                .select({ id: transactionMatchSuggestions.id })
                .from(transactionMatchSuggestions)
                .where(
                  and(
                    eq(
                      transactionMatchSuggestions.transactionId,
                      transactions.id,
                    ),
                    eq(transactionMatchSuggestions.teamId, teamId),
                    eq(transactionMatchSuggestions.status, "pending"),
                  ),
                ),
            ),
            // Good semantic similarity
            sql`(${inboxEmbeddings.embedding} <-> ${transactionEmbeddings.embedding}) < ${EMBEDDING_THRESHOLDS.GOOD_MATCH}`,
            // Loose financial alignment
            sql`ABS(ABS(${transactions.amount}) - ABS(${inboxAmount})) < ${tier3Tolerance}`,
            // Conservative date ranges with document-type awareness and banking delays
            sql`(
              (${inboxType} = 'expense'
               AND ${transactions.date} BETWEEN ${sql.param(inboxItem.date)}::date - INTERVAL '${sql.raw(conservativeStart)}'
                   AND ${sql.param(inboxItem.date)}::date + INTERVAL '${sql.raw(conservativeEnd)}')
              OR
              (${inboxType} = 'invoice'
               AND ${transactions.date} BETWEEN ${sql.param(inboxItem.date)}::date - INTERVAL '${sql.raw(conservativeStart)}'
                   AND ${sql.param(inboxItem.date)}::date + INTERVAL '${sql.raw(conservativeEnd)}')
            )`,
            // Exclude already matched
            sql`NOT EXISTS (SELECT 1 FROM ${transactionAttachments} WHERE ${transactionAttachments.transactionId} = ${transactions.id} AND ${transactionAttachments.teamId} = ${teamId})`,
            // Exclude already found transactions
            candidateTransactions.length > 0
              ? sql`${transactions.id} NOT IN (${sql.join(
                  candidateTransactions.map((c) => sql`${c.transactionId}`),
                  sql`, `,
                )})`
              : sql`1=1`,
          ),
        )
        // Order good matches by: 1) embedding similarity, 2) amount accuracy, 3) date proximity
        .orderBy(
          sql`(${inboxEmbeddings.embedding} <-> ${transactionEmbeddings.embedding})`, // Best semantic match first
          sql`ABS(ABS(${transactions.amount}) - ABS(${inboxAmount}))`, // Then by amount accuracy
          sql`ABS(${transactions.date} - ${sql.param(inboxItem.date)}::date)`, // Finally by date proximity
        )
        .limit(10);

      candidateTransactions.push(...goodMatches);
      logger.info("QUERY 4 - Good semantic matches", {
        inboxId,
        params: {
          embeddingThreshold: EMBEDDING_THRESHOLDS.GOOD_MATCH,
          tier3Tolerance,
        },
        found: goodMatches.length,
        totalCandidates: candidateTransactions.length,
        sampleResults: goodMatches.slice(0, 2).map((t) => ({
          id: t.transactionId,
          name: t.name,
          amount: t.amount,
          embeddingScore: t.embeddingScore,
        })),
      });
    }
  } catch (queryError) {
    logger.error("💥 QUERY EXECUTION FAILED:", {
      inboxId,
      teamId,
      error:
        queryError instanceof Error ? queryError.message : String(queryError),
      stack: queryError instanceof Error ? queryError.stack : undefined,
      errorName:
        queryError instanceof Error ? queryError.name : typeof queryError,
    });

    // Return null to prevent the whole process from crashing
    return null;
  }

  logger.info(
    `CANDIDATE ANALYSIS: Found ${candidateTransactions.length} total candidates before sorting`,
    {
      inboxId,
      teamId,
      candidateBreakdown: {
        total: candidateTransactions.length,
        sampleCandidates: candidateTransactions.slice(0, 3).map((c) => ({
          id: c.transactionId,
          name: c.name,
          amount: c.amount,
          currency: c.currency,
          embeddingScore: c.embeddingScore,
        })),
      },
    },
  );

  // Sort all candidates by match quality before processing to ensure best matches are considered first
  candidateTransactions.sort((a, b) => {
    // 1. Perfect financial matches always win (same currency + exact amount)
    const aPerfect =
      a.currency === inboxItem.currency &&
      Math.abs(Math.abs(a.amount) - Math.abs(inboxItem.amount || 0)) < 0.01;
    const bPerfect =
      b.currency === inboxItem.currency &&
      Math.abs(Math.abs(b.amount) - Math.abs(inboxItem.amount || 0)) < 0.01;

    if (aPerfect && !bPerfect) return -1;
    if (!aPerfect && bPerfect) return 1;

    // 2. If both are perfect or both are imperfect, sort by date proximity
    if (inboxItem.date) {
      const aDateDiff = Math.abs(
        parseISO(a.date).getTime() - parseISO(inboxItem.date).getTime(),
      );
      const bDateDiff = Math.abs(
        parseISO(b.date).getTime() - parseISO(inboxItem.date).getTime(),
      );
      const dateDiffThreshold = 24 * 60 * 60 * 1000; // 1 day in milliseconds

      if (Math.abs(aDateDiff - bDateDiff) > dateDiffThreshold) {
        return aDateDiff - bDateDiff;
      }
    }

    // 3. Then by amount accuracy (for imperfect matches)
    if (!aPerfect && !bPerfect && inboxItem.amount) {
      const aAmountDiff = Math.abs(
        Math.abs(a.amount) - Math.abs(inboxItem.amount),
      );
      const bAmountDiff = Math.abs(
        Math.abs(b.amount) - Math.abs(inboxItem.amount),
      );
      if (Math.abs(aAmountDiff - bAmountDiff) > 1) {
        // Only if difference is significant
        return aAmountDiff - bAmountDiff;
      }
    }

    // 4. Finally by embedding similarity (lower cosine distance = better match)
    const aEmbedding = a.embeddingScore || 1;
    const bEmbedding = b.embeddingScore || 1;
    return aEmbedding - bEmbedding;
  });

  logger.info(
    `🔄 CANDIDATE SORTING: Reordered ${candidateTransactions.length} candidates by match quality`,
    {
      inboxId,
      teamId,
      topCandidatesAfterSort: candidateTransactions
        .slice(0, 3)
        .map((c, index) => {
          const isPerfect =
            c.currency === inboxItem.currency &&
            Math.abs(Math.abs(c.amount) - Math.abs(inboxItem.amount || 0)) <
              0.01;
          const dateDiff = inboxItem.date
            ? Math.abs(
                parseISO(c.date).getTime() - parseISO(inboxItem.date).getTime(),
              ) /
              (24 * 60 * 60 * 1000)
            : null;

          return {
            rank: index + 1,
            id: c.transactionId,
            name: c.name,
            amount: c.amount,
            currency: c.currency,
            isPerfectFinancialMatch: isPerfect,
            daysFromInboxDate: dateDiff ? Math.round(dateDiff * 10) / 10 : null,
            embeddingScore: c.embeddingScore,
          };
        }),
    },
  );

  // Calculate scores and find the single best match
  let bestMatch: MatchResult | null = null;
  let highestConfidence = 0;

  // Track all scoring details for debugging
  const scoringDetails: Array<{
    transactionId: string;
    name: string;
    scores: Record<string, number>;
    finalConfidence: number;
    meetsCriteria: boolean;
  }> = [];

  for (const candidate of candidateTransactions) {
    try {
      // Convert PostgreSQL cosine distance to similarity score
      // Handle cases where inbox embedding might be NULL (fallback scoring)
      const embeddingScore =
        candidate.embeddingScore !== null
          ? Math.max(0, 1 - candidate.embeddingScore)
          : 0.5; // Neutral score when no inbox embedding available

      const amountScore = calculateAmountScore(inboxItem, candidate);

      // Debug amount scoring for first candidate
      if (candidate === candidateTransactions[0]) {
        console.log(
          `AMOUNT DEBUG: inbox=${inboxItem.amount} ${inboxItem.currency}, candidate=${candidate.amount} ${candidate.currency}, score=${amountScore}`,
        );
      }
      const currencyScore = calculateCurrencyScore(
        inboxItem.currency || undefined,
        candidate.currency || undefined,
      );

      // Debug currency scoring for first candidate
      if (candidate === candidateTransactions[0]) {
        console.log(
          `CURRENCY DEBUG: inbox="${inboxItem.currency}", candidate="${candidate.currency}", score=${currencyScore}`,
        );
      }
      const dateScore = calculateDateScore(
        inboxItem.date,
        candidate.date,
        inboxItem.type,
      );
      // Enhanced pattern recognition - prioritize financial accuracy over embeddings
      const hasSameCurrency = inboxItem.currency === candidate.currency;
      // EXACT AMOUNT: Strict comparison for "perfect" financial matches
      const hasExactAmount =
        inboxItem.amount &&
        Math.abs(Math.abs(inboxItem.amount) - Math.abs(candidate.amount)) <
          0.01;

      // Perfect financial match (same currency + exact amount)
      const isPerfectFinancialMatch = hasSameCurrency && hasExactAmount;

      // This ensures perfect financial matches get proper prioritization
      let effectiveWeights = teamWeights;

      if (isPerfectFinancialMatch) {
        // For perfect financial matches, rebalance weights to prioritize date and reduce embedding dependency
        effectiveWeights = {
          ...teamWeights,
          embeddingWeight: 0.25, // critical when financials are perfect
          amountWeight: 0.45, // reward the perfect financial accuracy
          currencyWeight: 0.15, // currency match is very valuable
          dateWeight: 0.15, // critical for recurring transactions
        };

        // Log when we're using optimized weights for perfect matches
        if (candidate === candidateTransactions[0]) {
          logger.info("PERFECT MATCH WEIGHT REBALANCING", {
            inboxId,
            transactionId: candidate.transactionId,
            originalWeights: {
              embedding: teamWeights.embeddingWeight,
              amount: teamWeights.amountWeight,
              currency: teamWeights.currencyWeight,
              date: teamWeights.dateWeight,
            },
            optimizedWeights: {
              embedding: effectiveWeights.embeddingWeight,
              amount: effectiveWeights.amountWeight,
              currency: effectiveWeights.currencyWeight,
              date: effectiveWeights.dateWeight,
            },
            reason:
              "Perfect financial match detected - prioritizing date precision over semantic similarity",
          });
        }
      }

      // Calculate confidence score using rebalanced weights for perfect matches
      let confidenceScore =
        embeddingScore * effectiveWeights.embeddingWeight +
        amountScore * effectiveWeights.amountWeight +
        currencyScore * effectiveWeights.currencyWeight +
        dateScore * effectiveWeights.dateWeight;

      // Excellent cross-currency match (different currencies but same base currency)
      const isExcellentCrossCurrencyMatch = isCrossCurrencyMatch(
        inboxItem,
        candidate,
      );

      // Strong financial match with good semantics
      const isStrongMatch =
        (isPerfectFinancialMatch || isExcellentCrossCurrencyMatch) &&
        embeddingScore > 0.7;

      // Good match with decent financial alignment
      const isGoodMatch = amountScore > 0.85 && embeddingScore > 0.75;

      // HYBRID SCORING: Perfect financial matches get aggressive boosting
      // This ensures obvious matches don't get stuck in manual review
      if (isPerfectFinancialMatch && embeddingScore > 0.75 && dateScore > 0.7) {
        // Perfect financial + STRONG semantic + good date = high confidence
        confidenceScore = Math.max(confidenceScore, 0.94); // Reduced from 0.96
      } else if (
        isPerfectFinancialMatch &&
        embeddingScore > 0.65 &&
        dateScore > 0.6
      ) {
        // Perfect financial + good semantic + decent date = moderate confidence
        confidenceScore = Math.max(confidenceScore, 0.88); // Reduced from 0.93
      }

      // Enhanced confidence boosting - financial accuracy first, then semantics
      if (isPerfectFinancialMatch && embeddingScore > 0.85 && dateScore > 0.7) {
        // Perfect: same currency, exact amount, VERY strong semantics, good date
        confidenceScore = Math.max(confidenceScore, 0.96); // Reduced from 0.98
      } else if (
        isExcellentCrossCurrencyMatch &&
        embeddingScore > 0.8 &&
        dateScore > 0.7
      ) {
        // Excellent: cross-currency but exact base amounts, strong semantics
        confidenceScore = Math.max(confidenceScore, 0.96);
      } else if (
        isPerfectFinancialMatch &&
        embeddingScore > 0.6 &&
        dateScore > 0.5
      ) {
        // Very good: perfect financial match with reasonable semantics and date
        confidenceScore = Math.max(confidenceScore, 0.95);
      } else if (
        isPerfectFinancialMatch &&
        embeddingScore > 0.5 &&
        dateScore > 0.5
      ) {
        // Good: perfect financial match with moderate semantics and reasonable date
        confidenceScore = Math.max(confidenceScore, 0.93);
      } else if (isPerfectFinancialMatch && dateScore > 0.5) {
        // Acceptable: perfect financial match with reasonable date (very low semantic requirement)
        confidenceScore = Math.max(confidenceScore, 0.9);
      } else if (isStrongMatch && dateScore > 0.4) {
        // Strong: good financial + semantic match
        confidenceScore = Math.max(confidenceScore, 0.88);
      } else if (isGoodMatch && dateScore > 0.3) {
        // Good: decent alignment across factors
        confidenceScore = Math.max(confidenceScore, 0.82);
      }

      // Apply penalties for poor matches - but reduce penalty for very high semantic matches
      if (inboxItem.currency !== candidate.currency && currencyScore < 0.7) {
        // Reduce currency penalty when semantic similarity is very high (85%+)
        const currencyPenalty = embeddingScore >= 0.85 ? 0.95 : 0.9;
        confidenceScore *= currencyPenalty;
      }
      if (dateScore < 0.2) {
        confidenceScore *= 0.85;
      }

      // Enhanced boost for strong semantic matches - embeddings now include legal entity data
      if (embeddingScore > 0.85) {
        // Very strong semantic match with enriched merchant data
        confidenceScore = Math.min(1.0, confidenceScore + 0.08);
      } else if (embeddingScore > 0.75) {
        // Good semantic match
        confidenceScore = Math.min(1.0, confidenceScore + 0.05);
      }

      // Cross-currency boost for strong embedding matches
      if (isExcellentCrossCurrencyMatch && embeddingScore > 0.75) {
        confidenceScore = Math.max(confidenceScore, 0.85); // Boost for obvious cross-currency matches
      }

      // CONSERVATIVE MERCHANT LEARNING: Never exceed 85% without proven merchant patterns
      let merchantCanAutoMatch = false;
      let merchantPatternForAutoMatch = null;
      if (
        embeddingScore >= 0.75 &&
        inboxItem.embedding &&
        candidate.embedding
      ) {
        try {
          // Check if this merchant pair has proven auto-match eligibility (3+ confirmations, 90%+ accuracy)
          const merchantPattern = await findSimilarMerchantPatterns(
            db,
            teamId,
            inboxItem.embedding,
            candidate.embedding,
          );

          // Store for later use in auto-match decision
          merchantPatternForAutoMatch = merchantPattern;

          if (merchantPattern.canAutoMatch) {
            // Proven merchant - allow full confidence for auto-matching potential
            // No confidence caps applied - let them reach their natural confidence
            merchantCanAutoMatch = true;

            // For proven merchants with excellent track record, we can even boost slightly
            if (
              merchantPattern.historicalAccuracy >= 0.95 &&
              merchantPattern.matchCount >= 5
            ) {
              confidenceScore = Math.min(1.0, confidenceScore + 0.03);
            }
          } else {
            // Unproven merchant - conservative 85% cap until pattern is established
            confidenceScore = Math.min(confidenceScore, 0.85);
          }
        } catch (_error) {
          // If merchant analysis fails, apply conservative cap
          confidenceScore = Math.min(confidenceScore, 0.85);
        }
      } else {
        // Poor semantic similarity or missing embeddings - apply conservative cap
        confidenceScore = Math.min(confidenceScore, 0.85);
      }

      // ROBUSTNESS: Ensure confidence score is always within valid bounds
      confidenceScore = Math.max(0.0, Math.min(1.0, confidenceScore));

      // Record detailed scoring for this candidate
      // Use standard threshold for all cases
      const debugThreshold = teamWeights.suggestedMatchThreshold;

      scoringDetails.push({
        transactionId: candidate.transactionId,
        name: candidate.name || "N/A",
        scores: {
          embedding: embeddingScore,
          amount: amountScore,
          currency: currencyScore,
          date: dateScore,
          weightedEmbedding: embeddingScore * teamWeights.embeddingWeight,
          weightedAmount: amountScore * teamWeights.amountWeight,
          weightedCurrency: currencyScore * teamWeights.currencyWeight,
          weightedDate: dateScore * teamWeights.dateWeight,
          isPerfectFinancialMatch: isPerfectFinancialMatch ? 1 : 0,
          isExcellentCrossCurrencyMatch: isExcellentCrossCurrencyMatch ? 1 : 0,
          isStrongMatch: isStrongMatch ? 1 : 0,
          isGoodMatch: isGoodMatch ? 1 : 0,
        },
        finalConfidence: confidenceScore,
        meetsCriteria: confidenceScore >= debugThreshold,
      });

      // Debug the first candidate
      if (candidate === candidateTransactions[0]) {
        console.log(
          `FIRST CANDIDATE: score=${confidenceScore}, debugThreshold=${debugThreshold}, meets=${confidenceScore >= debugThreshold}`,
        );
      }

      // Only consider if it meets minimum threshold
      if (confidenceScore >= debugThreshold) {
        // Enhanced tie-breaking: perfect matches win, then date proximity, then confidence
        const currentIsPerfect =
          bestMatch &&
          bestMatch.currency === inboxItem.currency &&
          Math.abs(
            Math.abs(bestMatch.amount) - Math.abs(inboxItem.amount || 0),
          ) < 0.01;

        const candidateIsPerfect =
          candidate.currency === inboxItem.currency &&
          Math.abs(
            Math.abs(candidate.amount) - Math.abs(inboxItem.amount || 0),
          ) < 0.01;

        // Calculate date scores for tie-breaking
        const currentDateScore =
          bestMatch && inboxItem.date
            ? calculateDateScore(inboxItem.date, bestMatch.date, inboxItem.type)
            : 0;
        const candidateDateScore = inboxItem.date
          ? calculateDateScore(inboxItem.date, candidate.date, inboxItem.type)
          : 0;

        const isBetterMatch =
          // Primary: Higher confidence score
          confidenceScore > highestConfidence + 0.001 ||
          // Secondary: Perfect financial match beats imperfect (even with lower confidence)
          (candidateIsPerfect &&
            !currentIsPerfect &&
            confidenceScore > highestConfidence - 0.05) ||
          // Tertiary: For similar confidence, better date proximity wins
          (Math.abs(confidenceScore - highestConfidence) < 0.01 &&
            candidateDateScore > currentDateScore + 0.1) ||
          // Quaternary: For perfect matches with similar confidence, closer date wins
          (candidateIsPerfect &&
            currentIsPerfect &&
            Math.abs(confidenceScore - highestConfidence) < 0.01 &&
            candidateDateScore > currentDateScore + 0.05) ||
          // Final: For very similar scores, better amount accuracy wins
          (Math.abs(confidenceScore - highestConfidence) < 0.005 &&
            amountScore > (bestMatch?.amountScore || 0) + 0.05);

        if (isBetterMatch) {
          // Determine match type with enhanced tiered auto-matching
          let matchType: "auto_matched" | "high_confidence" | "suggested";

          if (confidenceScore >= teamWeights.autoMatchThreshold) {
            // Semantic merchant pattern auto-matching
            let shouldAutoMatch = false;

            // Check if we can auto-match based on semantic merchant patterns
            if (inboxItem.embedding && candidate.embeddingScore !== null) {
              const embeddingSimilarity = Math.max(
                0,
                1 - candidate.embeddingScore,
              );

              if (embeddingSimilarity >= 0.85) {
                const transactionEmbedding = candidate.embedding; // Assuming embedding is available from query

                if (transactionEmbedding) {
                  // Use the already-calculated merchant pattern from confidence scoring
                  if (merchantCanAutoMatch && merchantPatternForAutoMatch) {
                    // Additional validation using existing logic
                    if (
                      (isPerfectFinancialMatch ||
                        isExcellentCrossCurrencyMatch) &&
                      embeddingScore >= 0.85 &&
                      dateScore >= 0.7
                    ) {
                      shouldAutoMatch = true;

                      logger.info("SEMANTIC MERCHANT AUTO-MATCH", {
                        teamId,
                        inboxId,
                        transactionId: candidate.transactionId,
                        reason: merchantPatternForAutoMatch.reason,
                        historicalMatches:
                          merchantPatternForAutoMatch.matchCount,
                        historicalAccuracy:
                          merchantPatternForAutoMatch.historicalAccuracy,
                        avgHistoricalConfidence:
                          merchantPatternForAutoMatch.confidence,
                        currentConfidence: confidenceScore,
                        embeddingScore,
                        embeddingSimilarity,
                        dateScore,
                      });
                    }
                  }
                }
              }
            }

            matchType = shouldAutoMatch ? "auto_matched" : "high_confidence";
          } else if (confidenceScore >= 0.72) {
            // Lowered from 0.75 for better UX
            matchType = "high_confidence";
          } else {
            matchType = "suggested";
          }

          bestMatch = {
            transactionId: candidate.transactionId,
            name: candidate.name,
            amount: candidate.amount,
            currency: candidate.currency,
            date: candidate.date,
            embeddingScore: Math.round(embeddingScore * 1000) / 1000,
            amountScore: Math.round(amountScore * 1000) / 1000,
            currencyScore: Math.round(currencyScore * 1000) / 1000,
            dateScore: Math.round(dateScore * 1000) / 1000,
            confidenceScore: Math.round(confidenceScore * 1000) / 1000,
            matchType,
            isAlreadyMatched: candidate.isAlreadyMatched,
          };

          highestConfidence = confidenceScore;
        }
      }
    } catch (error) {
      // ROBUSTNESS: Handle individual candidate processing errors gracefully
      logger.error("CANDIDATE PROCESSING ERROR", {
        error: error instanceof Error ? error.message : String(error),
        transactionId: candidate?.transactionId,
        inboxId: inboxItem.id,
        candidateData: {
          name: candidate?.name,
          amount: candidate?.amount,
          currency: candidate?.currency,
        },
      });
      // Skip this candidate and continue processing others
    }
  }

  logger.info(`ANALYSIS: ${candidateTransactions.length} candidates found`);

  // Sort scoring details by confidence for proper ranking display
  const sortedScoring = scoringDetails.sort(
    (a, b) => b.finalConfidence - a.finalConfidence,
  );

  // Log top 3 scores for debugging (now correctly ranked)
  for (let i = 0; i < Math.min(3, sortedScoring.length); i++) {
    const s = sortedScoring[i];
    logger.info(
      `#${i + 1}: ${s?.name} | Final: ${s?.finalConfidence.toFixed(3)} | Embedding: ${s?.scores.embedding?.toFixed(3)} | Amount: ${s?.scores.amount?.toFixed(3)} | Currency: ${s?.scores.currency?.toFixed(3)} | Date: ${s?.scores.date?.toFixed(3)}`,
    );
  }

  // Log comprehensive scoring analysis to debug wrong suggestions
  logger.info("SCORING ANALYSIS - Why this suggestion?");
  logger.debug("THRESHOLD DEBUG", {
    bestMatch: bestMatch?.confidenceScore,
    threshold: teamWeights.suggestedMatchThreshold,
    meets:
      bestMatch &&
      bestMatch.confidenceScore >= teamWeights.suggestedMatchThreshold,
  });

  // Log the final match result
  if (bestMatch) {
    logger.info("FINAL MATCH SELECTED", {
      inboxId,
      teamId,
      selectedMatch: {
        transactionId: bestMatch.transactionId,
        confidence: bestMatch.confidenceScore,
        matchType: bestMatch.matchType,
        scores: {
          embedding: bestMatch.embeddingScore,
          amount: bestMatch.amountScore,
          currency: bestMatch.currencyScore,
          date: bestMatch.dateScore,
        },
      },
      whySelected: {
        meetsThreshold:
          bestMatch.confidenceScore >= teamWeights.suggestedMatchThreshold,
        isHighestConfidence: true,
        confidenceVsThreshold:
          bestMatch.confidenceScore - teamWeights.suggestedMatchThreshold,
      },
    });
  } else {
    logger.info("NO MATCH FOUND", {
      inboxId,
      teamId,
      reason: "No candidates met minimum threshold",
      threshold: teamWeights.suggestedMatchThreshold,
      bestRejectedCandidate:
        scoringDetails.length > 0
          ? {
              transactionId: scoringDetails[0]?.transactionId,
              confidence: scoringDetails[0]?.finalConfidence,
              shortfall:
                teamWeights.suggestedMatchThreshold -
                (scoringDetails[0]?.finalConfidence || 0),
            }
          : null,
    });
  }

  // Check if the best match was previously dismissed by the user
  if (bestMatch) {
    const wasDismissed = await wasPreviouslyDismissed(
      db,
      teamId,
      inboxId,
      bestMatch.transactionId,
    );

    if (wasDismissed) {
      logger.info("MATCH SKIPPED - Previously dismissed", {
        teamId,
        inboxId,
        transactionId: bestMatch.transactionId,
        confidence: bestMatch.confidenceScore,
        matchType: bestMatch.matchType,
      });
      return null; // Don't suggest previously dismissed matches
    }
  }

  return bestMatch;
}

// Reverse matching - find best inbox match for transaction
export async function findInboxMatches(
  db: Database,
  params: FindInboxMatchesParams,
): Promise<InboxMatchResult | null> {
  // ROBUSTNESS: Performance monitoring
  const startTime = Date.now();
  const { teamId, transactionId } = params;

  // Get transaction with embedding
  const transactionData = await db
    .select({
      id: transactions.id,
      name: transactions.name,
      amount: transactions.amount,
      currency: transactions.currency,
      baseAmount: transactions.baseAmount,
      baseCurrency: transactions.baseCurrency,
      date: transactions.date,
      counterpartyName: transactions.counterpartyName,
      description: transactions.description,
      embedding: transactionEmbeddings.embedding,
    })
    .from(transactions)
    .leftJoin(
      transactionEmbeddings,
      eq(transactions.id, transactionEmbeddings.transactionId),
    )
    .where(
      and(eq(transactions.id, transactionId), eq(transactions.teamId, teamId)),
    )
    .limit(1);

  if (!transactionData.length || !transactionData[0]!.embedding) {
    return null;
  }

  const transactionItem = transactionData[0]!;

  // Get calibrated thresholds
  const calibration = await getTeamCalibration(db, teamId);

  // Conservative production weights - require stronger semantic validation for same-currency matches
  const teamWeights = {
    embeddingWeight: 0.5, // Increased: Require stronger semantic similarity to prevent false matches
    amountWeight: 0.35, // Keep financial accuracy high - critical for correctness
    currencyWeight: 0.1, // Reduced: Currency match is less meaningful when most transactions use same currency
    dateWeight: 0.05, // Supporting signal for temporal alignment
    autoMatchThreshold: 0.9, // Fixed conservative threshold - proven merchants bypass the 85% cap
    suggestedMatchThreshold: Math.max(
      0.75,
      calibration.calibratedSuggestedThreshold,
    ), // HIGHER threshold: Be more conservative for suggestions
  };

  // TIER 1: Look for exact currency + amount matches first (fastest and most accurate)
  let candidateInboxItems = await db
    .select({
      inboxId: inbox.id,
      displayName: inbox.displayName,
      amount: inbox.amount,
      currency: inbox.currency,
      baseAmount: inbox.baseAmount,
      baseCurrency: inbox.baseCurrency,
      date: inbox.date,
      website: inbox.website,
      embeddingScore: sql<number>`0.1`.as("embedding_score"), // Perfect match gets best embedding score
      embedding: sql<number[] | null>`${inboxEmbeddings.embedding}`.as(
        "embedding",
      ),
      isAlreadyMatched: sql<boolean>`${inbox.transactionId} IS NOT NULL`,
    })
    .from(inbox)
    .leftJoin(inboxEmbeddings, eq(inbox.id, inboxEmbeddings.inboxId))
    .where(
      and(
        eq(inbox.teamId, teamId),

        // Exact financial match only - let embeddings handle variations
        sql`${inbox.amount} = ${sql.param(transactionItem.amount)}`,
        eq(inbox.currency, transactionItem.currency),

        // Only match items that have an actual document date (not upload date)
        isNotNull(inbox.date),
        // Reasonable date range for exact matches (30 days back, 7 days forward)
        sql`${inbox.date} BETWEEN (${sql.param(transactionItem.date)}::date - INTERVAL '30 days') 
            AND (${sql.param(transactionItem.date)}::date + INTERVAL '7 days')`,

        // Exclude already matched inbox items
        isNull(inbox.transactionId),
      ),
    )
    .orderBy(sql`ABS(${inbox.date} - ${sql.param(transactionItem.date)})`)
    .limit(5);

  // TIER 2: If no exact matches, fall back to embedding-based semantic search
  if (candidateInboxItems.length === 0) {
    candidateInboxItems = await db
      .select({
        inboxId: inbox.id,
        displayName: inbox.displayName,
        amount: inbox.amount,
        currency: inbox.currency,
        baseAmount: inbox.baseAmount,
        baseCurrency: inbox.baseCurrency,
        date: inbox.date,
        website: inbox.website,
        description: inbox.description,
        embeddingScore:
          sql<number>`(${transactionEmbeddings.embedding} <-> ${inboxEmbeddings.embedding})`.as(
            "embedding_score",
          ),
        embedding: sql<number[] | null>`${inboxEmbeddings.embedding}`.as(
          "embedding",
        ),
        isAlreadyMatched: sql<boolean>`${inbox.transactionId} IS NOT NULL`,
      })
      .from(inbox)
      .innerJoin(inboxEmbeddings, eq(inbox.id, inboxEmbeddings.inboxId))
      .crossJoin(transactionEmbeddings)
      .where(
        and(
          eq(inbox.teamId, teamId),
          eq(transactionEmbeddings.transactionId, transactionId),

          // Enhanced embedding similarity with financial context - same tiered approach
          sql`(
            -- TIER 1: Perfect financial matches get relaxed semantic requirements
            ((ABS(${inbox.amount} - ${sql.param(transactionItem.amount)}) < 0.01 
              AND ${inbox.currency} = ${sql.param(transactionItem.currency)})
              AND (${transactionEmbeddings.embedding} <-> ${inboxEmbeddings.embedding}) < 0.6)
            OR
            -- TIER 2: Strong semantic matches with moderate financial alignment
             ((${transactionEmbeddings.embedding} <-> ${inboxEmbeddings.embedding}) < 0.35
             AND ABS(COALESCE(${inbox.amount}, 0) - ${sql.param(transactionItem.amount)}) < ${sql.param(Math.max(50, transactionItem.amount * 0.1))})
            OR
            -- TIER 3: Good semantic matches with loose financial alignment
             ((${transactionEmbeddings.embedding} <-> ${inboxEmbeddings.embedding}) < 0.45
             AND ABS(COALESCE(${inbox.amount}, 0) - ${sql.param(transactionItem.amount)}) < ${sql.param(Math.max(100, transactionItem.amount * 0.2))})
          )`,

          // Wider date range for semantic search - only use actual document dates
          isNotNull(inbox.date),
          sql`${inbox.date} BETWEEN (${sql.param(transactionItem.date)}::date - INTERVAL '90 days') 
              AND (${sql.param(transactionItem.date)}::date + INTERVAL '90 days')`,

          // Exclude already matched inbox items
          isNull(inbox.transactionId),
        ),
      )
      // Order reverse semantic matches by: 1) embedding similarity, 2) amount accuracy, 3) date proximity
      .orderBy(
        sql`(${transactionEmbeddings.embedding} <-> ${inboxEmbeddings.embedding})`, // Best semantic match first
        sql`ABS(COALESCE(${inbox.amount}, 0) - ${sql.param(transactionItem.amount)})`, // Then by amount accuracy
        sql`ABS(${inbox.date} - ${sql.param(transactionItem.date)}::date)`, // Finally by date proximity
      )
      .limit(20);
  }

  // Calculate scores and find the single best match
  let bestMatch: InboxMatchResult | null = null;
  let highestConfidence = 0;

  for (const candidate of candidateInboxItems) {
    // Convert PostgreSQL cosine distance to similarity score
    // For TIER 1 (exact matches): embeddingScore = 0.1, so similarity = 0.9 (high but not perfect)
    // For TIER 2 (semantic search): use actual cosine similarity from PostgreSQL
    const embeddingScore = Math.max(0, 1 - candidate.embeddingScore);

    const amountScore = calculateAmountScore(candidate, transactionItem);
    const currencyScore = calculateCurrencyScore(
      candidate.currency || undefined,
      transactionItem.currency || undefined,
    );
    const dateScore = calculateDateScore(candidate.date!, transactionItem.date);

    // Enhanced pattern recognition - prioritize financial accuracy over embeddings
    const hasSameCurrency = candidate.currency === transactionItem.currency;
    // EXACT AMOUNT: Strict comparison for "perfect" financial matches
    const hasExactAmount =
      candidate.amount &&
      Math.abs(Math.abs(candidate.amount) - Math.abs(transactionItem.amount)) <
        0.01;

    // Perfect financial match (same currency + exact amount)
    const isPerfectFinancialMatch = hasSameCurrency && hasExactAmount;

    // CONSERVATIVE WEIGHT REBALANCING: Use different weights for perfect financial matches
    let effectiveWeights = teamWeights;

    if (isPerfectFinancialMatch) {
      // For perfect financial matches, rebalance weights to prioritize date and reduce embedding dependency
      effectiveWeights = {
        ...teamWeights,
        embeddingWeight: 0.25, // less critical when financials are perfect
        amountWeight: 0.45, // reward the perfect financial accuracy
        currencyWeight: 0.15, // currency match is very valuable
        dateWeight: 0.15, // critical for recurring transactions
      };
    }

    // Calculate confidence score using rebalanced weights for perfect matches
    let confidenceScore =
      embeddingScore * effectiveWeights.embeddingWeight +
      amountScore * effectiveWeights.amountWeight +
      currencyScore * effectiveWeights.currencyWeight +
      dateScore * effectiveWeights.dateWeight;

    // Excellent cross-currency match (different currencies but exact base amounts)
    const isExcellentCrossCurrencyMatch = isCrossCurrencyMatch(
      candidate,
      transactionItem,
    );

    // Strong financial match with good semantics
    const isStrongMatch =
      (isPerfectFinancialMatch || isExcellentCrossCurrencyMatch) &&
      embeddingScore > 0.7;

    // Good match with decent financial alignment
    const isGoodMatch = amountScore > 0.85 && embeddingScore > 0.75;

    // HYBRID SCORING: Perfect financial matches get aggressive boosting
    // This ensures obvious matches don't get stuck in manual review
    if (isPerfectFinancialMatch && embeddingScore > 0.75 && dateScore > 0.7) {
      // Perfect financial + STRONG semantic + good date = high confidence
      confidenceScore = Math.max(confidenceScore, 0.94); // Reduced from 0.96
    } else if (
      isPerfectFinancialMatch &&
      embeddingScore > 0.65 &&
      dateScore > 0.6
    ) {
      // Perfect financial + good semantic + decent date = moderate confidence
      confidenceScore = Math.max(confidenceScore, 0.88); // Reduced from 0.93
    }

    // Enhanced confidence boosting - financial accuracy first, then semantics
    if (isPerfectFinancialMatch && embeddingScore > 0.85 && dateScore > 0.7) {
      // Perfect: same currency, exact amount, VERY strong semantics, good date
      confidenceScore = Math.max(confidenceScore, 0.96); // Reduced from 0.98
    } else if (
      isExcellentCrossCurrencyMatch &&
      embeddingScore > 0.8 &&
      dateScore > 0.7
    ) {
      // Excellent: cross-currency but exact base amounts, strong semantics
      confidenceScore = Math.max(confidenceScore, 0.96);
    } else if (
      isPerfectFinancialMatch &&
      embeddingScore > 0.6 &&
      dateScore > 0.5
    ) {
      // Very good: perfect financial match with reasonable semantics and date
      confidenceScore = Math.max(confidenceScore, 0.95);
    } else if (
      isPerfectFinancialMatch &&
      embeddingScore > 0.5 &&
      dateScore > 0.5
    ) {
      // Good: perfect financial match with moderate semantics and reasonable date
      confidenceScore = Math.max(confidenceScore, 0.93);
    } else if (isPerfectFinancialMatch && dateScore > 0.5) {
      // Acceptable: perfect financial match with reasonable date (very low semantic requirement)
      confidenceScore = Math.max(confidenceScore, 0.9);
    } else if (isStrongMatch && dateScore > 0.4) {
      // Strong: good financial + semantic match
      confidenceScore = Math.max(confidenceScore, 0.88);
    } else if (isGoodMatch && dateScore > 0.3) {
      // Good: decent alignment across factors
      confidenceScore = Math.max(confidenceScore, 0.82);
    }

    // Enhanced boost for strong semantic matches with enriched merchant data
    if (embeddingScore > 0.9 && amountScore > 0.8) {
      confidenceScore = Math.min(1.0, confidenceScore + 0.08);
    } else if (embeddingScore > 0.85) {
      confidenceScore = Math.min(1.0, confidenceScore + 0.05);
    }

    // Apply penalties - but reduce penalty for very high semantic matches
    if (
      candidate.currency !== transactionItem.currency &&
      currencyScore < 0.8
    ) {
      // Reduce currency penalty when semantic similarity is very high (85%+)
      const currencyPenalty = embeddingScore >= 0.85 ? 0.92 : 0.85;
      confidenceScore *= currencyPenalty;
    }

    // CONSERVATIVE MERCHANT LEARNING: Never exceed 85% without proven merchant patterns (Reverse)
    let merchantCanAutoMatch = false;
    let merchantPatternForAutoMatch = null;
    if (
      embeddingScore >= 0.75 &&
      transactionItem.embedding &&
      candidate.embedding
    ) {
      try {
        // Check if this merchant pair has proven auto-match eligibility
        const merchantPattern = await findSimilarMerchantPatterns(
          db,
          teamId,
          candidate.embedding,
          transactionItem.embedding,
        );

        // Store for later use in auto-match decision
        merchantPatternForAutoMatch = merchantPattern;

        if (merchantPattern.canAutoMatch) {
          // Proven merchant - allow full confidence for auto-matching potential
          // No confidence caps applied - let them reach their natural confidence
          merchantCanAutoMatch = true;

          // For proven merchants with excellent track record, we can even boost slightly
          if (
            merchantPattern.historicalAccuracy >= 0.95 &&
            merchantPattern.matchCount >= 5
          ) {
            confidenceScore = Math.min(1.0, confidenceScore + 0.03);
          }
        } else {
          // Unproven merchant - conservative 85% cap until pattern is established
          confidenceScore = Math.min(confidenceScore, 0.85);
        }
      } catch (_error) {
        // If merchant analysis fails, apply conservative cap
        confidenceScore = Math.min(confidenceScore, 0.85);
      }
    } else {
      // Poor semantic similarity or missing embeddings - apply conservative cap
      confidenceScore = Math.min(confidenceScore, 0.85);
    }

    // ROBUSTNESS: Ensure confidence score is always within valid bounds
    confidenceScore = Math.max(0.0, Math.min(1.0, confidenceScore));

    if (dateScore < 0.3) {
      confidenceScore *= 0.9;
    }

    // Only consider if it meets minimum threshold
    if (confidenceScore >= teamWeights.suggestedMatchThreshold) {
      // Enhanced tie-breaking for reverse matching: perfect matches win, then date proximity, then confidence
      const currentIsPerfect =
        bestMatch &&
        bestMatch.currency === transactionItem.currency &&
        bestMatch.amount &&
        Math.abs(
          Math.abs(bestMatch.amount) - Math.abs(transactionItem.amount),
        ) < 0.01;

      const candidateIsPerfect =
        candidate.currency === transactionItem.currency &&
        candidate.amount &&
        Math.abs(
          Math.abs(candidate.amount) - Math.abs(transactionItem.amount),
        ) < 0.01;

      // Calculate date scores for tie-breaking
      const currentDateScore = bestMatch?.date
        ? calculateDateScore(bestMatch.date, transactionItem.date)
        : 0;
      const candidateDateScore = candidate.date
        ? calculateDateScore(candidate.date!, transactionItem.date)
        : 0;

      const isBetterMatch =
        // Primary: Higher confidence score
        confidenceScore > highestConfidence + 0.001 ||
        // Secondary: Perfect financial match beats imperfect (even with lower confidence)
        (candidateIsPerfect &&
          !currentIsPerfect &&
          confidenceScore > highestConfidence - 0.05) ||
        // Tertiary: For similar confidence, better date proximity wins
        (Math.abs(confidenceScore - highestConfidence) < 0.01 &&
          candidateDateScore > currentDateScore + 0.1) ||
        // Quaternary: For perfect matches with similar confidence, closer date wins
        (candidateIsPerfect &&
          currentIsPerfect &&
          Math.abs(confidenceScore - highestConfidence) < 0.01 &&
          candidateDateScore > currentDateScore + 0.05) ||
        // Final: For very similar scores, better amount accuracy wins
        (Math.abs(confidenceScore - highestConfidence) < 0.005 &&
          amountScore > (bestMatch?.amountScore || 0) + 0.05);

      if (isBetterMatch) {
        // Determine match type with enhanced tiered auto-matching (same logic as forward matching)
        let matchType: "auto_matched" | "high_confidence" | "suggested";

        if (confidenceScore >= teamWeights.autoMatchThreshold) {
          // Semantic merchant pattern auto-matching
          let shouldAutoMatch = false;

          // Check if we can auto-match based on semantic merchant patterns
          if (transactionItem.embedding && candidate.embeddingScore !== null) {
            const embeddingSimilarity = Math.max(
              0,
              1 - candidate.embeddingScore,
            );

            if (embeddingSimilarity >= 0.85) {
              const inboxEmbedding = candidate.embedding;

              if (inboxEmbedding) {
                // Use the already-calculated merchant pattern from confidence scoring
                if (merchantCanAutoMatch && merchantPatternForAutoMatch) {
                  // Additional validation using existing logic
                  if (
                    (isPerfectFinancialMatch ||
                      isExcellentCrossCurrencyMatch) &&
                    embeddingScore >= 0.85 &&
                    dateScore >= 0.7
                  ) {
                    shouldAutoMatch = true;

                    logger.info("SEMANTIC MERCHANT AUTO-MATCH (Reverse)", {
                      teamId,
                      transactionId,
                      inboxId: candidate.inboxId,
                      reason: merchantPatternForAutoMatch.reason,
                      historicalMatches: merchantPatternForAutoMatch.matchCount,
                      historicalAccuracy:
                        merchantPatternForAutoMatch.historicalAccuracy,
                      avgHistoricalConfidence:
                        merchantPatternForAutoMatch.confidence,
                      currentConfidence: confidenceScore,
                      embeddingScore,
                      dateScore,
                    });
                  }
                }
              }
            }
          }

          matchType = shouldAutoMatch ? "auto_matched" : "high_confidence";
        } else if (confidenceScore >= 0.72) {
          // Lowered from 0.75 for better UX
          matchType = "high_confidence";
        } else {
          matchType = "suggested";
        }

        bestMatch = {
          inboxId: candidate.inboxId,
          displayName: candidate.displayName,
          amount: candidate.amount,
          currency: candidate.currency,
          date: candidate.date || "",
          embeddingScore: Math.round(embeddingScore * 1000) / 1000,
          amountScore: Math.round(amountScore * 1000) / 1000,
          currencyScore: Math.round(currencyScore * 1000) / 1000,
          dateScore: Math.round(dateScore * 1000) / 1000,

          confidenceScore: Math.round(confidenceScore * 1000) / 1000,
          matchType,
          isAlreadyMatched: candidate.isAlreadyMatched,
        };

        highestConfidence = confidenceScore;
      }
    }
  }

  // ROBUSTNESS: Performance monitoring
  const endTime = Date.now();
  const duration = endTime - startTime;

  if (duration > 5000) {
    // Log slow queries
    logger.warn("SLOW MATCHING QUERY", {
      teamId,
      transactionId,
      duration,
      candidateCount: candidateInboxItems?.length || 0,
    });
  }

  // Check if the best match was previously dismissed by the user
  if (bestMatch) {
    const wasDismissed = await wasPreviouslyDismissed(
      db,
      teamId,
      bestMatch.inboxId,
      transactionId,
    );

    if (wasDismissed) {
      logger.info("REVERSE MATCH SKIPPED - Previously dismissed", {
        teamId,
        transactionId,
        inboxId: bestMatch.inboxId,
        confidence: bestMatch.confidenceScore,
        matchType: bestMatch.matchType,
      });
      return null; // Don't suggest previously dismissed matches
    }
  }

  return bestMatch;
}

// Create a match suggestion record
export async function createMatchSuggestion(
  db: Database,
  params: CreateMatchSuggestionParams,
) {
  const [result] = await db
    .insert(transactionMatchSuggestions)
    .values({
      teamId: params.teamId,
      inboxId: params.inboxId,
      transactionId: params.transactionId,
      confidenceScore: params.confidenceScore,
      amountScore: params.amountScore,
      currencyScore: params.currencyScore,
      dateScore: params.dateScore,
      embeddingScore: params.embeddingScore,
      matchType: params.matchType,
      matchDetails: params.matchDetails,
      status: params.status || "pending",
      userId: params.userId,
    })
    .onConflictDoUpdate({
      target: [
        transactionMatchSuggestions.inboxId,
        transactionMatchSuggestions.transactionId,
      ],
      set: {
        confidenceScore: params.confidenceScore,
        amountScore: params.amountScore,
        currencyScore: params.currencyScore,
        dateScore: params.dateScore,
        embeddingScore: params.embeddingScore,
        matchType: params.matchType,
        matchDetails: params.matchDetails,
        status: params.status || "pending",
        updatedAt: sql`NOW()`,
      },
    })
    .returning();

  return result;
}

// Check if a specific inbox-transaction pair was previously dismissed
async function wasPreviouslyDismissed(
  db: Database,
  teamId: string,
  inboxId: string,
  transactionId: string,
): Promise<boolean> {
  const dismissedMatch = await db
    .select({ id: transactionMatchSuggestions.id })
    .from(transactionMatchSuggestions)
    .where(
      and(
        eq(transactionMatchSuggestions.teamId, teamId),
        eq(transactionMatchSuggestions.inboxId, inboxId),
        eq(transactionMatchSuggestions.transactionId, transactionId),
        inArray(transactionMatchSuggestions.status, ["declined", "unmatched"]),
      ),
    )
    .limit(1);

  return dismissedMatch.length > 0;
}
