import type { Database } from "@db/client";
import {
  mcaDeals,
  syndicatorTransactions,
  syndicators,
} from "@db/schema";
import { and, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm/sql/sql";

// ============================================================================
// Types
// ============================================================================

type SyndicatorTransactionType =
  | "contribution"
  | "withdrawal"
  | "profit_distribution"
  | "refund"
  | "fee"
  | "chargeback"
  | "transfer"
  | "deal_allocation";

type SyndicatorPaymentMethod = "ach" | "wire" | "check" | "zelle" | "other";

type GetSyndicatorTransactionsParams = {
  syndicatorId: string;
  teamId: string;
  cursor?: string | null;
  pageSize?: number;
  transactionType?: SyndicatorTransactionType | null;
  dealId?: string | null;
  status?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
};

type GetSyndicatorBalanceParams = {
  syndicatorId: string;
  teamId: string;
};

type GetSyndicatorDealBalanceParams = {
  syndicatorId: string;
  dealId: string;
  teamId: string;
};

type CreateSyndicatorTransactionParams = {
  syndicatorId: string;
  teamId: string;
  date: string;
  transactionType: SyndicatorTransactionType;
  method?: SyndicatorPaymentMethod | null;
  amount: number;
  currency?: string;
  description?: string | null;
  note?: string | null;
  dealId?: string | null;
  participationId?: string | null;
  counterpartySyndicatorId?: string | null;
  status?: "pending" | "completed" | "failed" | "reversed";
  linkedTransactionId?: string | null;
  reference?: string | null;
  createdBy?: string | null;
  metadata?: Record<string, unknown>;
};

type GetCapitalSummaryParams = {
  teamId: string;
};

type GetPortalTransactionsParams = {
  syndicatorId: string;
  teamId: string;
  cursor?: string | null;
  pageSize?: number;
};

type GetTeamSyndicatorTransactionsParams = {
  teamId: string;
  cursor?: string | null;
  pageSize?: number;
  transactionType?: SyndicatorTransactionType | null;
  syndicatorId?: string | null;
  dealId?: string | null;
  status?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  q?: string | null;
};

// Direction: which transaction types increase vs decrease the syndicator's balance
const CREDIT_TYPES: SyndicatorTransactionType[] = [
  "contribution",
  "refund",
];

const DEBIT_TYPES: SyndicatorTransactionType[] = [
  "withdrawal",
  "profit_distribution",
  "fee",
  "chargeback",
  "deal_allocation",
];

// Transfer direction is determined by whether the syndicator is the sender or receiver,
// handled via counterpartySyndicatorId in the query logic

// ============================================================================
// Queries
// ============================================================================

/**
 * Get paginated transaction list for a syndicator, with optional filters
 */
export async function getSyndicatorTransactions(
  db: Database,
  params: GetSyndicatorTransactionsParams,
) {
  const {
    syndicatorId,
    teamId,
    cursor,
    pageSize = 25,
    transactionType,
    dealId,
    status,
    dateFrom,
    dateTo,
  } = params;

  const conditions: SQL[] = [
    eq(syndicatorTransactions.syndicatorId, syndicatorId),
    eq(syndicatorTransactions.teamId, teamId),
  ];

  if (transactionType) {
    conditions.push(
      eq(syndicatorTransactions.transactionType, transactionType),
    );
  }
  if (dealId) {
    conditions.push(eq(syndicatorTransactions.dealId, dealId));
  }
  if (status) {
    conditions.push(eq(syndicatorTransactions.status, status));
  }
  if (dateFrom) {
    conditions.push(gte(syndicatorTransactions.date, dateFrom));
  }
  if (dateTo) {
    conditions.push(lte(syndicatorTransactions.date, dateTo));
  }

  const offset = cursor ? Number.parseInt(cursor, 10) : 0;

  const data = await db
    .select({
      id: syndicatorTransactions.id,
      createdAt: syndicatorTransactions.createdAt,
      date: syndicatorTransactions.date,
      syndicatorId: syndicatorTransactions.syndicatorId,
      transactionType: syndicatorTransactions.transactionType,
      method: syndicatorTransactions.method,
      amount: syndicatorTransactions.amount,
      currency: syndicatorTransactions.currency,
      description: syndicatorTransactions.description,
      note: syndicatorTransactions.note,
      dealId: syndicatorTransactions.dealId,
      counterpartySyndicatorId: syndicatorTransactions.counterpartySyndicatorId,
      status: syndicatorTransactions.status,
      balanceBefore: syndicatorTransactions.balanceBefore,
      balanceAfter: syndicatorTransactions.balanceAfter,
      reference: syndicatorTransactions.reference,
      // Join deal info when available
      dealCode: mcaDeals.dealCode,
      merchantName: sql<string | null>`(
        SELECT name FROM merchants WHERE merchants.id = ${mcaDeals.merchantId}
      )`,
    })
    .from(syndicatorTransactions)
    .leftJoin(mcaDeals, eq(mcaDeals.id, syndicatorTransactions.dealId))
    .where(and(...conditions))
    .orderBy(desc(syndicatorTransactions.date), desc(syndicatorTransactions.createdAt))
    .limit(pageSize)
    .offset(offset);

  const nextCursor =
    data.length === pageSize ? (offset + pageSize).toString() : undefined;

  return {
    meta: {
      cursor: nextCursor ?? null,
      hasPreviousPage: offset > 0,
      hasNextPage: data.length === pageSize,
    },
    data,
  };
}

/**
 * Compute the current available balance for a syndicator.
 * Uses SUM with direction rules based on transaction_type.
 */
export async function getSyndicatorBalance(
  db: Database,
  params: GetSyndicatorBalanceParams,
) {
  const [result] = await db
    .select({
      availableBalance: sql<number>`coalesce(sum(
        CASE
          WHEN ${syndicatorTransactions.transactionType} IN ('contribution', 'refund') THEN ${syndicatorTransactions.amount}
          WHEN ${syndicatorTransactions.transactionType} IN ('withdrawal', 'profit_distribution', 'fee', 'chargeback', 'deal_allocation') THEN -${syndicatorTransactions.amount}
          WHEN ${syndicatorTransactions.transactionType} = 'transfer' AND ${syndicatorTransactions.counterpartySyndicatorId} IS NOT NULL THEN -${syndicatorTransactions.amount}
          WHEN ${syndicatorTransactions.transactionType} = 'transfer' AND ${syndicatorTransactions.counterpartySyndicatorId} IS NULL THEN ${syndicatorTransactions.amount}
          ELSE 0
        END
      ), 0)`,
      totalContributed: sql<number>`coalesce(sum(
        CASE WHEN ${syndicatorTransactions.transactionType} = 'contribution' THEN ${syndicatorTransactions.amount} ELSE 0 END
      ), 0)`,
      totalWithdrawn: sql<number>`coalesce(sum(
        CASE WHEN ${syndicatorTransactions.transactionType} = 'withdrawal' THEN ${syndicatorTransactions.amount} ELSE 0 END
      ), 0)`,
      totalDistributed: sql<number>`coalesce(sum(
        CASE WHEN ${syndicatorTransactions.transactionType} = 'profit_distribution' THEN ${syndicatorTransactions.amount} ELSE 0 END
      ), 0)`,
      totalAllocated: sql<number>`coalesce(sum(
        CASE WHEN ${syndicatorTransactions.transactionType} = 'deal_allocation' THEN ${syndicatorTransactions.amount} ELSE 0 END
      ), 0)`,
      totalFees: sql<number>`coalesce(sum(
        CASE WHEN ${syndicatorTransactions.transactionType} = 'fee' THEN ${syndicatorTransactions.amount} ELSE 0 END
      ), 0)`,
      transactionCount: sql<number>`cast(count(*) as int)`,
    })
    .from(syndicatorTransactions)
    .where(
      and(
        eq(syndicatorTransactions.syndicatorId, params.syndicatorId),
        eq(syndicatorTransactions.teamId, params.teamId),
        eq(syndicatorTransactions.status, "completed"),
      ),
    );

  return result;
}

/**
 * Compute syndicator balance for a specific deal
 */
export async function getSyndicatorDealBalance(
  db: Database,
  params: GetSyndicatorDealBalanceParams,
) {
  const [result] = await db
    .select({
      dealBalance: sql<number>`coalesce(sum(
        CASE
          WHEN ${syndicatorTransactions.transactionType} IN ('contribution', 'refund', 'deal_allocation') THEN ${syndicatorTransactions.amount}
          WHEN ${syndicatorTransactions.transactionType} IN ('withdrawal', 'profit_distribution', 'fee', 'chargeback') THEN -${syndicatorTransactions.amount}
          ELSE 0
        END
      ), 0)`,
      transactionCount: sql<number>`cast(count(*) as int)`,
    })
    .from(syndicatorTransactions)
    .where(
      and(
        eq(syndicatorTransactions.syndicatorId, params.syndicatorId),
        eq(syndicatorTransactions.dealId, params.dealId),
        eq(syndicatorTransactions.teamId, params.teamId),
        eq(syndicatorTransactions.status, "completed"),
      ),
    );

  return result;
}

/**
 * Create a syndicator transaction with balance_before/balance_after audit trail.
 *
 * Note: deal_allocation at the deal level is a CREDIT (increases deal balance),
 * but at the account level it's a DEBIT (decreases available balance).
 */
export async function createSyndicatorTransaction(
  db: Database,
  params: CreateSyndicatorTransactionParams,
) {
  // Get current balance to compute balance_before
  const balance = await getSyndicatorBalance(db, {
    syndicatorId: params.syndicatorId,
    teamId: params.teamId,
  });

  const currentBalance = balance?.availableBalance ?? 0;

  // Determine direction
  let delta: number;
  if (CREDIT_TYPES.includes(params.transactionType)) {
    delta = params.amount;
  } else if (DEBIT_TYPES.includes(params.transactionType)) {
    delta = -params.amount;
  } else if (params.transactionType === "transfer") {
    // If counterparty is set, this syndicator is SENDING (debit)
    // If not set, this syndicator is RECEIVING (credit)
    delta = params.counterpartySyndicatorId ? -params.amount : params.amount;
  } else {
    delta = 0;
  }

  const newBalance = currentBalance + delta;

  const [transaction] = await db
    .insert(syndicatorTransactions)
    .values({
      syndicatorId: params.syndicatorId,
      teamId: params.teamId,
      date: params.date,
      transactionType: params.transactionType,
      method: params.method,
      amount: params.amount,
      currency: params.currency ?? "USD",
      description: params.description,
      note: params.note,
      dealId: params.dealId,
      participationId: params.participationId,
      counterpartySyndicatorId: params.counterpartySyndicatorId,
      status: params.status ?? "completed",
      balanceBefore: currentBalance,
      balanceAfter: newBalance,
      linkedTransactionId: params.linkedTransactionId,
      reference: params.reference,
      createdBy: params.createdBy,
      metadata: params.metadata ?? {},
    })
    .returning();

  return transaction;
}

/**
 * Team-wide capital summary across all syndicators
 */
export async function getCapitalSummary(
  db: Database,
  params: GetCapitalSummaryParams,
) {
  const results = await db
    .select({
      syndicatorId: syndicatorTransactions.syndicatorId,
      syndicatorName: syndicators.name,
      companyName: syndicators.companyName,
      availableBalance: sql<number>`coalesce(sum(
        CASE
          WHEN ${syndicatorTransactions.transactionType} IN ('contribution', 'refund') THEN ${syndicatorTransactions.amount}
          WHEN ${syndicatorTransactions.transactionType} IN ('withdrawal', 'profit_distribution', 'fee', 'chargeback', 'deal_allocation') THEN -${syndicatorTransactions.amount}
          WHEN ${syndicatorTransactions.transactionType} = 'transfer' AND ${syndicatorTransactions.counterpartySyndicatorId} IS NOT NULL THEN -${syndicatorTransactions.amount}
          WHEN ${syndicatorTransactions.transactionType} = 'transfer' AND ${syndicatorTransactions.counterpartySyndicatorId} IS NULL THEN ${syndicatorTransactions.amount}
          ELSE 0
        END
      ), 0)`,
      totalContributed: sql<number>`coalesce(sum(
        CASE WHEN ${syndicatorTransactions.transactionType} = 'contribution' THEN ${syndicatorTransactions.amount} ELSE 0 END
      ), 0)`,
      totalWithdrawn: sql<number>`coalesce(sum(
        CASE WHEN ${syndicatorTransactions.transactionType} = 'withdrawal' THEN ${syndicatorTransactions.amount} ELSE 0 END
      ), 0)`,
      transactionCount: sql<number>`cast(count(*) as int)`,
    })
    .from(syndicatorTransactions)
    .innerJoin(syndicators, eq(syndicators.id, syndicatorTransactions.syndicatorId))
    .where(
      and(
        eq(syndicatorTransactions.teamId, params.teamId),
        eq(syndicatorTransactions.status, "completed"),
      ),
    )
    .groupBy(
      syndicatorTransactions.syndicatorId,
      syndicators.name,
      syndicators.companyName,
    );

  return results;
}

/**
 * Get transactions for the public syndicator portal (read-only, minimal data)
 */
export async function getPortalTransactions(
  db: Database,
  params: GetPortalTransactionsParams,
) {
  const { syndicatorId, teamId, cursor, pageSize = 25 } = params;
  const offset = cursor ? Number.parseInt(cursor, 10) : 0;

  const data = await db
    .select({
      id: syndicatorTransactions.id,
      date: syndicatorTransactions.date,
      transactionType: syndicatorTransactions.transactionType,
      method: syndicatorTransactions.method,
      amount: syndicatorTransactions.amount,
      currency: syndicatorTransactions.currency,
      description: syndicatorTransactions.description,
      status: syndicatorTransactions.status,
      balanceAfter: syndicatorTransactions.balanceAfter,
      dealCode: mcaDeals.dealCode,
    })
    .from(syndicatorTransactions)
    .leftJoin(mcaDeals, eq(mcaDeals.id, syndicatorTransactions.dealId))
    .where(
      and(
        eq(syndicatorTransactions.syndicatorId, syndicatorId),
        eq(syndicatorTransactions.teamId, teamId),
        eq(syndicatorTransactions.status, "completed"),
      ),
    )
    .orderBy(desc(syndicatorTransactions.date), desc(syndicatorTransactions.createdAt))
    .limit(pageSize)
    .offset(offset);

  const nextCursor =
    data.length === pageSize ? (offset + pageSize).toString() : undefined;

  return {
    meta: {
      cursor: nextCursor ?? null,
      hasPreviousPage: offset > 0,
      hasNextPage: data.length === pageSize,
    },
    data,
  };
}

/**
 * Team-wide paginated syndicator transactions with search and filters.
 * Used by the "Syndication" tab on the main Transactions page.
 */
export async function getTeamSyndicatorTransactions(
  db: Database,
  params: GetTeamSyndicatorTransactionsParams,
) {
  const {
    teamId,
    cursor,
    pageSize = 25,
    transactionType,
    syndicatorId,
    dealId,
    status,
    dateFrom,
    dateTo,
    q,
  } = params;

  const conditions: SQL[] = [
    eq(syndicatorTransactions.teamId, teamId),
  ];

  if (transactionType) {
    conditions.push(
      eq(syndicatorTransactions.transactionType, transactionType),
    );
  }
  if (syndicatorId) {
    conditions.push(eq(syndicatorTransactions.syndicatorId, syndicatorId));
  }
  if (dealId) {
    conditions.push(eq(syndicatorTransactions.dealId, dealId));
  }
  if (status) {
    conditions.push(eq(syndicatorTransactions.status, status));
  }
  if (dateFrom) {
    conditions.push(gte(syndicatorTransactions.date, dateFrom));
  }
  if (dateTo) {
    conditions.push(lte(syndicatorTransactions.date, dateTo));
  }
  if (q) {
    const pattern = `%${q}%`;
    conditions.push(
      or(
        ilike(syndicatorTransactions.description, pattern),
        ilike(syndicators.name, pattern),
        ilike(syndicators.companyName, pattern),
        ilike(mcaDeals.dealCode, pattern),
      )!,
    );
  }

  const offset = cursor ? Number.parseInt(cursor, 10) : 0;

  const data = await db
    .select({
      id: syndicatorTransactions.id,
      createdAt: syndicatorTransactions.createdAt,
      date: syndicatorTransactions.date,
      syndicatorId: syndicatorTransactions.syndicatorId,
      syndicatorName: syndicators.name,
      syndicatorCompanyName: syndicators.companyName,
      transactionType: syndicatorTransactions.transactionType,
      method: syndicatorTransactions.method,
      amount: syndicatorTransactions.amount,
      currency: syndicatorTransactions.currency,
      description: syndicatorTransactions.description,
      dealId: syndicatorTransactions.dealId,
      status: syndicatorTransactions.status,
      balanceAfter: syndicatorTransactions.balanceAfter,
      reference: syndicatorTransactions.reference,
      dealCode: mcaDeals.dealCode,
    })
    .from(syndicatorTransactions)
    .innerJoin(syndicators, eq(syndicators.id, syndicatorTransactions.syndicatorId))
    .leftJoin(mcaDeals, eq(mcaDeals.id, syndicatorTransactions.dealId))
    .where(and(...conditions))
    .orderBy(desc(syndicatorTransactions.date), desc(syndicatorTransactions.createdAt))
    .limit(pageSize)
    .offset(offset);

  const nextCursor =
    data.length === pageSize ? (offset + pageSize).toString() : undefined;

  return {
    meta: {
      cursor: nextCursor ?? null,
      hasPreviousPage: offset > 0,
      hasNextPage: data.length === pageSize,
    },
    data,
  };
}

/**
 * Count of all syndicator transactions for a team (used for tab badge).
 */
export async function getTeamSyndicatorTransactionCount(
  db: Database,
  params: { teamId: string },
) {
  const [result] = await db
    .select({
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(syndicatorTransactions)
    .where(eq(syndicatorTransactions.teamId, params.teamId));

  return { count: result?.count ?? 0 };
}
