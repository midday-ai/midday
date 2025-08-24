import type { Database } from "@db/client";
import {
  inbox,
  inboxEmbeddings,
  teams,
  transactionAttachments,
  transactionEmbeddings,
  transactionMatchSuggestions,
  transactions,
} from "@db/schema";
import {
  and,
  cosineDistance,
  desc,
  eq,
  inArray,
  isNotNull,
  isNull,
  lt,
  sql,
} from "drizzle-orm";

// Type definitions
export type FindMatchesParams = {
  teamId: string;
  inboxId: string;
  includeAlreadyMatched?: boolean;
};

export type FindInboxMatchesParams = {
  teamId: string;
  transactionId: string;
  includeAlreadyMatched?: boolean;
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
  nameScore: number;
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
  nameScore: number;
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
  nameScore: number;
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

// Confidence calibration system - learns from user feedback
export type TeamCalibrationData = {
  teamId: string;
  totalSuggestions: number;
  confirmedSuggestions: number;
  declinedSuggestions: number;
  avgConfidenceConfirmed: number;
  avgConfidenceDeclined: number;
  autoMatchAccuracy: number;
  suggestedMatchAccuracy: number;
  calibratedAutoThreshold: number;
  calibratedSuggestedThreshold: number;
  lastUpdated: string;
};

// Get team's calibration data and adjust thresholds based on user feedback
export async function getTeamCalibration(
  db: Database,
  teamId: string,
): Promise<TeamCalibrationData> {
  // Default weights for fallback
  const defaultAutoThreshold = 0.95;
  const defaultSuggestedThreshold = 0.7;

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
        inArray(transactionMatchSuggestions.status, ["confirmed", "declined"]),
        // Only look at last 90 days for relevance
        sql`${transactionMatchSuggestions.createdAt} > NOW() - INTERVAL '90 days'`,
      ),
    );

  if (performanceData.length < 5) {
    // Not enough data - use default thresholds
    return {
      teamId,
      totalSuggestions: performanceData.length,
      confirmedSuggestions: 0,
      declinedSuggestions: 0,
      avgConfidenceConfirmed: 0,
      avgConfidenceDeclined: 0,
      autoMatchAccuracy: 0,
      suggestedMatchAccuracy: 0,
      calibratedAutoThreshold: defaultAutoThreshold,
      calibratedSuggestedThreshold: defaultSuggestedThreshold,
      lastUpdated: new Date().toISOString(),
    };
  }

  // Calculate performance metrics
  const confirmed = performanceData.filter((d) => d.status === "confirmed");
  const declined = performanceData.filter((d) => d.status === "declined");
  const autoMatches = performanceData.filter(
    (d) => d.matchType === "auto_matched",
  );
  const suggestedMatches = performanceData.filter(
    (d) => d.matchType === "high_confidence" || d.matchType === "suggested",
  );

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

  const autoMatchAccuracy =
    autoMatches.length > 0
      ? autoMatches.filter((d) => d.status === "confirmed").length /
        autoMatches.length
      : 0;

  const suggestedMatchAccuracy =
    suggestedMatches.length > 0
      ? suggestedMatches.filter((d) => d.status === "confirmed").length /
        suggestedMatches.length
      : 0;

  // Calibrate thresholds based on performance
  let calibratedAutoThreshold = defaultAutoThreshold;
  let calibratedSuggestedThreshold = defaultSuggestedThreshold;

  // Auto-match threshold - more responsive adjustments
  if (autoMatchAccuracy > 0.97 && confirmed.length > 5) {
    // High accuracy with fewer samples - be more aggressive
    calibratedAutoThreshold = Math.max(0.9, defaultAutoThreshold - 0.04);
  } else if (autoMatchAccuracy > 0.99 && confirmed.length > 15) {
    // Excellent accuracy - be very aggressive
    calibratedAutoThreshold = Math.max(0.88, defaultAutoThreshold - 0.06);
  } else if (autoMatchAccuracy < 0.95 && declined.length > 2) {
    // Any auto-match failures - be more conservative quickly
    calibratedAutoThreshold = Math.min(0.98, defaultAutoThreshold + 0.03);
  }

  // Suggested match threshold - much more responsive to user behavior
  if (suggestedMatchAccuracy > 0.9 && confirmed.length > 8) {
    // Excellent user acceptance - suggest much more aggressively
    calibratedSuggestedThreshold = Math.max(
      0.6,
      defaultSuggestedThreshold - 0.08,
    );
  } else if (suggestedMatchAccuracy > 0.8 && confirmed.length > 5) {
    // Good user acceptance - suggest more
    calibratedSuggestedThreshold = Math.max(
      0.62,
      defaultSuggestedThreshold - 0.06,
    );
  } else if (suggestedMatchAccuracy > 0.7 && confirmed.length > 3) {
    // Decent acceptance - slight improvement
    calibratedSuggestedThreshold = Math.max(
      0.65,
      defaultSuggestedThreshold - 0.04,
    );
  } else if (suggestedMatchAccuracy < 0.5 && declined.length > 4) {
    // Poor acceptance - be much more selective
    calibratedSuggestedThreshold = Math.min(
      0.85,
      defaultSuggestedThreshold + 0.12,
    );
  } else if (suggestedMatchAccuracy < 0.65 && declined.length > 6) {
    // Below average acceptance - be more selective
    calibratedSuggestedThreshold = Math.min(
      0.8,
      defaultSuggestedThreshold + 0.08,
    );
  }

  // Confidence gap analysis - faster learning from score patterns
  if (
    avgConfidenceConfirmed > 0 &&
    avgConfidenceDeclined > 0 &&
    confirmed.length > 3
  ) {
    const confidenceGap = avgConfidenceConfirmed - avgConfidenceDeclined;

    if (confidenceGap > 0.2) {
      // Very clear separation - be much more aggressive
      calibratedSuggestedThreshold = Math.max(
        0.58,
        calibratedSuggestedThreshold - 0.08,
      );
    } else if (confidenceGap > 0.12) {
      // Good separation - be more aggressive
      calibratedSuggestedThreshold = Math.max(
        0.62,
        calibratedSuggestedThreshold - 0.05,
      );
    } else if (confidenceGap < 0.05) {
      // Poor separation - user can't tell good from bad matches
      calibratedSuggestedThreshold = Math.min(
        0.82,
        calibratedSuggestedThreshold + 0.06,
      );
    }
  }

  // Volume-based adjustments - learn from user engagement patterns
  if (confirmed.length > 20) {
    // High engagement team - they're actively using the system
    calibratedSuggestedThreshold = Math.max(
      0.62,
      calibratedSuggestedThreshold - 0.03,
    );
  }

  if (declined.length > 15 && suggestedMatchAccuracy < 0.7) {
    // High decline volume with poor accuracy - be much more conservative
    calibratedSuggestedThreshold = Math.min(
      0.85,
      calibratedSuggestedThreshold + 0.08,
    );
  }

  return {
    teamId,
    totalSuggestions: performanceData.length,
    confirmedSuggestions: confirmed.length,
    declinedSuggestions: declined.length,
    avgConfidenceConfirmed,
    avgConfidenceDeclined,
    autoMatchAccuracy,
    suggestedMatchAccuracy,
    calibratedAutoThreshold,
    calibratedSuggestedThreshold,
    lastUpdated: new Date().toISOString(),
  };
}

