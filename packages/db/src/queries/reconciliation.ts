import type { Database } from "@db/client";
import {
  transactions,
  mcaDeals,
  mcaPayments,
  merchants,
  reconciliationSessions,
  matchAuditLog,
} from "@db/schema";
import { and, asc, count, desc, eq, gte, inArray, isNull, lte, ne, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm/sql/sql";

// ============================================================================
// Payment Feed Queries
// ============================================================================

export type GetPaymentFeedParams = {
  teamId: string;
  matchStatus?: string[] | null;
  start?: string | null;
  end?: string | null;
  bankAccountId?: string | null;
  dealId?: string | null;
  q?: string | null;
  amountMin?: number | null;
  amountMax?: number | null;
  cursor?: string | null;
  pageSize?: number;
  sort?: string[] | null;
};

export const getPaymentFeed = async (
  db: Database,
  params: GetPaymentFeedParams,
) => {
  const {
    teamId,
    matchStatus,
    start,
    end,
    bankAccountId,
    dealId,
    q,
    amountMin,
    amountMax,
    cursor,
    pageSize = 50,
    sort,
  } = params;

  const whereConditions: SQL[] = [eq(transactions.teamId, teamId)];

  if (matchStatus && matchStatus.length > 0) {
    whereConditions.push(
      inArray(
        transactions.matchStatus,
        matchStatus as (typeof transactions.matchStatus.enumValues)[number][],
      ),
    );
  }

  if (start) {
    whereConditions.push(gte(transactions.date, start));
  }

  if (end) {
    whereConditions.push(lte(transactions.date, end));
  }

  if (bankAccountId) {
    whereConditions.push(eq(transactions.bankAccountId, bankAccountId));
  }

  if (dealId) {
    whereConditions.push(eq(transactions.matchedDealId, dealId));
  }

  if (q) {
    whereConditions.push(
      sql`${transactions.ftsVector} @@ plainto_tsquery('english', ${q})`,
    );
  }

  if (amountMin !== undefined && amountMin !== null) {
    whereConditions.push(gte(transactions.amount, amountMin));
  }

  if (amountMax !== undefined && amountMax !== null) {
    whereConditions.push(lte(transactions.amount, amountMax));
  }

  if (cursor) {
    whereConditions.push(sql`${transactions.date} < ${cursor}`);
  }

  // Sort
  let orderBy = desc(transactions.date);
  if (sort && sort.length > 0) {
    const [field, direction] = sort[0]!.split(":");
    const isAsc = direction === "asc";
    switch (field) {
      case "amount":
        orderBy = isAsc ? asc(transactions.amount) : desc(transactions.amount);
        break;
      case "matchStatus":
        orderBy = isAsc
          ? asc(transactions.matchStatus)
          : desc(transactions.matchStatus);
        break;
      case "matchConfidence":
        orderBy = isAsc
          ? asc(transactions.matchConfidence)
          : desc(transactions.matchConfidence);
        break;
      default:
        orderBy = isAsc ? asc(transactions.date) : desc(transactions.date);
    }
  }

  const data = await db
    .select({
      id: transactions.id,
      date: transactions.date,
      name: transactions.name,
      amount: transactions.amount,
      currency: transactions.currency,
      method: transactions.method,
      bankAccountId: transactions.bankAccountId,
      status: transactions.status,
      counterpartyName: transactions.counterpartyName,
      merchantName: transactions.merchantName,
      description: transactions.description,
      transactionType: transactions.transactionType,
      // Reconciliation fields
      matchStatus: transactions.matchStatus,
      matchConfidence: transactions.matchConfidence,
      matchedDealId: transactions.matchedDealId,
      matchedPaymentId: transactions.matchedPaymentId,
      matchedAt: transactions.matchedAt,
      matchRule: transactions.matchRule,
      matchSuggestions: transactions.matchSuggestions,
      reconciliationNote: transactions.reconciliationNote,
      discrepancyType: transactions.discrepancyType,
      // Joined deal info
      dealCode: mcaDeals.dealCode,
      dealMerchantName: merchants.name,
    })
    .from(transactions)
    .leftJoin(mcaDeals, eq(mcaDeals.id, transactions.matchedDealId))
    .leftJoin(merchants, eq(merchants.id, mcaDeals.merchantId))
    .where(and(...whereConditions))
    .orderBy(orderBy)
    .limit(pageSize + 1);

  const hasMore = data.length > pageSize;
  const items = hasMore ? data.slice(0, pageSize) : data;
  const nextCursor = hasMore ? items[items.length - 1]?.date : null;

  return {
    data: items,
    meta: {
      cursor: nextCursor,
      hasMore,
    },
  };
};

// ============================================================================
// Reconciliation Stats
// ============================================================================

export type GetReconciliationStatsParams = {
  teamId: string;
  start?: string | null;
  end?: string | null;
  bankAccountId?: string | null;
};

export const getReconciliationStats = async (
  db: Database,
  params: GetReconciliationStatsParams,
) => {
  const whereConditions: SQL[] = [eq(transactions.teamId, params.teamId)];

  if (params.start) {
    whereConditions.push(gte(transactions.date, params.start));
  }
  if (params.end) {
    whereConditions.push(lte(transactions.date, params.end));
  }
  if (params.bankAccountId) {
    whereConditions.push(
      eq(transactions.bankAccountId, params.bankAccountId),
    );
  }

  const [result] = await db
    .select({
      total: sql<number>`cast(count(*) as int)`,
      autoMatched: sql<number>`cast(count(*) filter (where ${transactions.matchStatus} = 'auto_matched') as int)`,
      suggested: sql<number>`cast(count(*) filter (where ${transactions.matchStatus} = 'suggested') as int)`,
      manualMatched: sql<number>`cast(count(*) filter (where ${transactions.matchStatus} = 'manual_matched') as int)`,
      flagged: sql<number>`cast(count(*) filter (where ${transactions.matchStatus} = 'flagged') as int)`,
      unmatched: sql<number>`cast(count(*) filter (where ${transactions.matchStatus} = 'unmatched') as int)`,
      excluded: sql<number>`cast(count(*) filter (where ${transactions.matchStatus} = 'excluded') as int)`,
      totalAmount: sql<number>`coalesce(sum(abs(${transactions.amount})), 0)`,
      matchedAmount: sql<number>`coalesce(sum(abs(${transactions.amount})) filter (where ${transactions.matchStatus} in ('auto_matched', 'manual_matched')), 0)`,
    })
    .from(transactions)
    .where(and(...whereConditions));

  const matched = (result?.autoMatched ?? 0) + (result?.manualMatched ?? 0);
  const total = result?.total ?? 0;
  const matchRate = total > 0 ? Math.round((matched / total) * 100) : 0;
  // Estimate: manual reconciliation takes ~18 seconds per transaction.
  // Auto-matched transactions save that time.
  const estimatedTimeSaved = Math.round(
    ((result?.autoMatched ?? 0) * 18) / 60,
  );

  return {
    ...result,
    matched,
    matchRate,
    estimatedTimeSaved,
  };
};

// ============================================================================
// Reconciliation View (Split-view data)
// ============================================================================

export type GetReconciliationViewParams = {
  teamId: string;
  start: string;
  end: string;
  bankAccountId?: string | null;
};

export const getReconciliationView = async (
  db: Database,
  params: GetReconciliationViewParams,
) => {
  const txWhere: SQL[] = [
    eq(transactions.teamId, params.teamId),
    gte(transactions.date, params.start),
    lte(transactions.date, params.end),
  ];

  if (params.bankAccountId) {
    txWhere.push(eq(transactions.bankAccountId, params.bankAccountId));
  }

  // Left panel: bank transactions
  const bankTransactions = await db
    .select({
      id: transactions.id,
      date: transactions.date,
      name: transactions.name,
      amount: transactions.amount,
      currency: transactions.currency,
      matchStatus: transactions.matchStatus,
      matchConfidence: transactions.matchConfidence,
      matchedDealId: transactions.matchedDealId,
      matchedPaymentId: transactions.matchedPaymentId,
      matchSuggestions: transactions.matchSuggestions,
      discrepancyType: transactions.discrepancyType,
      counterpartyName: transactions.counterpartyName,
    })
    .from(transactions)
    .where(and(...txWhere))
    .orderBy(desc(transactions.date));

  // Right panel: expected payments from active deals
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
      and(
        eq(mcaDeals.teamId, params.teamId),
        eq(mcaDeals.status, "active"),
      ),
    )
    .orderBy(asc(mcaDeals.dealCode));

  // Compute running totals
  const bankTotal = bankTransactions.reduce(
    (sum, tx) => sum + Math.abs(tx.amount),
    0,
  );
  const expectedTotal = activeDeals.reduce(
    (sum, deal) => sum + (deal.dailyPayment ?? 0),
    0,
  );

  return {
    bankTransactions,
    expectedPayments: activeDeals,
    totals: {
      bankTotal,
      expectedTotal,
      variance: bankTotal - expectedTotal,
    },
  };
};

