import { getDb } from "@jobs/init";
import { mcaDeals, mcaPayments, merchants, transactions, matchAuditLog } from "@midday/db/schema";
import { logger, schemaTask } from "@trigger.dev/sdk";
import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";

const BATCH_SIZE = 100;

// Bank description keywords indicating bank fees (not deal payments)
const BANK_FEE_KEYWORDS = [
  "fee",
  "charge",
  "service charge",
  "maintenance",
  "overdraft",
  "wire fee",
  "ach fee",
  "monthly fee",
  "annual fee",
  "interest",
];

type MatchSuggestion = {
  dealId: string;
  dealCode: string;
  merchantName: string;
  expectedAmount: number;
  confidence: number;
  rule: string;
};

export const reconcileTransactions = schemaTask({
  id: "reconcile-transactions",
  maxDuration: 180,
  queue: {
    concurrencyLimit: 5,
  },
  schema: z.object({
    transactionIds: z.array(z.string().uuid()),
    teamId: z.string().uuid(),
  }),
  run: async ({ transactionIds, teamId }) => {
    const db = getDb();

    logger.info("Starting auto-reconciliation", {
      transactionCount: transactionIds.length,
      teamId,
    });

    // 1. Load all active deals for this team with merchant names
    const activeDeals = await db
      .select({
        id: mcaDeals.id,
        dealCode: mcaDeals.dealCode,
        dailyPayment: mcaDeals.dailyPayment,
        paymentFrequency: mcaDeals.paymentFrequency,
        status: mcaDeals.status,
        currentBalance: mcaDeals.currentBalance,
        merchantName: merchants.name,
        merchantId: merchants.id,
        firstPaymentDate: mcaDeals.firstPaymentDate,
        startDate: mcaDeals.startDate,
      })
      .from(mcaDeals)
      .leftJoin(merchants, eq(merchants.id, mcaDeals.merchantId))
      .where(
        and(eq(mcaDeals.teamId, teamId), eq(mcaDeals.status, "active")),
      );

    if (activeDeals.length === 0) {
      logger.info("No active deals found, skipping reconciliation");
      return { matched: 0, suggested: 0, unmatched: transactionIds.length };
    }

    // 2. Process transactions in batches
    let totalAutoMatched = 0;
    let totalSuggested = 0;
    let totalUnmatched = 0;

    for (let i = 0; i < transactionIds.length; i += BATCH_SIZE) {
      const batchIds = transactionIds.slice(i, i + BATCH_SIZE);

      // Fetch the transactions for this batch
      const txBatch = await db
        .select({
          id: transactions.id,
          date: transactions.date,
          name: transactions.name,
          amount: transactions.amount,
          matchStatus: transactions.matchStatus,
          counterpartyName: transactions.counterpartyName,
          merchantName: transactions.merchantName,
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.teamId, teamId),
            inArray(transactions.id, batchIds),
            // Only process unmatched transactions
            eq(transactions.matchStatus, "unmatched"),
          ),
        );

      for (const tx of txBatch) {
        const result = matchTransaction(tx, activeDeals);

        if (result.action === "auto_match" && result.bestMatch) {
          // Auto-match: high confidence
          await db
            .update(transactions)
            .set({
              matchStatus: "auto_matched",
              matchConfidence: result.bestMatch.confidence,
              matchedDealId: result.bestMatch.dealId,
              matchedAt: new Date().toISOString(),
              matchRule: result.bestMatch.rule,
            })
            .where(eq(transactions.id, tx.id));

          // Log to audit trail
          await db.insert(matchAuditLog).values({
            teamId,
            transactionId: tx.id,
            action: "auto_match",
            dealId: result.bestMatch.dealId,
            confidence: result.bestMatch.confidence,
            rule: result.bestMatch.rule,
            newStatus: "auto_matched",
          });

          totalAutoMatched++;
        } else if (
          result.action === "suggest" &&
          result.suggestions.length > 0
        ) {
          // Suggested matches
          await db
            .update(transactions)
            .set({
              matchStatus: "suggested",
              matchConfidence: result.suggestions[0]!.confidence,
              matchedDealId: result.suggestions[0]!.dealId,
              matchRule: result.suggestions[0]!.rule,
              matchSuggestions: result.suggestions.slice(0, 3),
            })
            .where(eq(transactions.id, tx.id));

          await db.insert(matchAuditLog).values({
            teamId,
            transactionId: tx.id,
            action: "suggest",
            dealId: result.suggestions[0]!.dealId,
            confidence: result.suggestions[0]!.confidence,
            rule: result.suggestions[0]!.rule,
            newStatus: "suggested",
          });

          totalSuggested++;
        } else {
          // Unmatched — auto-categorize discrepancy type
          const discrepancyType = categorizeDiscrepancy(tx, txBatch);

          if (discrepancyType) {
            await db
              .update(transactions)
              .set({ discrepancyType })
              .where(eq(transactions.id, tx.id));
          }

          totalUnmatched++;
        }
      }
    }

    logger.info("Reconciliation complete", {
      autoMatched: totalAutoMatched,
      suggested: totalSuggested,
      unmatched: totalUnmatched,
      teamId,
    });

    return {
      matched: totalAutoMatched,
      suggested: totalSuggested,
      unmatched: totalUnmatched,
    };
  },
});