// Core matching algorithm - find best transaction match for inbox item
export async function findMatches(
  db: Database,
  params: FindMatchesParams,
): Promise<MatchResult | null> {
  const { teamId, inboxId, includeAlreadyMatched = false } = params;

  // Get team-specific calibrated thresholds based on user feedback
  const calibration = await getTeamCalibration(db, teamId);

  // Balanced weights - financial accuracy first, then enriched embeddings
  const teamWeights = {
    embeddingWeight: 0.35, // Important but transaction names can be messy
    amountWeight: 0.4, // Primary signal - most reliable data point
    currencyWeight: 0.2, // Critical for cross-currency matching with base amounts
    dateWeight: 0.05, // Supporting signal for temporal alignment
    autoMatchThreshold: calibration.calibratedAutoThreshold, // Learned from user feedback
    suggestedMatchThreshold: calibration.calibratedSuggestedThreshold, // Learned from user feedback
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
      date: sql<string>`COALESCE(${inbox.date}, ${inbox.createdAt}::date)`.as(
        "inbox_date",
      ),
      embedding: inboxEmbeddings.embedding,
      website: inbox.website,
      type: inbox.type,
    })
    .from(inbox)
    .leftJoin(inboxEmbeddings, eq(inbox.id, inboxEmbeddings.inboxId))
    .where(and(eq(inbox.id, inboxId), eq(inbox.teamId, teamId)))
    .limit(1);

  if (!inboxData.length || !inboxData[0]!.embedding) {
    return null;
  }

  const inboxItem = inboxData[0]!;

  // Get team's base currency
  const teamData = await db
    .select({ baseCurrency: teams.baseCurrency })
    .from(teams)
    .where(eq(teams.id, teamId))
    .limit(1);

  const teamBaseCurrency = teamData[0]?.baseCurrency;

  // Pre-calculate all complex matching parameters in JavaScript
  const inboxAmount = inboxItem.amount || 0;
  const inboxBaseAmount = inboxItem.baseAmount || 0;
  const inboxCurrency = inboxItem.currency || "";
  const inboxBaseCurrency = inboxItem.baseCurrency || "";
  const inboxType = inboxItem.type || "expense";

  // Tier tolerance calculations
  const tier2Tolerance = Math.max(50, inboxAmount * 0.1);
  const tier3Tolerance = Math.max(100, inboxAmount * 0.2);

  // Document-type aware date ranges with banking delays
  const isExpense = inboxType === "expense";

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

  // Embedding-first candidate discovery - leverages enriched merchant data
  const candidateTransactions = await db
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
        sql<number>`(${inboxEmbeddings.embedding} <=> ${transactionEmbeddings.embedding})`.as(
          "embedding_score",
        ),
      isAlreadyMatched: sql<boolean>`false`,
    })
    .from(transactions)
    .innerJoin(
      transactionEmbeddings,
      eq(transactions.id, transactionEmbeddings.transactionId),
    )
    .innerJoin(inboxEmbeddings, eq(inboxEmbeddings.inboxId, inboxId))
    .where(
      and(
        eq(transactions.teamId, teamId),
        eq(transactions.status, "posted"),
        // Check embeddings exist
        isNotNull(transactionEmbeddings.embedding),
        isNotNull(inboxEmbeddings.embedding),
        // Fixed sophisticated multi-tier matching logic with proper thresholds
        sql`(
          -- TIER 1: Perfect financial matches (regular currency) with relaxed semantic requirements
          (ABS(${transactions.amount} - ${inboxAmount}) < 0.01 
           AND ${transactions.currency} = ${inboxCurrency}
           AND (${inboxEmbeddings.embedding} <=> ${transactionEmbeddings.embedding}) < 0.6)
          OR
          -- TIER 1B: Perfect base currency matches (absolute values, relaxed tolerance)
          (ABS(ABS(COALESCE(${transactions.baseAmount}, 0)) - ABS(${inboxBaseAmount})) < 10
           AND COALESCE(${transactions.baseCurrency}, '') = ${inboxBaseCurrency}
           AND ${transactions.baseCurrency} IS NOT NULL 
           AND ${inboxBaseCurrency} != ''
           AND (${inboxEmbeddings.embedding} <=> ${transactionEmbeddings.embedding}) < 0.6)
          OR
          -- TIER 2: Strong semantic matches with moderate financial alignment  
          ((${inboxEmbeddings.embedding} <=> ${transactionEmbeddings.embedding}) < 0.35
           AND ABS(ABS(${transactions.amount}) - ABS(${inboxAmount})) < ${tier2Tolerance})
          OR
          -- TIER 3: Good semantic matches with loose financial alignment
          ((${inboxEmbeddings.embedding} <=> ${transactionEmbeddings.embedding}) < 0.45
           AND ABS(ABS(${transactions.amount}) - ABS(${inboxAmount})) < ${tier3Tolerance})
        )`,
        // Sophisticated date logic with banking delays and document-type awareness
        sql`(
          -- Perfect financial matches with accounting-aware date ranges
          ((ABS(${transactions.amount} - ${inboxAmount}) < 0.01 AND ${transactions.currency} = ${inboxCurrency})
           OR (ABS(ABS(COALESCE(${transactions.baseAmount}, 0)) - ABS(${inboxBaseAmount})) < 10
               AND COALESCE(${transactions.baseCurrency}, '') = ${inboxBaseCurrency} 
               AND ${transactions.baseCurrency} IS NOT NULL AND ${inboxBaseCurrency} != ''))
          AND (
            -- Expense receipts: transaction usually happens BEFORE receipt (with banking delay)
            (${inboxType} = 'expense' 
             AND ${transactions.date} BETWEEN ${inboxItem.date}::date - INTERVAL '${sql.raw(perfectExpenseStart)}' 
                 AND ${inboxItem.date}::date + INTERVAL '${sql.raw(perfectExpenseEnd)}')
            OR
            -- Invoices: payment usually happens AFTER invoice (with banking delay)  
            (${inboxType} = 'invoice'
             AND ${transactions.date} BETWEEN ${inboxItem.date}::date - INTERVAL '${sql.raw(perfectInvoiceStart)}'
                 AND ${inboxItem.date}::date + INTERVAL '${sql.raw(perfectInvoiceEnd)}')
          )
          OR
          -- Strong semantic matches with accounting logic
          ((${inboxEmbeddings.embedding} <=> ${transactionEmbeddings.embedding}) < 0.3
           AND ABS(ABS(${transactions.amount}) - ABS(${inboxAmount})) < 5.0
           AND (
             -- Expense receipts: moderate backward range (with banking delay)
             (${inboxType} = 'expense'
              AND ${transactions.date} BETWEEN ${inboxItem.date}::date - INTERVAL '${sql.raw(semanticExpenseStart)}'
                  AND ${inboxItem.date}::date + INTERVAL '${sql.raw(semanticExpenseEnd)}')
             OR
             -- Invoices: extended forward range for payment terms (with banking delay)
             (${inboxType} = 'invoice'
              AND ${transactions.date} BETWEEN ${inboxItem.date}::date - INTERVAL '${sql.raw(semanticInvoiceStart)}'
                  AND ${inboxItem.date}::date + INTERVAL '${sql.raw(semanticInvoiceEnd)}')
           ))
          OR
          -- Decent matches: conservative ranges (with banking delay)
          ((${inboxEmbeddings.embedding} <=> ${transactionEmbeddings.embedding}) < 0.4
           AND ${transactions.date} BETWEEN ${inboxItem.date}::date - INTERVAL '${sql.raw(conservativeStart)}'
               AND ${inboxItem.date}::date + INTERVAL '${sql.raw(conservativeEnd)}')
        )`,
        // Exclude transactions that already have attachments (are already matched)
        sql`NOT EXISTS (SELECT 1 FROM ${transactionAttachments} 
                WHERE ${transactionAttachments.transactionId} = ${transactions.id} 
                AND ${transactionAttachments.teamId} = ${teamId})`,
      ),
    )
    .orderBy(
      // Multi-criteria ordering: amount accuracy, currency match, similarity, date proximity
      sql`ABS(${transactions.amount} - COALESCE(${inboxItem.amount}, 0)) ASC`,
      sql`CASE WHEN ${transactions.currency} = COALESCE(${inboxItem.currency}, '') THEN 0 ELSE 1 END ASC`,
      sql`(${inboxEmbeddings.embedding} <=> ${transactionEmbeddings.embedding})`,
      sql`ABS(${transactions.date}::date - ${inboxItem.date}::date) ASC`,
    )
    .limit(20);

  // Calculate scores and find the single best match
  let bestMatch: MatchResult | null = null;
  let highestConfidence = 0;

  for (const candidate of candidateTransactions) {
    // Convert PostgreSQL cosine distance to similarity score
    // For TIER 1 (exact matches): embeddingScore = 0.1, so similarity = 0.9 (high but not perfect)
    // For TIER 2 (semantic search): use actual cosine similarity from PostgreSQL
    const embeddingScore = Math.max(0, 1 - candidate.embeddingScore);

    const amountScore = calculateAmountScore(
      inboxItem,
      candidate,
      teamBaseCurrency || undefined,
    );
    const currencyScore = calculateCurrencyScore(
      inboxItem.currency || undefined,
      candidate.currency || undefined,
      teamBaseCurrency || undefined,
    );
    const dateScore = calculateDateScore(
      inboxItem.date,
      candidate.date,
      inboxItem.type,
    );

    // Calculate confidence score - embeddings now capture enriched merchant/legal entity data
    let confidenceScore =
      embeddingScore * teamWeights.embeddingWeight +
      amountScore * teamWeights.amountWeight +
      currencyScore * teamWeights.currencyWeight +
      dateScore * teamWeights.dateWeight;

    // Enhanced pattern recognition - prioritize financial accuracy over embeddings
    const hasSameCurrency = inboxItem.currency === candidate.currency;
    const hasExactAmount =
      inboxItem.amount && Math.abs(inboxItem.amount - candidate.amount) < 0.01;
    const hasBaseAmountMatch =
      inboxItem.baseAmount &&
      candidate.baseAmount &&
      Math.abs(inboxItem.baseAmount - candidate.baseAmount) < 0.01;

    // Perfect financial match (same currency + exact amount)
    const isPerfectFinancialMatch = hasSameCurrency && hasExactAmount;

    // Excellent cross-currency match (different currencies but exact base amounts)
    const isExcellentCrossCurrencyMatch =
      !hasSameCurrency &&
      hasBaseAmountMatch &&
      inboxItem.baseCurrency === candidate.baseCurrency;

    // Strong financial match with good semantics
    const isStrongMatch =
      (isPerfectFinancialMatch || isExcellentCrossCurrencyMatch) &&
      embeddingScore > 0.7;

    // Good match with decent financial alignment
    const isGoodMatch = amountScore > 0.85 && embeddingScore > 0.75;

    // Enhanced confidence boosting - financial accuracy first, then semantics
    if (isPerfectFinancialMatch && embeddingScore > 0.8 && dateScore > 0.7) {
      // Perfect: same currency, exact amount, strong semantics, good date
      confidenceScore = Math.max(confidenceScore, 0.98);
    } else if (
      isExcellentCrossCurrencyMatch &&
      embeddingScore > 0.8 &&
      dateScore > 0.7
    ) {
      // Excellent: cross-currency but exact base amounts, strong semantics
      confidenceScore = Math.max(confidenceScore, 0.96);
    } else if (isPerfectFinancialMatch && dateScore > 0.5) {
      // Very good: perfect financial match with reasonable date
      confidenceScore = Math.max(confidenceScore, 0.92);
    } else if (isStrongMatch && dateScore > 0.4) {
      // Strong: good financial + semantic match
      confidenceScore = Math.max(confidenceScore, 0.88);
    } else if (isGoodMatch && dateScore > 0.3) {
      // Good: decent alignment across factors
      confidenceScore = Math.max(confidenceScore, 0.82);
    }

    // Apply penalties for poor matches
    if (inboxItem.currency !== candidate.currency && currencyScore < 0.7) {
      confidenceScore *= 0.9;
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

    // Recurring transaction intelligence boost
    const isRecurringMatch =
      candidate.recurring && hasExactAmount && embeddingScore > 0.7;

    if (isRecurringMatch) {
      confidenceScore = Math.max(confidenceScore, 0.92); // High confidence for recurring patterns
    }

    // Only consider if it meets minimum threshold
    if (confidenceScore >= teamWeights.suggestedMatchThreshold) {
      // Simple tie-breaking: confidence first, then let SQL ordering handle the rest
      const isBetterMatch = confidenceScore > highestConfidence + 0.001; // Small epsilon for floating point

      if (isBetterMatch) {
        // Determine match type with enhanced tiered auto-matching
        let matchType: "auto_matched" | "high_confidence" | "suggested";

        // Enhanced auto-match criteria with multiple confidence tiers
        const autoMatchTiers = {
          perfect: 0.98, // Perfect matches - immediate auto-match
          excellent: 0.95, // Excellent matches - auto-match with high confidence
          highConfidence: 0.92, // High confidence - auto-match for recurring patterns
          conservative: 0.88, // Conservative threshold for team calibration
        };

        if (confidenceScore >= teamWeights.autoMatchThreshold) {
          let shouldAutoMatch = false;

          // TIER 1: Perfect financial matches - most reliable
          if (
            confidenceScore >= autoMatchTiers.perfect &&
            (isPerfectFinancialMatch || isExcellentCrossCurrencyMatch) &&
            embeddingScore >= 0.75 &&
            dateScore >= 0.6
          ) {
            shouldAutoMatch = true;
          }
          // TIER 2: Excellent matches with strong signals
          else if (
            confidenceScore >= autoMatchTiers.excellent &&
            (isPerfectFinancialMatch || isExcellentCrossCurrencyMatch) &&
            embeddingScore >= 0.7 &&
            dateScore >= 0.5
          ) {
            shouldAutoMatch = true;
          }
          // TIER 3: High confidence with recurring transaction intelligence
          else if (
            confidenceScore >= autoMatchTiers.highConfidence &&
            candidate.recurring &&
            isPerfectFinancialMatch &&
            embeddingScore >= 0.65 &&
            dateScore >= 0.4
          ) {
            shouldAutoMatch = true;
          }
          // TIER 4: Conservative auto-match for calibrated teams
          else if (
            confidenceScore >= autoMatchTiers.conservative &&
            calibration.autoMatchAccuracy > 0.98 && // Team has excellent track record
            calibration.totalSuggestions > 20 && // Sufficient data
            (isPerfectFinancialMatch || isExcellentCrossCurrencyMatch) &&
            embeddingScore >= 0.8 &&
            dateScore >= 0.6
          ) {
            shouldAutoMatch = true;
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
          nameScore: Math.round(embeddingScore * 1000) / 1000, // Embeddings capture enriched merchant/legal entity data
          confidenceScore: Math.round(confidenceScore * 1000) / 1000,
          matchType,
          isAlreadyMatched: candidate.isAlreadyMatched,
        };

        highestConfidence = confidenceScore;
      }
    }
  }

  return bestMatch;
}

// Reverse matching - find best inbox match for transaction
export async function findInboxMatches(
  db: Database,
  params: FindInboxMatchesParams,
): Promise<InboxMatchResult | null> {
  const { teamId, transactionId, includeAlreadyMatched = false } = params;

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

  // Get team's base currency and calibrated thresholds
  const [teamData, calibration] = await Promise.all([
    db
      .select({ baseCurrency: teams.baseCurrency })
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1),
    getTeamCalibration(db, teamId),
  ]);

  // Balanced weights - financial accuracy first, then enriched embeddings
  const teamWeights = {
    embeddingWeight: 0.35, // Important but transaction names can be messy
    amountWeight: 0.4, // Primary signal - most reliable data point
    currencyWeight: 0.2, // Critical for cross-currency matching with base amounts
    dateWeight: 0.05, // Supporting signal for temporal alignment
    autoMatchThreshold: calibration.calibratedAutoThreshold, // Learned from user feedback
    suggestedMatchThreshold: calibration.calibratedSuggestedThreshold, // Learned from user feedback
  };

  const teamBaseCurrency = teamData[0]?.baseCurrency;

  // TIER 1: Look for exact currency + amount matches first (fastest and most accurate)
  let candidateInboxItems = await db
    .select({
      inboxId: inbox.id,
      displayName: inbox.displayName,
      amount: inbox.amount,
      currency: inbox.currency,
      baseAmount: inbox.baseAmount,
      baseCurrency: inbox.baseCurrency,
      date: sql<string>`COALESCE(${inbox.date}, ${inbox.createdAt}::date)`,
      website: inbox.website,
      embeddingScore: sql<number>`0.1`.as("embedding_score"), // Perfect match gets best embedding score
      isAlreadyMatched: sql<boolean>`${inbox.transactionId} IS NOT NULL`,
    })
    .from(inbox)
    .where(
      and(
        eq(inbox.teamId, teamId),

        // Exact financial match only - let embeddings handle variations
        sql`${inbox.amount} = ${transactionItem.amount}`,
        eq(inbox.currency, transactionItem.currency),

        // Reasonable date range for exact matches (30 days back, 7 days forward)
        sql`COALESCE(${inbox.date}, ${inbox.createdAt}::date) BETWEEN ${transactionItem.date}::date - INTERVAL '30 days' 
            AND ${transactionItem.date}::date + INTERVAL '7 days'`,

        // Exclude already matched if requested
        ...(includeAlreadyMatched ? [] : [isNull(inbox.transactionId)]),
      ),
    )
    .orderBy(
      sql`ABS(EXTRACT(EPOCH FROM (COALESCE(${inbox.date}, ${inbox.createdAt}::date) - ${transactionItem.date}::date)))`,
    )
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
        date: sql<string>`COALESCE(${inbox.date}, ${inbox.createdAt}::date)`,
        website: inbox.website,
        description: inbox.description,
        embeddingScore: sql<number>`
          (${transactionEmbeddings.embedding} <=> ${inboxEmbeddings.embedding})::DOUBLE PRECISION
        `.as("embedding_score"),
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
            ((ABS(${inbox.amount} - ${transactionItem.amount}) < 0.01 
              AND ${inbox.currency} = ${transactionItem.currency})
             AND (${transactionEmbeddings.embedding} <=> ${inboxEmbeddings.embedding}) < 0.6)
            OR
            -- TIER 2: Strong semantic matches with moderate financial alignment
            ((${transactionEmbeddings.embedding} <=> ${inboxEmbeddings.embedding}) < 0.35
             AND ABS(COALESCE(${inbox.amount}, 0) - ${transactionItem.amount}) < ${Math.max(50, transactionItem.amount * 0.1)})
            OR
            -- TIER 3: Good semantic matches with loose financial alignment
            ((${transactionEmbeddings.embedding} <=> ${inboxEmbeddings.embedding}) < 0.45
             AND ABS(COALESCE(${inbox.amount}, 0) - ${transactionItem.amount}) < ${Math.max(100, transactionItem.amount * 0.2)})
          )`,

          // Wider date range for semantic search
          sql`COALESCE(${inbox.date}, ${inbox.createdAt}::date) BETWEEN ${transactionItem.date}::date - INTERVAL '90 days' 
              AND ${transactionItem.date}::date + INTERVAL '90 days'`,

          // Exclude already matched if requested
          ...(includeAlreadyMatched ? [] : [isNull(inbox.transactionId)]),
        ),
      )
      .orderBy(
        sql`(${transactionEmbeddings.embedding} <=> ${inboxEmbeddings.embedding}) ASC`,
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

    const amountScore = calculateAmountScore(
      candidate,
      transactionItem,
      teamBaseCurrency || undefined,
    );
    const currencyScore = calculateCurrencyScore(
      candidate.currency || undefined,
      transactionItem.currency || undefined,
      teamBaseCurrency || undefined,
    );
    const dateScore = calculateDateScore(candidate.date, transactionItem.date);
    // Calculate confidence score - embeddings handle semantic matching
    let confidenceScore =
      embeddingScore * teamWeights.embeddingWeight +
      amountScore * teamWeights.amountWeight +
      currencyScore * teamWeights.currencyWeight +
      dateScore * teamWeights.dateWeight;

    // Enhanced pattern recognition - prioritize financial accuracy over embeddings
    const hasSameCurrency = candidate.currency === transactionItem.currency;
    const hasExactAmount =
      candidate.amount &&
      Math.abs(candidate.amount - transactionItem.amount) < 0.01;
    const hasBaseAmountMatch =
      candidate.baseAmount &&
      transactionItem.baseAmount &&
      Math.abs(candidate.baseAmount - transactionItem.baseAmount) < 0.01;

    // Perfect financial match (same currency + exact amount)
    const isPerfectFinancialMatch = hasSameCurrency && hasExactAmount;

    // Excellent cross-currency match (different currencies but exact base amounts)
    const isExcellentCrossCurrencyMatch =
      !hasSameCurrency &&
      hasBaseAmountMatch &&
      candidate.baseCurrency === transactionItem.baseCurrency;

    // Strong financial match with good semantics
    const isStrongMatch =
      (isPerfectFinancialMatch || isExcellentCrossCurrencyMatch) &&
      embeddingScore > 0.7;

    // Good match with decent financial alignment
    const isGoodMatch = amountScore > 0.85 && embeddingScore > 0.75;

    // Enhanced confidence boosting - financial accuracy first, then semantics
    if (isPerfectFinancialMatch && embeddingScore > 0.8 && dateScore > 0.7) {
      // Perfect: same currency, exact amount, strong semantics, good date
      confidenceScore = Math.max(confidenceScore, 0.98);
    } else if (
      isExcellentCrossCurrencyMatch &&
      embeddingScore > 0.8 &&
      dateScore > 0.7
    ) {
      // Excellent: cross-currency but exact base amounts, strong semantics
      confidenceScore = Math.max(confidenceScore, 0.96);
    } else if (isPerfectFinancialMatch && dateScore > 0.5) {
      // Very good: perfect financial match with reasonable date
      confidenceScore = Math.max(confidenceScore, 0.92);
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

    // Apply penalties
    if (
      candidate.currency !== transactionItem.currency &&
      currencyScore < 0.8
    ) {
      confidenceScore *= 0.85;
    }

    if (dateScore < 0.3) {
      confidenceScore *= 0.9;
    }

    // Only consider if it meets minimum threshold
    if (confidenceScore >= teamWeights.suggestedMatchThreshold) {
      if (confidenceScore > highestConfidence) {
        // Determine match type with enhanced tiered auto-matching (same logic as forward matching)
        let matchType: "auto_matched" | "high_confidence" | "suggested";

        // Enhanced auto-match criteria with multiple confidence tiers
        const autoMatchTiers = {
          perfect: 0.98, // Perfect matches - immediate auto-match
          excellent: 0.95, // Excellent matches - auto-match with high confidence
          highConfidence: 0.92, // High confidence - auto-match for recurring patterns
          conservative: 0.88, // Conservative threshold for team calibration
        };

        if (confidenceScore >= teamWeights.autoMatchThreshold) {
          let shouldAutoMatch = false;

          // TIER 1: Perfect financial matches - most reliable
          if (
            confidenceScore >= autoMatchTiers.perfect &&
            (isPerfectFinancialMatch || isExcellentCrossCurrencyMatch) &&
            embeddingScore >= 0.75 &&
            dateScore >= 0.6
          ) {
            shouldAutoMatch = true;
          }
          // TIER 2: Excellent matches with strong signals
          else if (
            confidenceScore >= autoMatchTiers.excellent &&
            (isPerfectFinancialMatch || isExcellentCrossCurrencyMatch) &&
            embeddingScore >= 0.7 &&
            dateScore >= 0.5
          ) {
            shouldAutoMatch = true;
          }
          // TIER 3: Conservative auto-match for calibrated teams (inbox matching doesn't have recurring info)
          else if (
            confidenceScore >= autoMatchTiers.conservative &&
            calibration.autoMatchAccuracy > 0.98 && // Team has excellent track record
            calibration.totalSuggestions > 20 && // Sufficient data
            (isPerfectFinancialMatch || isExcellentCrossCurrencyMatch) &&
            embeddingScore >= 0.8 &&
            dateScore >= 0.6
          ) {
            shouldAutoMatch = true;
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
          date: candidate.date,
          embeddingScore: Math.round(embeddingScore * 1000) / 1000,
          amountScore: Math.round(amountScore * 1000) / 1000,
          currencyScore: Math.round(currencyScore * 1000) / 1000,
          dateScore: Math.round(dateScore * 1000) / 1000,
          nameScore: Math.round(embeddingScore * 1000) / 1000, // Embeddings capture enriched merchant/legal entity data
          confidenceScore: Math.round(confidenceScore * 1000) / 1000,
          matchType,
          isAlreadyMatched: candidate.isAlreadyMatched,
        };

        highestConfidence = confidenceScore;
      }
    }
  }

  return bestMatch;
}

// Helper scoring functions
function calculateAmountScore(
  item1: any,
  item2: any,
  teamBaseCurrency?: string,
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

  // PRIORITY 3: Try team base currency conversion if we have the data
  if (
    teamBaseCurrency &&
    baseCurrency1 === teamBaseCurrency &&
    baseCurrency2 === teamBaseCurrency
  ) {
    // Both are already in team base currency
    if (baseAmount1 && baseAmount2) {
      return calculateAmountDifferenceScore(
        baseAmount1,
        baseAmount2,
        "team_base",
      );
    }
  }

  // PRIORITY 4: Different currencies, no base amount conversion available
  // Give partial credit but penalize for currency mismatch
  if (currency1 !== currency2) {
    const rawScore = calculateAmountDifferenceScore(
      amount1,
      amount2,
      "different_currency",
    );
    // Penalize cross-currency matches that we can't properly convert
    return rawScore * 0.6; // 40% penalty for unresolved currency difference
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

  // Only use absolute value comparison for cross-currency base matching
  // This handles invoice (positive) to payment (negative) scenarios
  if (matchType === "cross_currency_base" || matchType === "base_currency") {
    const sameSign =
      (amount1 > 0 && amount2 > 0) || (amount1 < 0 && amount2 < 0);
    const oppositeSigns =
      (amount1 > 0 && amount2 < 0) || (amount1 < 0 && amount2 > 0);

    // Use absolute values only for opposite signs (invoice vs payment scenario)
    if (oppositeSigns) {
      useAbsoluteValues = true;
    }
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
    crossPerspectivePenalty = 0.9; // 10% penalty to be more conservative
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

function calculateCurrencyScore(
  currency1?: string,
  currency2?: string,
  teamBaseCurrency?: string,
): number {
  if (!currency1 || !currency2) return 0.5;

  // HIGHEST PRIORITY: Exact currency match
  if (currency1 === currency2) return 1.0;

  // SECOND PRIORITY: Both match team base currency (converted amounts)
  if (
    teamBaseCurrency &&
    currency1 === teamBaseCurrency &&
    currency2 === teamBaseCurrency
  ) {
    return 0.95; // Very high but slightly less than exact match
  }

  // THIRD PRIORITY: One matches team base currency (partial conversion)
  if (
    teamBaseCurrency &&
    (currency1 === teamBaseCurrency || currency2 === teamBaseCurrency)
  ) {
    return 0.75;
  }

  // FOURTH PRIORITY: Different currencies but we have conversion capability
  // (This assumes we have exchange rates available)
  return 0.5;
}

function calculateDateScore(
  inboxDate: string,
  transactionDate: string,
  inboxType?: string | null,
): number {
  const inboxDateObj = new Date(inboxDate);
  const transactionDateObj = new Date(transactionDate);

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

// Note: Manual name matching removed - embeddings now handle merchant/legal entity matching
// more effectively through enriched transaction data

// Create a match suggestion record
export async function createMatchSuggestion(
  db: Database,
  params: CreateMatchSuggestionParams,
) {
  const suggestion = await db
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
      nameScore: params.nameScore,
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
        nameScore: params.nameScore,
        matchType: params.matchType,
        matchDetails: params.matchDetails,
        status: params.status || "pending",
        updatedAt: sql`NOW()`,
      },
    })
    .returning();

  return suggestion[0];
}

// Get the best suggestion for an inbox item
export async function getInboxSuggestion(
  db: Database,
  params: { teamId: string; inboxId: string },
): Promise<InboxSuggestion | null> {
  const { teamId, inboxId } = params;

  const result = await db
    .select({
      id: transactionMatchSuggestions.id,
      transactionId: transactionMatchSuggestions.transactionId,
      transactionName: transactions.name,
      transactionAmount: transactions.amount,
      transactionCurrency: transactions.currency,
      transactionDate: transactions.date,
      confidenceScore: transactionMatchSuggestions.confidenceScore,
      matchType: transactionMatchSuggestions.matchType,
      status: transactionMatchSuggestions.status,
    })
    .from(transactionMatchSuggestions)
    .innerJoin(
      transactions,
      eq(transactionMatchSuggestions.transactionId, transactions.id),
    )
    .where(
      and(
        eq(transactionMatchSuggestions.teamId, teamId),
        eq(transactionMatchSuggestions.inboxId, inboxId),
        eq(transactionMatchSuggestions.status, "pending"), // Only pending suggestions
      ),
    )
    .orderBy(desc(transactionMatchSuggestions.confidenceScore))
    .limit(1);

  if (!result[0]) return null;

  const suggestion = result[0];
  return {
    id: suggestion.id,
    transactionId: suggestion.transactionId,
    transactionName: suggestion.transactionName,
    transactionAmount: suggestion.transactionAmount,
    transactionCurrency: suggestion.transactionCurrency,
    transactionDate: suggestion.transactionDate,
    confidenceScore: Number(suggestion.confidenceScore),
    matchType: suggestion.matchType as
      | "auto_matched"
      | "high_confidence"
      | "suggested",
    status: suggestion.status as
      | "pending"
      | "confirmed"
      | "declined"
      | "expired",
  };
}