// ============================================================================
// Discrepancy Queries
// ============================================================================

export type GetDiscrepanciesParams = {
  teamId: string;
  discrepancyType?: string[] | null;
  start?: string | null;
  end?: string | null;
  cursor?: string | null;
  pageSize?: number;
};

export const getDiscrepancies = async (
  db: Database,
  params: GetDiscrepanciesParams,
) => {
  const { teamId, discrepancyType, start, end, cursor, pageSize = 50 } = params;

  const whereConditions: SQL[] = [
    eq(transactions.teamId, teamId),
    or(
      eq(transactions.matchStatus, "unmatched"),
      eq(transactions.matchStatus, "flagged"),
    )!,
  ];

  if (discrepancyType && discrepancyType.length > 0) {
    whereConditions.push(
      inArray(
        transactions.discrepancyType,
        discrepancyType as (typeof transactions.discrepancyType.enumValues)[number][],
      ),
    );
  }

  if (start) {
    whereConditions.push(gte(transactions.date, start));
  }
  if (end) {
    whereConditions.push(lte(transactions.date, end));
  }
  if (cursor) {
    whereConditions.push(sql`${transactions.date} < ${cursor}`);
  }

  const data = await db
    .select({
      id: transactions.id,
      date: transactions.date,
      name: transactions.name,
      amount: transactions.amount,
      currency: transactions.currency,
      matchStatus: transactions.matchStatus,
      matchSuggestions: transactions.matchSuggestions,
      discrepancyType: transactions.discrepancyType,
      reconciliationNote: transactions.reconciliationNote,
      counterpartyName: transactions.counterpartyName,
      merchantName: transactions.merchantName,
      // Compute aging: days since transaction date
      aging: sql<number>`cast(extract(day from now() - ${transactions.date}::timestamp) as int)`,
    })
    .from(transactions)
    .where(and(...whereConditions))
    .orderBy(asc(transactions.date)) // Oldest first (most urgent)
    .limit(pageSize + 1);

  const hasMore = data.length > pageSize;
  const items = hasMore ? data.slice(0, pageSize) : data;
  const nextCursor = hasMore ? items[items.length - 1]?.date : null;

  return {
    data: items,
    meta: { cursor: nextCursor, hasMore },
  };
};