/**
 * Core matching algorithm. Runs rules in priority order against all active deals.
 */
function matchTransaction(
  tx: {
    id: string;
    date: string;
    name: string;
    amount: number;
    counterpartyName: string | null;
    merchantName: string | null;
  },
  deals: {
    id: string;
    dealCode: string;
    dailyPayment: number | null;
    paymentFrequency: string | null;
    merchantName: string | null;
    firstPaymentDate: string | null;
    startDate: string | null;
  }[],
): {
  action: "auto_match" | "suggest" | "unmatched";
  bestMatch?: MatchSuggestion;
  suggestions: MatchSuggestion[];
} {
  const txAmount = Math.abs(tx.amount);
  const txDate = new Date(tx.date);
  const txNameLower = (tx.name || "").toLowerCase();
  const txCounterpartyLower = (tx.counterpartyName || "").toLowerCase();
  const txMerchantLower = (tx.merchantName || "").toLowerCase();

  const suggestions: MatchSuggestion[] = [];

  for (const deal of deals) {
    if (!deal.dailyPayment || deal.dailyPayment <= 0) continue;

    const expectedAmount = deal.dailyPayment;
    const merchantNameLower = (deal.merchantName || "").toLowerCase();
    const amountDiff = Math.abs(txAmount - expectedAmount);
    const amountPct =
      expectedAmount > 0 ? amountDiff / expectedAmount : Infinity;

    // Check if transaction date is on or near an expected payment date
    const daysFromExpected = getBusinessDayDistance(
      txDate,
      deal.firstPaymentDate || deal.startDate,
      deal.paymentFrequency || "daily",
    );

    // Rule 1: Exact amount + expected date (99% confidence)
    if (txAmount === expectedAmount && daysFromExpected === 0) {
      suggestions.push({
        dealId: deal.id,
        dealCode: deal.dealCode,
        merchantName: deal.merchantName ?? "",
        expectedAmount,
        confidence: 0.99,
        rule: `Exact amount $${expectedAmount} matches expected daily payment on expected date`,
      });
      continue;
    }

    // Rule 2: Exact amount + within 2 days (90% confidence)
    if (txAmount === expectedAmount && daysFromExpected <= 2) {
      suggestions.push({
        dealId: deal.id,
        dealCode: deal.dealCode,
        merchantName: deal.merchantName ?? "",
        expectedAmount,
        confidence: 0.9,
        rule: `Exact amount $${expectedAmount} matches, ${daysFromExpected} day(s) from expected date`,
      });
      continue;
    }

    // Rule 3: Exact amount + merchant name in description (85% confidence)
    if (
      txAmount === expectedAmount &&
      merchantNameLower.length >= 3 &&
      (txNameLower.includes(merchantNameLower) ||
        txCounterpartyLower.includes(merchantNameLower) ||
        txMerchantLower.includes(merchantNameLower))
    ) {
      suggestions.push({
        dealId: deal.id,
        dealCode: deal.dealCode,
        merchantName: deal.merchantName ?? "",
        expectedAmount,
        confidence: 0.85,
        rule: `Exact amount $${expectedAmount} with merchant name "${deal.merchantName}" found in description`,
      });
      continue;
    }

    // Rule 4: Amount within 1% + expected date (75% confidence)
    if (amountPct < 0.01 && daysFromExpected === 0) {
      suggestions.push({
        dealId: deal.id,
        dealCode: deal.dealCode,
        merchantName: deal.merchantName ?? "",
        expectedAmount,
        confidence: 0.75,
        rule: `Amount $${txAmount} within 1% of expected $${expectedAmount} on expected date`,
      });
      continue;
    }

    // Rule 5: Fuzzy description + reasonable amount (50-70% confidence)
    const nameMatch =
      merchantNameLower.length >= 3 &&
      (fuzzyContains(txNameLower, merchantNameLower) ||
        fuzzyContains(txCounterpartyLower, merchantNameLower) ||
        txNameLower.includes(deal.dealCode.toLowerCase()));

    if (nameMatch && amountPct < 0.2) {
      const conf = amountPct < 0.05 ? 0.7 : amountPct < 0.1 ? 0.6 : 0.5;
      suggestions.push({
        dealId: deal.id,
        dealCode: deal.dealCode,
        merchantName: deal.merchantName ?? "",
        expectedAmount,
        confidence: conf,
        rule: `Fuzzy match: merchant name/deal code found in description, amount within ${Math.round(amountPct * 100)}%`,
      });
    }
  }

  // Sort suggestions by confidence (highest first)
  suggestions.sort((a, b) => b.confidence - a.confidence);

  if (suggestions.length > 0 && suggestions[0]!.confidence >= 0.9) {
    return {
      action: "auto_match",
      bestMatch: suggestions[0],
      suggestions,
    };
  }

  if (suggestions.length > 0 && suggestions[0]!.confidence >= 0.5) {
    return {
      action: "suggest",
      suggestions,
    };
  }

  return { action: "unmatched", suggestions: [] };
}

