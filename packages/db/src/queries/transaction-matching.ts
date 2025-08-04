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
import { and, desc, eq, isNull, sql } from "drizzle-orm";

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

// Core matching algorithm - find best transaction match for inbox item
export async function findMatches(
  db: Database,
  params: FindMatchesParams,
): Promise<MatchResult | null> {
  const { teamId, inboxId, includeAlreadyMatched = false } = params;

  // Use optimized static weights - embeddings handle semantic matching
  const teamWeights = {
    embeddingWeight: 0.35, // Increased - embeddings are excellent for company name matching
    amountWeight: 0.4, // Still primary - financial accuracy is key
    currencyWeight: 0.15, // Important but embeddings + amount matter more
    dateWeight: 0.1, // Reasonable time window
    nameWeight: 0.0, // Removed - embeddings handle this better
    autoMatchThreshold: 0.95,
    suggestedMatchThreshold: 0.7, // Slightly higher since embeddings are more reliable
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

  // TIER 1: Look for exact currency + amount matches first (fastest and most accurate)
  let candidateTransactions = await db
    .select({
      transactionId: transactions.id,
      name: transactions.name,
      amount: transactions.amount,
      currency: transactions.currency,
      baseAmount: transactions.baseAmount,
      baseCurrency: transactions.baseCurrency,
      date: transactions.date,
      counterpartyName: transactions.counterpartyName,
      description: transactions.description,
      embeddingScore: sql<number>`0.1`.as("embedding_score"), // Perfect match gets best embedding score
      isAlreadyMatched: sql<boolean>`
        (EXISTS (SELECT 1 FROM ${transactionAttachments} 
         WHERE ${transactionAttachments.transactionId} = ${transactions.id} 
         AND ${transactionAttachments.teamId} = ${teamId}))
      `,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.teamId, teamId),
        eq(transactions.status, "posted"),

        // Exact financial match
        eq(transactions.amount, inboxItem.amount || 0),
        eq(transactions.currency, inboxItem.currency || ""),

        // Reasonable date range for exact matches (30 days back, 7 days forward)
        sql`${transactions.date} BETWEEN ${inboxItem.date}::date - INTERVAL '30 days' 
            AND ${inboxItem.date}::date + INTERVAL '7 days'`,

        // Exclude already matched if requested
        ...(includeAlreadyMatched
          ? []
          : [
              sql`NOT EXISTS (SELECT 1 FROM ${transactionAttachments} 
              WHERE ${transactionAttachments.transactionId} = ${transactions.id} 
              AND ${transactionAttachments.teamId} = ${teamId})`,
            ]),
      ),
    )
    .orderBy(
      sql`ABS(EXTRACT(EPOCH FROM (${transactions.date}::date - ${inboxItem.date}::date)))`,
    )
    .limit(5);

  // TIER 2: If no exact matches, fall back to embedding-based semantic search
  if (candidateTransactions.length === 0) {
    candidateTransactions = await db
      .select({
        transactionId: transactions.id,
        name: transactions.name,
        amount: transactions.amount,
        currency: transactions.currency,
        baseAmount: transactions.baseAmount,
        baseCurrency: transactions.baseCurrency,
        date: transactions.date,
        counterpartyName: transactions.counterpartyName,
        description: transactions.description,
        embeddingScore: sql<number>`
          (${inboxEmbeddings.embedding} <=> ${transactionEmbeddings.embedding})::DOUBLE PRECISION
        `.as("embedding_score"),
        isAlreadyMatched: sql<boolean>`
          (EXISTS (SELECT 1 FROM ${transactionAttachments} 
           WHERE ${transactionAttachments.transactionId} = ${transactions.id} 
           AND ${transactionAttachments.teamId} = ${teamId}))
        `,
      })
      .from(transactions)
      .innerJoin(
        transactionEmbeddings,
        eq(transactions.id, transactionEmbeddings.transactionId),
      )
      .crossJoin(inboxEmbeddings)
      .where(
        and(
          eq(transactions.teamId, teamId),
          eq(transactions.status, "posted"),
          eq(inboxEmbeddings.inboxId, inboxId),

          // Embedding similarity filter for candidate discovery
          sql`(${inboxEmbeddings.embedding} <=> ${transactionEmbeddings.embedding}) < 0.5`,

          // Wider date range for semantic search
          sql`${transactions.date} BETWEEN ${inboxItem.date}::date - INTERVAL '90 days' 
              AND ${inboxItem.date}::date + INTERVAL '90 days'`,

          // Exclude already matched if requested
          ...(includeAlreadyMatched
            ? []
            : [
                sql`NOT EXISTS (SELECT 1 FROM ${transactionAttachments} 
                WHERE ${transactionAttachments.transactionId} = ${transactions.id} 
                AND ${transactionAttachments.teamId} = ${teamId})`,
              ]),
        ),
      )
      .orderBy(
        sql`(${inboxEmbeddings.embedding} <=> ${transactionEmbeddings.embedding}) ASC`,
      )
      .limit(20);
  }

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
      teamBaseCurrency,
    );
    const currencyScore = calculateCurrencyScore(
      inboxItem.currency,
      candidate.currency,
      teamBaseCurrency,
    );
    const dateScore = calculateDateScore(inboxItem.date, candidate.date);
    // Calculate confidence score - embeddings handle semantic matching
    let confidenceScore =
      embeddingScore * teamWeights.embeddingWeight +
      amountScore * teamWeights.amountWeight +
      currencyScore * teamWeights.currencyWeight +
      dateScore * teamWeights.dateWeight;

    // Enhanced matching for real-world patterns
    const isExactCurrencyAndAmount =
      inboxItem.currency === candidate.currency &&
      inboxItem.amount &&
      Math.abs(inboxItem.amount - candidate.amount) < 0.01;

    const isCloseAmountSameCurrency =
      inboxItem.currency === candidate.currency && amountScore > 0.95;

    const isStrongSemanticMatch = embeddingScore > 0.85;
    const isStrongFinancialMatch = amountScore > 0.9 && currencyScore > 0.9;

    // Perfect match: exact amount, currency, and close date
    if (isExactCurrencyAndAmount && dateScore > 0.7) {
      confidenceScore = Math.max(confidenceScore, 0.95);
    }

    // Very good match: close amount, same currency, reasonable date
    else if (isCloseAmountSameCurrency && dateScore > 0.5) {
      confidenceScore = Math.max(confidenceScore, 0.88);
    }

    // Strong semantic + financial match (handles abbreviations, spelling)
    else if (
      isStrongSemanticMatch &&
      isStrongFinancialMatch &&
      dateScore > 0.4
    ) {
      confidenceScore = Math.max(confidenceScore, 0.82);
    }

    // Good base currency conversion match
    else if (amountScore > 0.85 && dateScore > 0.6 && embeddingScore > 0.7) {
      confidenceScore = Math.max(confidenceScore, 0.75);
    }

    // Apply penalties for poor matches
    if (inboxItem.currency !== candidate.currency && currencyScore < 0.7) {
      confidenceScore *= 0.9; // Less harsh penalty
    }

    if (dateScore < 0.2) {
      confidenceScore *= 0.85; // Penalize very old transactions
    }

    // Boost for strong semantic matches (embeddings handle company variations)
    if (embeddingScore > 0.8) {
      confidenceScore = Math.min(1.0, confidenceScore + 0.05);
    }

    // Only consider if it meets minimum threshold
    if (confidenceScore >= teamWeights.suggestedMatchThreshold) {
      // Check if this is the best match so far
      if (confidenceScore > highestConfidence) {
        // Determine match type
        let matchType: "auto_matched" | "high_confidence" | "suggested";
        if (confidenceScore >= teamWeights.autoMatchThreshold) {
          // Extra strict criteria for auto-match
          const shouldAutoMatch =
            confidenceScore >= 0.95 &&
            amountScore >= 0.98 &&
            currencyScore >= 0.95 &&
            dateScore >= 0.8;
          matchType = shouldAutoMatch ? "auto_matched" : "high_confidence";
        } else if (confidenceScore >= 0.75) {
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
          nameScore: 0, // Using embeddings instead of name matching
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

  // Get team's base currency
  const teamData = await db
    .select({ baseCurrency: teams.baseCurrency })
    .from(teams)
    .where(eq(teams.id, teamId))
    .limit(1);

  // Use optimized static weights - embeddings handle semantic matching
  const teamWeights = {
    embeddingWeight: 0.35, // Increased - embeddings are excellent for company name matching
    amountWeight: 0.4, // Still primary - financial accuracy is key
    currencyWeight: 0.15, // Important but embeddings + amount matter more
    dateWeight: 0.1, // Reasonable time window
    nameWeight: 0.0, // Removed - embeddings handle this better
    autoMatchThreshold: 0.95,
    suggestedMatchThreshold: 0.7, // Slightly higher since embeddings are more reliable
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
      description: inbox.description,
      embeddingScore: sql<number>`0.1`.as("embedding_score"), // Perfect match gets best embedding score
      isAlreadyMatched: sql<boolean>`${inbox.transactionId} IS NOT NULL`,
    })
    .from(inbox)
    .where(
      and(
        eq(inbox.teamId, teamId),

        // Exact financial match
        eq(inbox.amount, transactionItem.amount),
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

          // Embedding similarity filter
          sql`(${transactionEmbeddings.embedding} <=> ${inboxEmbeddings.embedding}) < 0.5`,

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
      teamBaseCurrency,
    );
    const currencyScore = calculateCurrencyScore(
      candidate.currency,
      transactionItem.currency,
      teamBaseCurrency,
    );
    const dateScore = calculateDateScore(candidate.date, transactionItem.date);
    // Calculate confidence score - embeddings handle semantic matching
    let confidenceScore =
      embeddingScore * teamWeights.embeddingWeight +
      amountScore * teamWeights.amountWeight +
      currencyScore * teamWeights.currencyWeight +
      dateScore * teamWeights.dateWeight;

    // Apply same override logic as forward matching
    if (
      candidate.currency === transactionItem.currency &&
      candidate.amount &&
      Math.abs(candidate.amount - transactionItem.amount) < 0.01 &&
      dateScore > 0.8
    ) {
      confidenceScore = Math.max(confidenceScore, 0.92);
    }

    if (
      candidate.currency === transactionItem.currency &&
      amountScore > 0.9 &&
      dateScore > 0.6
    ) {
      confidenceScore = Math.max(confidenceScore, 0.85);
    }

    if (embeddingScore > 0.9 && amountScore > 0.8) {
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
        // Determine match type
        let matchType: "auto_matched" | "high_confidence" | "suggested";
        if (confidenceScore >= teamWeights.autoMatchThreshold) {
          const shouldAutoMatch =
            confidenceScore >= 0.95 &&
            amountScore >= 0.98 &&
            currencyScore >= 0.95 &&
            dateScore >= 0.8;
          matchType = shouldAutoMatch ? "auto_matched" : "high_confidence";
        } else if (confidenceScore >= 0.75) {
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
          nameScore: 0, // Using embeddings instead of name matching
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
    return calculateAmountDifferenceScore(
      baseAmount1,
      baseAmount2,
      "base_currency",
    );
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
    | "team_base"
    | "different_currency"
    | "fallback",
): number {
  const diff = Math.abs(amount1 - amount2);
  const maxAmount = Math.max(Math.abs(amount1), Math.abs(amount2));

  if (maxAmount === 0) return amount1 === amount2 ? 1 : 0;

  const percentageDiff = diff / maxAmount;

  // Adjust scoring based on match type
  let baseScore = 0;

  if (percentageDiff === 0) {
    baseScore = 1.0;
  } else if (percentageDiff <= 0.01) {
    // 1% tolerance
    baseScore = 0.98;
  } else if (percentageDiff <= 0.02) {
    // 2% tolerance
    baseScore = 0.95;
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

    default:
      // For different_currency and fallback cases, penalty already applied in parent function
      return baseScore;
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

function calculateDateScore(date1: string, date2: string): number {
  const date1Obj = new Date(date1);
  const date2Obj = new Date(date2);

  const diffDays = Math.abs(
    (date1Obj.getTime() - date2Obj.getTime()) / (1000 * 60 * 60 * 24),
  );

  // Same day = 1.0, linear decay over 30 days
  if (diffDays === 0) return 1.0;
  if (diffDays <= 1) return 0.95;
  if (diffDays <= 3) return 0.85;
  if (diffDays <= 7) return 0.75;
  if (diffDays <= 14) return 0.6;
  if (diffDays <= 30) return Math.max(0.3, 1 - (diffDays / 30) * 0.7);

  return 0.1; // Very old = minimal score but not zero
}

function calculateNameScore(
  name1: string,
  name2: string,
  counterpartyName?: string | null,
  description?: string | null,
): number {
  if (!name1.trim()) return 0.5;

  const normalizedName1 = name1.toLowerCase().trim();
  const normalizedName2 = name2.toLowerCase().trim();
  const counterparty = (counterpartyName || "").toLowerCase().trim();
  const desc = (description || "").toLowerCase().trim();

  // Direct name matching
  let maxScore = 0;

  // Check exact matches
  if (normalizedName1 === normalizedName2) maxScore = Math.max(maxScore, 1.0);
  if (counterparty && normalizedName1 === counterparty)
    maxScore = Math.max(maxScore, 1.0);

  // Check contains relationships
  if (
    normalizedName1.includes(normalizedName2) ||
    normalizedName2.includes(normalizedName1)
  ) {
    maxScore = Math.max(maxScore, 0.8);
  }
  if (
    counterparty &&
    (normalizedName1.includes(counterparty) ||
      counterparty.includes(normalizedName1))
  ) {
    maxScore = Math.max(maxScore, 0.8);
  }
  if (
    desc &&
    (normalizedName1.includes(desc) || desc.includes(normalizedName1))
  ) {
    maxScore = Math.max(maxScore, 0.6);
  }

  // Use basic similarity for fuzzy matching
  const similarity1 = calculateSimilarity(normalizedName1, normalizedName2);
  const similarity2 = counterparty
    ? calculateSimilarity(normalizedName1, counterparty)
    : 0;
  const similarity3 = desc ? calculateSimilarity(normalizedName1, desc) : 0;

  maxScore = Math.max(maxScore, similarity1, similarity2, similarity3);

  return maxScore;
}

// Simple string similarity calculation
function calculateSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1.0;
  if (str1.length === 0 || str2.length === 0) return 0;

  // Simple approach: count common characters
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  let matches = 0;
  for (let i = 0; i < shorter.length; i++) {
    if (longer.includes(shorter[i])) {
      matches++;
    }
  }

  return matches / longer.length;
}

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
      confidenceScore: params.confidenceScore.toString(),
      amountScore: params.amountScore.toString(),
      currencyScore: params.currencyScore.toString(),
      dateScore: params.dateScore.toString(),
      embeddingScore: params.embeddingScore.toString(),
      nameScore: params.nameScore.toString(),
      matchType: params.matchType,
      matchDetails: params.matchDetails,
      status: params.status || "pending",
      userId: params.userId,
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