// ============================================================================
// Match Mutations
// ============================================================================

export type ConfirmMatchParams = {
  transactionId: string;
  teamId: string;
  userId: string;
};

export const confirmMatch = async (
  db: Database,
  params: ConfirmMatchParams,
) => {
  const [result] = await db
    .update(transactions)
    .set({
      matchStatus: "manual_matched",
      matchedAt: new Date().toISOString(),
      matchedBy: params.userId,
    })
    .where(
      and(
        eq(transactions.id, params.transactionId),
        eq(transactions.teamId, params.teamId),
        eq(transactions.matchStatus, "suggested"),
      ),
    )
    .returning();

  if (result) {
    await db.insert(matchAuditLog).values({
      teamId: params.teamId,
      transactionId: params.transactionId,
      action: "confirm",
      dealId: result.matchedDealId,
      paymentId: result.matchedPaymentId,
      confidence: result.matchConfidence,
      previousStatus: "suggested",
      newStatus: "manual_matched",
      userId: params.userId,
    });
  }

  return result;
};

export type RejectMatchParams = {
  transactionId: string;
  teamId: string;
  userId: string;
};

export const rejectMatch = async (
  db: Database,
  params: RejectMatchParams,
) => {
  const [result] = await db
    .update(transactions)
    .set({
      matchStatus: "unmatched",
      matchConfidence: null,
      matchedDealId: null,
      matchedPaymentId: null,
      matchedAt: null,
      matchedBy: null,
      matchRule: null,
      matchSuggestions: null,
    })
    .where(
      and(
        eq(transactions.id, params.transactionId),
        eq(transactions.teamId, params.teamId),
      ),
    )
    .returning();

  if (result) {
    await db.insert(matchAuditLog).values({
      teamId: params.teamId,
      transactionId: params.transactionId,
      action: "reject",
      previousStatus: "suggested",
      newStatus: "unmatched",
      userId: params.userId,
    });
  }

  return result;
};

export type ManualMatchParams = {
  transactionId: string;
  dealId: string;
  paymentId?: string | null;
  teamId: string;
  userId: string;
  note?: string | null;
};

export const manualMatch = async (
  db: Database,
  params: ManualMatchParams,
) => {
  const [result] = await db
    .update(transactions)
    .set({
      matchStatus: "manual_matched",
      matchConfidence: 1.0,
      matchedDealId: params.dealId,
      matchedPaymentId: params.paymentId ?? null,
      matchedAt: new Date().toISOString(),
      matchedBy: params.userId,
      matchRule: "manual",
      reconciliationNote: params.note ?? null,
    })
    .where(
      and(
        eq(transactions.id, params.transactionId),
        eq(transactions.teamId, params.teamId),
      ),
    )
    .returning();

  if (result) {
    await db.insert(matchAuditLog).values({
      teamId: params.teamId,
      transactionId: params.transactionId,
      action: "manual_match",
      dealId: params.dealId,
      paymentId: params.paymentId ?? undefined,
      confidence: 1.0,
      newStatus: "manual_matched",
      userId: params.userId,
      note: params.note ?? undefined,
    });
  }

  return result;
};