/**
 * Compute distance in business days from the nearest expected payment date.
 */
function getBusinessDayDistance(
  txDate: Date,
  firstPaymentDateStr: string | null,
  frequency: string,
): number {
  // For daily frequency, every business day is an expected date
  if (frequency === "daily") {
    const dayOfWeek = txDate.getDay(); // 0=Sun, 6=Sat
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      // Weekend: nearest business day is 1 or 2 days away
      return dayOfWeek === 0 ? 1 : 1;
    }
    return 0; // Weekday = expected date
  }

  // For weekly: check if within 2 days of the weekly payment day
  if (frequency === "weekly" && firstPaymentDateStr) {
    const firstPaymentDate = new Date(firstPaymentDateStr);
    const daysDiff = Math.abs(
      Math.floor(
        (txDate.getTime() - firstPaymentDate.getTime()) /
          (1000 * 60 * 60 * 24),
      ) % 7,
    );
    return Math.min(daysDiff, 7 - daysDiff);
  }

  // Default: assume daily
  return 0;
}

/**
 * Simple fuzzy substring matching — checks if b is approximately in a.
 */
function fuzzyContains(a: string, b: string): boolean {
  if (b.length < 3) return false;
  // Check direct contains
  if (a.includes(b)) return true;

  // Check if first 3+ chars of each word in b appear in a
  const words = b.split(/\s+/).filter((w) => w.length >= 3);
  if (words.length === 0) return false;
  return words.some((word) => a.includes(word));
}

/**
 * Auto-categorize a discrepancy based on transaction characteristics.
 */
function categorizeDiscrepancy(
  tx: { name: string; amount: number },
  allTxInBatch: { name: string; amount: number; date: string }[],
): string | null {
  const txNameLower = tx.name.toLowerCase();
  const txAmount = tx.amount;

  // NSF: negative amount (return/reversal)
  if (txAmount > 0) {
    // Credits to the funder's account could be returns
    // Check if there's a matching debit of the same amount
    const hasMatchingDebit = allTxInBatch.some(
      (other) => other !== tx && Math.abs(other.amount + txAmount) < 0.01,
    );
    if (hasMatchingDebit) {
      return "nsf";
    }
  }

  // Bank fee: keywords in description
  if (
    BANK_FEE_KEYWORDS.some((keyword) => txNameLower.includes(keyword))
  ) {
    return "bank_fee";
  }

  // Duplicate: same amount and name appears more than once in batch
  const duplicateCount = allTxInBatch.filter(
    (other) =>
      other !== tx &&
      Math.abs(other.amount - txAmount) < 0.01 &&
      other.name.toLowerCase() === txNameLower,
  ).length;
  if (duplicateCount > 0) {
    return "duplicate";
  }

  // Default: unrecognized
  return "unrecognized";
}
