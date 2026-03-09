import { createLoggerWithContext } from "@midday/logger";
import {
  and,
  desc,
  eq,
  inArray,
  isNull,
  notExists,
  or,
  sql,
} from "drizzle-orm";
import type { Database, DatabaseOrTransaction } from "../client";
import {
  inbox,
  transactionAttachments,
  transactionMatchSuggestions,
  transactions,
} from "../schema";
import {
  CALIBRATION_LIMITS,
  calculateAmountScore,
  calculateCurrencyScore,
  calculateDateScore,
  calculateNameScore,
  type MatchType,
  scoreMatch,
} from "../utils/transaction-matching";

const logger = createLoggerWithContext("matching");

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
  nameScore?: number;
  amountScore: number;
  currencyScore: number;
  dateScore: number;
  confidenceScore: number;
  matchType: MatchType;
  isAlreadyMatched: boolean;
};

export type InboxMatchResult = {
  inboxId: string;
  displayName: string | null;
  amount: number | null;
  currency: string | null;
  date: string;
  nameScore?: number;
  amountScore: number;
  currencyScore: number;
  dateScore: number;
  confidenceScore: number;
  matchType: MatchType;
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
  nameScore?: number;
  matchType: MatchType;
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

export type TeamCalibrationData = {
  teamId: string;
  totalSuggestions: number;
  confirmedSuggestions: number;
  declinedSuggestions: number;
  unmatchedSuggestions: number;
  avgConfidenceConfirmed: number;
  avgConfidenceDeclined: number;
  avgConfidenceUnmatched: number;
  suggestedMatchAccuracy: number;
  calibratedSuggestedThreshold: number;
  calibratedAutoThreshold: number;
  thresholdOptimizationSampleSize: number;
  lastUpdated: string;
};

type TeamPairHistoryRow = {
  status: string;
  confidenceScore: number | null;
  createdAt: string;
  inboxName: string | null;
  transactionName: string;
  merchantName: string | null;
};
type TeamPairHistoryMap = Map<string, TeamPairHistoryRow[]>;
const CALIBRATION_CACHE_TTL_MS = 5 * 60 * 1000;
const calibrationCache = new Map<
  string,
  { data: TeamCalibrationData; expiresAt: number }
>();

const PAIR_HISTORY_CACHE_TTL_MS = 5 * 60 * 1000;
const pairHistoryCache = new Map<
  string,
  { data: TeamPairHistoryMap; expiresAt: number }
>();

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function optimizeThresholdFromFeedback(
  performanceData: Array<{
    status: string;
    confidenceScore: number | null;
  }>,
): { threshold: number; sampleSize: number } | null {
  const labeled = performanceData.filter(
    (d) =>
      d.confidenceScore !== null &&
      (d.status === "confirmed" ||
        d.status === "declined" ||
        d.status === "unmatched"),
  );

  const positives = labeled.filter((d) => d.status === "confirmed").length;
  const negatives = labeled.length - positives;
  if (labeled.length < 20 || positives < 5 || negatives < 5) {
    return null;
  }

  let bestThreshold = 0.6;
  let bestF1 = -1;
  let bestPrecision = -1;

  for (let t = 0.25; t <= 0.9; t += 0.01) {
    const threshold = Math.round(t * 1000) / 1000;
    let tp = 0;
    let fp = 0;
    let fn = 0;

    for (const row of labeled) {
      const predictedPositive = Number(row.confidenceScore) >= threshold;
      const isPositive = row.status === "confirmed";
      if (predictedPositive && isPositive) tp++;
      else if (predictedPositive && !isPositive) fp++;
      else if (!predictedPositive && isPositive) fn++;
    }

    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
    const f1 =
      precision + recall > 0
        ? (2 * precision * recall) / (precision + recall)
        : 0;

    if (
      f1 > bestF1 ||
      (Math.abs(f1 - bestF1) < 1e-9 && precision > bestPrecision)
    ) {
      bestF1 = f1;
      bestPrecision = precision;
      bestThreshold = threshold;
    }
  }

  return { threshold: bestThreshold, sampleSize: labeled.length };
}

export async function getTeamCalibration(
  db: Database,
  teamId: string,
): Promise<TeamCalibrationData> {
  const cached = calibrationCache.get(teamId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const defaultSuggestedThreshold = 0.6;
  const defaultAutoThreshold = 0.9;

  const performanceData = await db
    .select({
      status: transactionMatchSuggestions.status,
      confidenceScore: transactionMatchSuggestions.confidenceScore,
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
        sql`${transactionMatchSuggestions.createdAt} > NOW() - INTERVAL '90 days'`,
      ),
    );

  if (performanceData.length < 5) {
    const fallback = {
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
      calibratedAutoThreshold: defaultAutoThreshold,
      thresholdOptimizationSampleSize: 0,
      lastUpdated: new Date().toISOString(),
    };
    calibrationCache.set(teamId, {
      data: fallback,
      expiresAt: Date.now() + CALIBRATION_CACHE_TTL_MS,
    });
    return fallback;
  }

  const confirmed = performanceData.filter((d) => d.status === "confirmed");
  const declined = performanceData.filter((d) => d.status === "declined");
  const unmatched = performanceData.filter((d) => d.status === "unmatched");
  const negativeOutcomes = [...declined, ...unmatched];

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
  const avgConfidenceUnmatched =
    unmatched.length > 0
      ? unmatched.reduce((sum, d) => sum + Number(d.confidenceScore), 0) /
        unmatched.length
      : 0;
  const avgConfidenceNegative =
    negativeOutcomes.length > 0
      ? negativeOutcomes.reduce(
          (sum, d) => sum + Number(d.confidenceScore),
          0,
        ) / negativeOutcomes.length
      : avgConfidenceDeclined;

  const suggestedMatchAccuracy =
    performanceData.length > 0 ? confirmed.length / performanceData.length : 0;

  let calibratedSuggestedThreshold = defaultSuggestedThreshold;

  if (
    suggestedMatchAccuracy > 0.9 &&
    confirmed.length >= CALIBRATION_LIMITS.MIN_SAMPLES_CONSERVATIVE
  ) {
    calibratedSuggestedThreshold = Math.max(
      0.65,
      defaultSuggestedThreshold -
        Math.min(CALIBRATION_LIMITS.MAX_ADJUSTMENT, 0.03),
    );
  } else if (
    suggestedMatchAccuracy > 0.8 &&
    confirmed.length >= CALIBRATION_LIMITS.MIN_SAMPLES_SUGGESTED
  ) {
    calibratedSuggestedThreshold = Math.max(
      0.67,
      defaultSuggestedThreshold -
        Math.min(CALIBRATION_LIMITS.MAX_ADJUSTMENT, 0.02),
    );
  } else if (
    suggestedMatchAccuracy < 0.3 &&
    declined.length >= CALIBRATION_LIMITS.MIN_SAMPLES_SUGGESTED
  ) {
    calibratedSuggestedThreshold = Math.min(
      0.85,
      defaultSuggestedThreshold +
        Math.min(CALIBRATION_LIMITS.MAX_ADJUSTMENT, 0.03),
    );
  }

  if (
    avgConfidenceConfirmed > 0 &&
    avgConfidenceNegative > 0 &&
    confirmed.length >= CALIBRATION_LIMITS.MIN_SAMPLES_SUGGESTED
  ) {
    const confidenceGap = avgConfidenceConfirmed - avgConfidenceNegative;
    if (confidenceGap > 0.2) {
      calibratedSuggestedThreshold = Math.max(
        0.65,
        calibratedSuggestedThreshold -
          Math.min(CALIBRATION_LIMITS.MAX_ADJUSTMENT, 0.025),
      );
    } else if (confidenceGap < 0.08) {
      calibratedSuggestedThreshold = Math.min(
        0.82,
        calibratedSuggestedThreshold +
          Math.min(CALIBRATION_LIMITS.MAX_ADJUSTMENT, 0.02),
      );
    }
  }

  const optimizedThreshold = optimizeThresholdFromFeedback(performanceData);
  if (optimizedThreshold) {
    const optimized = clamp(optimizedThreshold.threshold, 0.55, 0.85);
    // Blend optimized threshold with heuristic threshold for stability.
    calibratedSuggestedThreshold = clamp(
      calibratedSuggestedThreshold * 0.35 + optimized * 0.65,
      0.55,
      0.85,
    );
  }

  // Auto-match threshold stays strict but adapts slightly with team quality.
  const calibratedAutoThreshold = clamp(
    calibratedSuggestedThreshold + 0.24,
    0.88,
    0.95,
  );

  const result = {
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
    calibratedAutoThreshold,
    thresholdOptimizationSampleSize: optimizedThreshold?.sampleSize ?? 0,
    lastUpdated: new Date().toISOString(),
  };
  calibrationCache.set(teamId, {
    data: result,
    expiresAt: Date.now() + CALIBRATION_CACHE_TTL_MS,
  });
  return result;
}

function normalizeNameForLearning(input: string | null | undefined): string {
  if (!input) return "";
  return input
    .toLowerCase()
    .replace(/[.,\-_'"()&]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractDomainToken(url: string | null | undefined): string {
  if (!url) return "";
  const cleaned = url
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0];
  return cleaned?.split(".")[0]?.toLowerCase() ?? "";
}

async function fetchTeamPairHistory(
  db: Database,
  teamId: string,
): Promise<TeamPairHistoryMap> {
  const cached = pairHistoryCache.get(teamId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const rows = await db
    .select({
      status: transactionMatchSuggestions.status,
      confidenceScore: transactionMatchSuggestions.confidenceScore,
      createdAt: transactionMatchSuggestions.createdAt,
      inboxName: inbox.displayName,
      transactionName: transactions.name,
      merchantName: transactions.merchantName,
    })
    .from(transactionMatchSuggestions)
    .innerJoin(inbox, eq(transactionMatchSuggestions.inboxId, inbox.id))
    .innerJoin(
      transactions,
      eq(transactionMatchSuggestions.transactionId, transactions.id),
    )
    .where(
      and(
        eq(transactionMatchSuggestions.teamId, teamId),
        inArray(transactionMatchSuggestions.status, [
          "confirmed",
          "declined",
          "unmatched",
        ]),
        sql`${transactionMatchSuggestions.createdAt} > NOW() - INTERVAL '6 months'`,
      ),
    )
    .orderBy(desc(transactionMatchSuggestions.createdAt))
    .limit(2000);

  const map: TeamPairHistoryMap = new Map();
  for (const row of rows) {
    const key = `${normalizeNameForLearning(row.inboxName)}\0${normalizeNameForLearning(row.merchantName || row.transactionName)}`;
    let entries = map.get(key);
    if (!entries) {
      entries = [];
      map.set(key, entries);
    }
    entries.push(row);
  }
  pairHistoryCache.set(teamId, {
    data: map,
    expiresAt: Date.now() + PAIR_HISTORY_CACHE_TTL_MS,
  });
  return map;
}

type TeamPairHistory = TeamPairHistoryMap;

function lookupPairHistory(
  historyMap: TeamPairHistory,
  normalizedInboxName: string,
  normalizedTransactionName: string,
  maxAgeDays?: number,
) {
  const key = `${normalizedInboxName}\0${normalizedTransactionName}`;
  const rows = historyMap.get(key) ?? [];
  if (maxAgeDays == null) return rows;
  const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
  return rows.filter((r) => new Date(r.createdAt).getTime() > cutoff);
}

function computeMerchantPatterns(
  historyMap: TeamPairHistory,
  normalizedInboxName: string,
  normalizedTransactionName: string,
): {
  canAutoMatch: boolean;
  confidence: number;
  historicalAccuracy: number;
  matchCount: number;
  reason: string;
} {
  if (!normalizedInboxName || !normalizedTransactionName) {
    return {
      canAutoMatch: false,
      confidence: 0,
      historicalAccuracy: 0,
      matchCount: 0,
      reason: "insufficient_name_context",
    };
  }

  const historicalMatches = lookupPairHistory(
    historyMap,
    normalizedInboxName,
    normalizedTransactionName,
  );

  if (historicalMatches.length < 3) {
    return {
      canAutoMatch: false,
      confidence: 0,
      historicalAccuracy: 0,
      matchCount: 0,
      reason: `insufficient_history_${historicalMatches.length}`,
    };
  }

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

  const canAutoMatch =
    confirmed.length >= 3 &&
    accuracy >= 0.9 &&
    negative.length <= 1 &&
    avgConfidence >= 0.85;

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

function computeAliasScore(
  historyMap: TeamPairHistory,
  normalizedInboxName: string,
  normalizedTransactionName: string,
): number {
  const historicalMatches = lookupPairHistory(
    historyMap,
    normalizedInboxName,
    normalizedTransactionName,
  );
  return historicalMatches.filter((m) => m.status === "confirmed").length >= 2
    ? 0.9
    : 0;
}

function computeDeclinePenalty(
  historyMap: TeamPairHistory,
  normalizedInboxName: string,
  normalizedTransactionName: string,
): number {
  const historicalMatches = lookupPairHistory(
    historyMap,
    normalizedInboxName,
    normalizedTransactionName,
    90,
  );
  if (historicalMatches.length === 0) return 0;

  const now = Date.now();
  let declinedWeight = 0;
  let unmatchedWeight = 0;
  let confirmedWeight = 0;
  let recentConfirmedCount = 0;

  for (const row of historicalMatches) {
    const ageDays = Math.max(
      0,
      (now - new Date(row.createdAt).getTime()) / (1000 * 60 * 60 * 24),
    );
    const decay = Math.exp(-ageDays / 45);
    if (row.status === "declined") declinedWeight += decay;
    if (row.status === "unmatched") unmatchedWeight += decay * 0.6;
    if (row.status === "confirmed") {
      confirmedWeight += decay;
      if (ageDays <= 45) recentConfirmedCount++;
    }
  }

  const negativeSignal = declinedWeight + unmatchedWeight;
  if (negativeSignal < 1.5) return 0;

  // Confirmations override negatives if they are both recent and stronger.
  if (recentConfirmedCount >= 2 && confirmedWeight >= negativeSignal) {
    return 0;
  }

  const netSignal = Math.max(0, negativeSignal - confirmedWeight * 0.7);
  if (netSignal <= 0.3) return 0;

  return clamp(0.08 + netSignal * 0.08, 0, 0.35);
}

const AUTO_MATCH_ENABLED = process.env.MATCH_AUTO_ENABLED === "true";

function resolveMatchType(
  confidence: number,
  canAutoMatch: boolean,
  nameScore: number,
  autoThreshold: number,
): MatchType {
  if (
    AUTO_MATCH_ENABLED &&
    confidence >= autoThreshold &&
    canAutoMatch &&
    nameScore >= 0.4
  ) {
    return "auto_matched";
  }
  if (confidence >= 0.72) {
    return "high_confidence";
  }
  return "suggested";
}

export async function findMatches(
  db: Database,
  params: FindMatchesParams & { excludeTransactionIds?: Set<string> },
): Promise<MatchResult | null> {
  const { teamId, inboxId, excludeTransactionIds } = params;

  const [calibration, [inboxItem]] = await Promise.all([
    getTeamCalibration(db, teamId),
    db
      .select({
        id: inbox.id,
        displayName: inbox.displayName,
        amount: inbox.amount,
        currency: inbox.currency,
        baseAmount: inbox.baseAmount,
        baseCurrency: inbox.baseCurrency,
        date: inbox.date,
        type: inbox.type,
        website: inbox.website,
        invoiceNumber: inbox.invoiceNumber,
      })
      .from(inbox)
      .where(and(eq(inbox.id, inboxId), eq(inbox.teamId, teamId)))
      .limit(1),
  ]);

  const suggestedThreshold = Math.max(
    0.6,
    calibration.calibratedSuggestedThreshold,
  );
  const autoThreshold = calibration.calibratedAutoThreshold;

  if (!inboxItem?.date) return null;

  const normalizedInboxName = normalizeNameForLearning(inboxItem.displayName);
  const inboxAmount = Math.abs(inboxItem.amount || 0);
  const inboxBaseAmount = Math.abs(inboxItem.baseAmount || 0);

  const teamPairHistoryPromise = fetchTeamPairHistory(db, teamId);

  const candidates = await db.transaction(async (tx) => {
    await tx.execute(sql`SET LOCAL pg_trgm.word_similarity_threshold = 0.3`);
    return tx
      .select({
        transactionId: transactions.id,
        name: transactions.name,
        amount: transactions.amount,
        currency: transactions.currency,
        baseAmount: transactions.baseAmount,
        baseCurrency: transactions.baseCurrency,
        date: transactions.date,
        merchantName: transactions.merchantName,
        description: transactions.description,
        counterpartyName: transactions.counterpartyName,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.teamId, teamId),
          eq(transactions.status, "posted"),
          sql`${transactions.date} IS NOT NULL`,
          inboxItem.type === "invoice"
            ? sql`${transactions.date} BETWEEN ${sql.param(inboxItem.date)}::date - INTERVAL '90 days' AND ${sql.param(inboxItem.date)}::date + INTERVAL '123 days'`
            : sql`${transactions.date} BETWEEN ${sql.param(inboxItem.date)}::date - INTERVAL '90 days' AND ${sql.param(inboxItem.date)}::date + INTERVAL '30 days'`,
          notExists(
            tx
              .select({ id: transactionAttachments.id })
              .from(transactionAttachments)
              .where(
                and(
                  eq(transactionAttachments.transactionId, transactions.id),
                  eq(transactionAttachments.teamId, teamId),
                ),
              ),
          ),
          notExists(
            tx
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
          or(
            and(
              eq(transactions.currency, inboxItem.currency || ""),
              sql`ABS(ABS(${transactions.amount}) - ${inboxAmount}) < GREATEST(1, ${inboxAmount} * 0.25)`,
            ),
            sql`(${inboxItem.displayName || ""} %> ${transactions.name} OR ${inboxItem.displayName || ""} %> ${transactions.merchantName})`,
            and(
              eq(transactions.baseCurrency, inboxItem.baseCurrency || ""),
              sql`${transactions.baseCurrency} IS NOT NULL`,
              sql`ABS(ABS(COALESCE(${transactions.baseAmount}, 0)) - ${inboxBaseAmount}) < GREATEST(50, ${inboxBaseAmount} * 0.15)`,
            ),
          ),
          excludeTransactionIds && excludeTransactionIds.size > 0
            ? sql`${transactions.id} NOT IN (${sql.join(
                [...excludeTransactionIds].map((id) => sql.param(id)),
                sql`, `,
              )})`
            : undefined,
        ),
      )
      .orderBy(
        sql`GREATEST(word_similarity(${inboxItem.displayName || ""}, ${transactions.name}), word_similarity(${inboxItem.displayName || ""}, ${transactions.merchantName})) DESC`,
        sql`ABS(ABS(${transactions.amount}) - ${inboxAmount}) / GREATEST(1.0, ${inboxAmount})`,
        sql`ABS(${transactions.date} - ${sql.param(inboxItem.date)}::date)`,
      )
      .limit(30);
  });

  const teamPairHistory = await teamPairHistoryPromise;

  const scoredCandidates: MatchResult[] = [];
  for (const candidate of candidates) {
    const normalizedTransactionName = normalizeNameForLearning(
      candidate.merchantName || candidate.name,
    );
    const aliasScore = computeAliasScore(
      teamPairHistory,
      normalizedInboxName,
      normalizedTransactionName,
    );
    const declinePenalty = computeDeclinePenalty(
      teamPairHistory,
      normalizedInboxName,
      normalizedTransactionName,
    );
    const pattern = computeMerchantPatterns(
      teamPairHistory,
      normalizedInboxName,
      normalizedTransactionName,
    );

    let nameScore = calculateNameScore(
      inboxItem.displayName,
      candidate.name,
      candidate.merchantName || candidate.counterpartyName,
      aliasScore,
    );

    const searchableText = normalizeNameForLearning(
      `${candidate.name} ${candidate.merchantName || ""} ${candidate.description || ""} ${candidate.counterpartyName || ""}`,
    );
    const invoiceNumber = normalizeNameForLearning(inboxItem.invoiceNumber);
    if (invoiceNumber.length >= 4 && searchableText.includes(invoiceNumber)) {
      nameScore = Math.max(nameScore, 0.95);
    }
    const domainToken = extractDomainToken(inboxItem.website);
    if (domainToken.length >= 4 && searchableText.includes(domainToken)) {
      nameScore = Math.max(nameScore, 0.88);
    }

    const amountScore = calculateAmountScore(inboxItem, candidate);
    const currencyScore = calculateCurrencyScore(
      inboxItem.currency || undefined,
      candidate.currency || undefined,
      inboxItem.baseCurrency || undefined,
      candidate.baseCurrency || undefined,
    );
    const dateScore = calculateDateScore(
      inboxItem.date,
      candidate.date,
      inboxItem.type,
    );
    const isExactAmount =
      inboxItem.amount !== null &&
      Math.abs(
        Math.abs(inboxItem.amount || 0) - Math.abs(candidate.amount || 0),
      ) < 0.01;
    const isSameCurrency = inboxItem.currency === candidate.currency;

    const confidence = scoreMatch({
      nameScore,
      amountScore,
      dateScore,
      currencyScore,
      isSameCurrency,
      isExactAmount,
      declinePenalty,
    });

    if (confidence < suggestedThreshold) continue;

    const proposed: MatchResult = {
      transactionId: candidate.transactionId,
      name: candidate.name,
      amount: candidate.amount,
      currency: candidate.currency,
      date: candidate.date,
      nameScore: Math.round(nameScore * 1000) / 1000,
      amountScore: Math.round(amountScore * 1000) / 1000,
      currencyScore: Math.round(currencyScore * 1000) / 1000,
      dateScore: Math.round(dateScore * 1000) / 1000,
      confidenceScore: Math.round(confidence * 1000) / 1000,
      matchType: resolveMatchType(
        confidence,
        pattern.canAutoMatch,
        nameScore,
        autoThreshold,
      ),
      isAlreadyMatched: false,
    };

    scoredCandidates.push(proposed);
  }

  scoredCandidates.sort((a, b) => b.confidenceScore - a.confidenceScore);

  const dismissedTxIds = await getDismissedTransactionIds(
    db,
    teamId,
    inboxId,
    scoredCandidates.map((c) => c.transactionId),
  );

  for (const candidate of scoredCandidates) {
    if (dismissedTxIds.has(candidate.transactionId)) {
      logger.info("Skipping dismissed match candidate, trying next", {
        teamId,
        inboxId,
        transactionId: candidate.transactionId,
      });
      continue;
    }
    return candidate;
  }

  return null;
}

export async function findInboxMatches(
  db: Database,
  params: FindInboxMatchesParams & { excludeInboxIds?: Set<string> },
): Promise<InboxMatchResult | null> {
  const { teamId, transactionId, excludeInboxIds } = params;

  const [calibration, [transactionItem]] = await Promise.all([
    getTeamCalibration(db, teamId),
    db
      .select({
        id: transactions.id,
        name: transactions.name,
        amount: transactions.amount,
        currency: transactions.currency,
        baseAmount: transactions.baseAmount,
        baseCurrency: transactions.baseCurrency,
        date: transactions.date,
        merchantName: transactions.merchantName,
        description: transactions.description,
        counterpartyName: transactions.counterpartyName,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.id, transactionId),
          eq(transactions.teamId, teamId),
        ),
      )
      .limit(1),
  ]);

  const suggestedThreshold = Math.max(
    0.6,
    calibration.calibratedSuggestedThreshold,
  );
  const autoThreshold = calibration.calibratedAutoThreshold;

  if (!transactionItem?.date) return null;

  const normalizedTransactionName = normalizeNameForLearning(
    transactionItem.merchantName || transactionItem.name,
  );
  const transactionAmount = Math.abs(transactionItem.amount || 0);
  const transactionBaseAmount = Math.abs(transactionItem.baseAmount || 0);

  const teamPairHistoryPromise = fetchTeamPairHistory(db, teamId);

  const candidates = await db.transaction(async (tx) => {
    await tx.execute(sql`SET LOCAL pg_trgm.word_similarity_threshold = 0.3`);
    return tx
      .select({
        inboxId: inbox.id,
        displayName: inbox.displayName,
        amount: inbox.amount,
        currency: inbox.currency,
        baseAmount: inbox.baseAmount,
        baseCurrency: inbox.baseCurrency,
        date: inbox.date,
        type: inbox.type,
        website: inbox.website,
        invoiceNumber: inbox.invoiceNumber,
      })
      .from(inbox)
      .where(
        and(
          eq(inbox.teamId, teamId),
          isNull(inbox.transactionId),
          inArray(inbox.status, ["pending", "no_match"]),
          sql`${inbox.date} IS NOT NULL`,
          sql`${inbox.date} BETWEEN ${sql.param(transactionItem.date)}::date - (CASE WHEN ${inbox.type} = 'invoice' THEN INTERVAL '123 days' ELSE INTERVAL '90 days' END) AND ${sql.param(transactionItem.date)}::date + INTERVAL '30 days'`,
          or(
            and(
              eq(inbox.currency, transactionItem.currency || ""),
              sql`ABS(ABS(COALESCE(${inbox.amount}, 0)) - ${transactionAmount}) < GREATEST(1, ${transactionAmount} * 0.25)`,
            ),
            sql`(${transactionItem.merchantName || transactionItem.name} %> ${inbox.displayName})`,
            and(
              eq(inbox.baseCurrency, transactionItem.baseCurrency || ""),
              sql`${inbox.baseCurrency} IS NOT NULL`,
              sql`ABS(ABS(COALESCE(${inbox.baseAmount}, 0)) - ${transactionBaseAmount}) < GREATEST(50, ${transactionBaseAmount} * 0.15)`,
            ),
          ),
          excludeInboxIds && excludeInboxIds.size > 0
            ? sql`${inbox.id} NOT IN (${sql.join(
                [...excludeInboxIds].map((id) => sql.param(id)),
                sql`, `,
              )})`
            : undefined,
        ),
      )
      .orderBy(
        sql`word_similarity(${transactionItem.merchantName || transactionItem.name}, COALESCE(${inbox.displayName}, '')) DESC`,
        sql`ABS(ABS(COALESCE(${inbox.amount}, 0)) - ${transactionAmount}) / GREATEST(1.0, ${transactionAmount})`,
        sql`ABS(${inbox.date} - ${sql.param(transactionItem.date)}::date)`,
      )
      .limit(30);
  });

  const teamPairHistory = await teamPairHistoryPromise;

  const scoredCandidates: InboxMatchResult[] = [];
  for (const candidate of candidates) {
    const normalizedInboxName = normalizeNameForLearning(candidate.displayName);
    const aliasScore = computeAliasScore(
      teamPairHistory,
      normalizedInboxName,
      normalizedTransactionName,
    );
    const declinePenalty = computeDeclinePenalty(
      teamPairHistory,
      normalizedInboxName,
      normalizedTransactionName,
    );
    const pattern = computeMerchantPatterns(
      teamPairHistory,
      normalizedInboxName,
      normalizedTransactionName,
    );

    let nameScore = calculateNameScore(
      candidate.displayName,
      transactionItem.name,
      transactionItem.merchantName || transactionItem.counterpartyName,
      aliasScore,
    );

    const searchableText = normalizeNameForLearning(
      `${transactionItem.name} ${transactionItem.merchantName || ""} ${transactionItem.description || ""} ${transactionItem.counterpartyName || ""}`,
    );
    const invoiceNumber = normalizeNameForLearning(candidate.invoiceNumber);
    if (invoiceNumber.length >= 4 && searchableText.includes(invoiceNumber)) {
      nameScore = Math.max(nameScore, 0.95);
    }
    const domainToken = extractDomainToken(candidate.website);
    if (domainToken.length >= 4 && searchableText.includes(domainToken)) {
      nameScore = Math.max(nameScore, 0.88);
    }

    const amountScore = calculateAmountScore(candidate, transactionItem);
    const currencyScore = calculateCurrencyScore(
      candidate.currency || undefined,
      transactionItem.currency || undefined,
      candidate.baseCurrency || undefined,
      transactionItem.baseCurrency || undefined,
    );
    const dateScore = calculateDateScore(
      candidate.date || transactionItem.date,
      transactionItem.date,
      candidate.type,
    );
    const isExactAmount =
      candidate.amount !== null &&
      Math.abs(
        Math.abs(candidate.amount || 0) - Math.abs(transactionItem.amount || 0),
      ) < 0.01;
    const isSameCurrency = candidate.currency === transactionItem.currency;

    const confidence = scoreMatch({
      nameScore,
      amountScore,
      dateScore,
      currencyScore,
      isSameCurrency,
      isExactAmount,
      declinePenalty,
    });

    if (confidence < suggestedThreshold) continue;

    const proposed: InboxMatchResult = {
      inboxId: candidate.inboxId,
      displayName: candidate.displayName,
      amount: candidate.amount,
      currency: candidate.currency,
      date: candidate.date || transactionItem.date,
      nameScore: Math.round(nameScore * 1000) / 1000,
      amountScore: Math.round(amountScore * 1000) / 1000,
      currencyScore: Math.round(currencyScore * 1000) / 1000,
      dateScore: Math.round(dateScore * 1000) / 1000,
      confidenceScore: Math.round(confidence * 1000) / 1000,
      matchType: resolveMatchType(
        confidence,
        pattern.canAutoMatch,
        nameScore,
        autoThreshold,
      ),
      isAlreadyMatched: false,
    };

    scoredCandidates.push(proposed);
  }

  scoredCandidates.sort((a, b) => b.confidenceScore - a.confidenceScore);

  const dismissedInboxIds = await getDismissedInboxIds(
    db,
    teamId,
    transactionId,
    scoredCandidates.map((c) => c.inboxId),
  );

  for (const candidate of scoredCandidates) {
    if (dismissedInboxIds.has(candidate.inboxId)) {
      logger.info("Skipping dismissed reverse match candidate, trying next", {
        teamId,
        transactionId,
        inboxId: candidate.inboxId,
      });
      continue;
    }
    return candidate;
  }

  return null;
}

export async function createMatchSuggestion(
  db: DatabaseOrTransaction,
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
      setWhere: and(
        eq(transactionMatchSuggestions.inboxId, sql`excluded.inbox_id`),
        sql`${transactionMatchSuggestions.status} NOT IN ('confirmed', 'declined')`,
      ),
      set: {
        confidenceScore: params.confidenceScore,
        amountScore: params.amountScore,
        currencyScore: params.currencyScore,
        dateScore: params.dateScore,
        nameScore: params.nameScore,
        matchType: params.matchType,
        matchDetails: params.matchDetails,
        status: params.status || "pending",
        updatedAt: sql`NOW()`,
      },
    })
    .returning();

  return result;
}

async function getDismissedTransactionIds(
  db: Database,
  teamId: string,
  inboxId: string,
  transactionIds: string[],
): Promise<Set<string>> {
  if (transactionIds.length === 0) return new Set();

  const dismissed = await db
    .select({ transactionId: transactionMatchSuggestions.transactionId })
    .from(transactionMatchSuggestions)
    .where(
      and(
        eq(transactionMatchSuggestions.teamId, teamId),
        eq(transactionMatchSuggestions.inboxId, inboxId),
        inArray(transactionMatchSuggestions.transactionId, transactionIds),
        inArray(transactionMatchSuggestions.status, ["declined", "unmatched"]),
      ),
    );

  return new Set(dismissed.map((d) => d.transactionId));
}

async function getDismissedInboxIds(
  db: Database,
  teamId: string,
  transactionId: string,
  inboxIds: string[],
): Promise<Set<string>> {
  if (inboxIds.length === 0) return new Set();

  const dismissed = await db
    .select({ inboxId: transactionMatchSuggestions.inboxId })
    .from(transactionMatchSuggestions)
    .where(
      and(
        eq(transactionMatchSuggestions.teamId, teamId),
        eq(transactionMatchSuggestions.transactionId, transactionId),
        inArray(transactionMatchSuggestions.inboxId, inboxIds),
        inArray(transactionMatchSuggestions.status, ["declined", "unmatched"]),
      ),
    );

  return new Set(dismissed.map((d) => d.inboxId));
}