export type FlagDiscrepancyParams = {
  transactionId: string;
  teamId: string;
  userId: string;
  discrepancyType: string;
  note?: string | null;
};

export const flagDiscrepancy = async (
  db: Database,
  params: FlagDiscrepancyParams,
) => {
  const [result] = await db
    .update(transactions)
    .set({
      matchStatus: "flagged",
      discrepancyType: params.discrepancyType as typeof transactions.discrepancyType.enumValues[number],
      reconciliationNote: params.note ?? null,
    })
    .where(
      and(
        eq(transactions.id, params.transactionId),
        eq(transactions.teamId, params.teamId),
      ),
    )
    .returning();

  if (result) {
    await db.insert(matchAuditLog).values({
      teamId: params.teamId,
      transactionId: params.transactionId,
      action: "flag",
      newStatus: "flagged",
      userId: params.userId,
      note: params.note ?? undefined,
    });
  }

  return result;
};

export type ResolveDiscrepancyParams = {
  transactionId: string;
  teamId: string;
  userId: string;
  resolution: "excluded" | "manual_matched";
  dealId?: string | null;
  note?: string | null;
};

export const resolveDiscrepancy = async (
  db: Database,
  params: ResolveDiscrepancyParams,
) => {
  const [result] = await db
    .update(transactions)
    .set({
      matchStatus: params.resolution,
      matchedDealId: params.dealId ?? null,
      matchedAt: new Date().toISOString(),
      matchedBy: params.userId,
      reconciliationNote: params.note ?? null,
    })
    .where(
      and(
        eq(transactions.id, params.transactionId),
        eq(transactions.teamId, params.teamId),
      ),
    )
    .returning();

  if (result) {
    await db.insert(matchAuditLog).values({
      teamId: params.teamId,
      transactionId: params.transactionId,
      action: "resolve",
      dealId: params.dealId ?? undefined,
      previousStatus: "flagged",
      newStatus: params.resolution,
      userId: params.userId,
      note: params.note ?? undefined,
    });
  }

  return result;
};

export type BulkConfirmMatchesParams = {
  teamId: string;
  userId: string;
  transactionIds?: string[];
  start?: string | null;
  end?: string | null;
};

export const bulkConfirmMatches = async (
  db: Database,
  params: BulkConfirmMatchesParams,
) => {
  const whereConditions: SQL[] = [
    eq(transactions.teamId, params.teamId),
    or(
      eq(transactions.matchStatus, "auto_matched"),
      eq(transactions.matchStatus, "suggested"),
    )!,
  ];

  if (params.transactionIds && params.transactionIds.length > 0) {
    whereConditions.push(inArray(transactions.id, params.transactionIds));
  }

  if (params.start) {
    whereConditions.push(gte(transactions.date, params.start));
  }
  if (params.end) {
    whereConditions.push(lte(transactions.date, params.end));
  }

  const results = await db
    .update(transactions)
    .set({
      matchStatus: "manual_matched",
      matchedAt: new Date().toISOString(),
      matchedBy: params.userId,
    })
    .where(and(...whereConditions))
    .returning({ id: transactions.id });

  return { confirmed: results.length };
};

// ============================================================================
// Reconciliation Sessions
// ============================================================================

export type StartSessionParams = {
  teamId: string;
  userId: string;
  bankAccountId?: string | null;
  dateFrom: string;
  dateTo: string;
};

export const startReconciliationSession = async (
  db: Database,
  params: StartSessionParams,
) => {
  const [result] = await db
    .insert(reconciliationSessions)
    .values({
      teamId: params.teamId,
      userId: params.userId,
      bankAccountId: params.bankAccountId ?? null,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
    })
    .returning();

  return result;
};

export type CompleteSessionParams = {
  sessionId: string;
  teamId: string;
  stats: {
    totalTransactions: number;
    autoMatched: number;
    manuallyMatched: number;
    flagged: number;
    unmatched: number;
  };
};

export const completeReconciliationSession = async (
  db: Database,
  params: CompleteSessionParams,
) => {
  const [result] = await db
    .update(reconciliationSessions)
    .set({
      completedAt: new Date().toISOString(),
      status: "completed",
      totalTransactions: params.stats.totalTransactions,
      autoMatched: params.stats.autoMatched,
      manuallyMatched: params.stats.manuallyMatched,
      flagged: params.stats.flagged,
      unmatched: params.stats.unmatched,
    })
    .where(
      and(
        eq(reconciliationSessions.id, params.sessionId),
        eq(reconciliationSessions.teamId, params.teamId),
      ),
    )
    .returning();

  return result;
};
