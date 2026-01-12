import type { Database, DatabaseOrTransaction } from "@db/client";
import {
  type ExpenseAnomaly,
  type InsightActivity,
  type InsightAnomaly,
  type InsightContent,
  type InsightMetric,
  type InsightMilestone,
  customers,
  inbox,
  type insightPeriodTypeEnum,
  type insightStatusEnum,
  insights,
  invoices,
  trackerEntries,
  trackerProjects,
  transactions,
} from "@db/schema";
import { and, desc, eq, gte, isNotNull, lte, sql } from "drizzle-orm";

/**
 * Insight type returned from database queries
 */
export type Insight = typeof insights.$inferSelect;

export type CreateInsightParams = {
  teamId: string;
  periodType: (typeof insightPeriodTypeEnum.enumValues)[number];
  periodStart: Date;
  periodEnd: Date;
  periodLabel: string;
  periodYear: number;
  periodNumber: number;
  currency?: string;
};

/**
 * Create a pending insight record
 */
export async function createInsight(
  db: DatabaseOrTransaction,
  params: CreateInsightParams,
) {
  const [result] = await db
    .insert(insights)
    .values({
      teamId: params.teamId,
      periodType: params.periodType,
      periodStart: params.periodStart,
      periodEnd: params.periodEnd,
      periodLabel: params.periodLabel,
      periodYear: params.periodYear,
      periodNumber: params.periodNumber,
      currency: params.currency ?? "USD",
      status: "pending",
    })
    .onConflictDoNothing()
    .returning();

  return result;
}

export type UpdateInsightParams = {
  id: string;
  teamId: string;
  status?: (typeof insightStatusEnum.enumValues)[number];
  selectedMetrics?: InsightMetric[];
  allMetrics?: Record<string, InsightMetric>;
  anomalies?: InsightAnomaly[];
  expenseAnomalies?: ExpenseAnomaly[];
  milestones?: InsightMilestone[];
  activity?: InsightActivity;
  content?: InsightContent;
  audioPath?: string;
  generatedAt?: Date;
};

/**
 * Update an insight with generated content
 */
export async function updateInsight(
  db: DatabaseOrTransaction,
  params: UpdateInsightParams,
) {
  const { id, teamId, generatedAt, ...updateData } = params;

  const [result] = await db
    .update(insights)
    .set({
      ...updateData,
      ...(generatedAt && { generatedAt }),
      updatedAt: new Date(),
    })
    .where(and(eq(insights.id, id), eq(insights.teamId, teamId)))
    .returning();

  return result;
}

export type GetInsightsParams = {
  teamId: string;
  periodType?: (typeof insightPeriodTypeEnum.enumValues)[number];
  cursor?: string | null;
  pageSize?: number;
  status?: (typeof insightStatusEnum.enumValues)[number];
};

/**
 * Get paginated list of insights for a team
 */
export async function getInsights(db: Database, params: GetInsightsParams) {
  const { teamId, periodType, cursor, pageSize = 10, status } = params;

  const offset = cursor ? Number.parseInt(cursor, 10) : 0;

  const conditions = [eq(insights.teamId, teamId)];

  if (periodType) {
    conditions.push(eq(insights.periodType, periodType));
  }

  if (status) {
    conditions.push(eq(insights.status, status));
  }

  const data = await db
    .select()
    .from(insights)
    .where(and(...conditions))
    .orderBy(desc(insights.periodEnd))
    .limit(pageSize)
    .offset(offset);

  const nextCursor =
    data && data.length === pageSize
      ? (offset + pageSize).toString()
      : undefined;

  return {
    meta: {
      cursor: nextCursor ?? null,
      hasPreviousPage: offset > 0,
      hasNextPage: data && data.length === pageSize,
    },
    data,
  };
}

export type GetInsightByPeriodParams = {
  teamId: string;
  periodType: (typeof insightPeriodTypeEnum.enumValues)[number];
  periodYear: number;
  periodNumber: number;
};

/**
 * Get a specific insight by team and period
 */
export async function getInsightByPeriod(
  db: Database,
  params: GetInsightByPeriodParams,
) {
  const { teamId, periodType, periodYear, periodNumber } = params;

  const [result] = await db
    .select()
    .from(insights)
    .where(
      and(
        eq(insights.teamId, teamId),
        eq(insights.periodType, periodType),
        eq(insights.periodYear, periodYear),
        eq(insights.periodNumber, periodNumber),
      ),
    )
    .limit(1);

  return result ?? null;
}

export type GetLatestInsightParams = {
  teamId: string;
  periodType?: (typeof insightPeriodTypeEnum.enumValues)[number];
};

/**
 * Get the most recent completed insight for a team
 */
export async function getLatestInsight(
  db: Database,
  params: GetLatestInsightParams,
) {
  const { teamId, periodType } = params;

  const conditions = [
    eq(insights.teamId, teamId),
    eq(insights.status, "completed"),
  ];

  if (periodType) {
    conditions.push(eq(insights.periodType, periodType));
  }

  const [result] = await db
    .select()
    .from(insights)
    .where(and(...conditions))
    .orderBy(desc(insights.generatedAt))
    .limit(1);

  return result ?? null;
}

/**
 * Get insight by ID
 */
export async function getInsightById(
  db: Database,
  params: { id: string; teamId: string },
) {
  const [result] = await db
    .select()
    .from(insights)
    .where(and(eq(insights.id, params.id), eq(insights.teamId, params.teamId)))
    .limit(1);

  return result ?? null;
}

/**
 * Check if an insight already exists for a given period
 */
export async function insightExistsForPeriod(
  db: Database,
  params: GetInsightByPeriodParams,
): Promise<boolean> {
  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(insights)
    .where(
      and(
        eq(insights.teamId, params.teamId),
        eq(insights.periodType, params.periodType),
        eq(insights.periodYear, params.periodYear),
        eq(insights.periodNumber, params.periodNumber),
      ),
    );

  return (result[0]?.count ?? 0) > 0;
}

// ============================================================================
// INSIGHT ACTIVITY DATA QUERIES
// ============================================================================

export type GetInsightActivityDataParams = {
  teamId: string;
  from: string;
  to: string;
  currency: string;
};

type InvoiceActivityStats = {
  sent: number;
  paid: number;
  largestPayment?: { customer: string; amount: number };
};

/**
 * Get invoice activity stats for a period
 * - Count invoices sent (sentAt in range)
 * - Count invoices paid (paidAt in range)
 * - Find largest payment in range
 */
async function getInvoiceActivityStats(
  db: Database,
  params: GetInsightActivityDataParams,
): Promise<InvoiceActivityStats> {
  const { teamId, from, to } = params;

  // Count invoices sent in period
  const [sentResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(invoices)
    .where(
      and(
        eq(invoices.teamId, teamId),
        isNotNull(invoices.sentAt),
        gte(invoices.sentAt, from),
        lte(invoices.sentAt, to),
      ),
    );

  // Count invoices paid in period
  const [paidResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(invoices)
    .where(
      and(
        eq(invoices.teamId, teamId),
        eq(invoices.status, "paid"),
        isNotNull(invoices.paidAt),
        gte(invoices.paidAt, from),
        lte(invoices.paidAt, to),
      ),
    );

  // Find largest payment in period
  const [largestPayment] = await db
    .select({
      customerName: invoices.customerName,
      amount: invoices.amount,
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.teamId, teamId),
        eq(invoices.status, "paid"),
        isNotNull(invoices.paidAt),
        gte(invoices.paidAt, from),
        lte(invoices.paidAt, to),
      ),
    )
    .orderBy(sql`${invoices.amount} DESC`)
    .limit(1);

  return {
    sent: sentResult?.count ?? 0,
    paid: paidResult?.count ?? 0,
    largestPayment:
      largestPayment && Number(largestPayment.amount) > 0
        ? {
            customer: largestPayment.customerName ?? "Unknown",
            amount: Number(largestPayment.amount),
          }
        : undefined,
  };
}

type TrackerActivityStats = {
  totalHours: number;
  unbilledHours: number;
  billableAmount: number;
};

/**
 * Get tracker activity stats for a period
 * - Total hours tracked
 * - Unbilled hours (entries not linked to an invoice)
 * - Billable amount
 */
async function getTrackerActivityStats(
  db: Database,
  params: GetInsightActivityDataParams,
): Promise<TrackerActivityStats> {
  const { teamId, from, to } = params;

  // Get all tracker entries in range with their project rate
  const entries = await db
    .select({
      duration: trackerEntries.duration,
      billed: trackerEntries.billed,
      rate: trackerProjects.rate,
    })
    .from(trackerEntries)
    .leftJoin(trackerProjects, eq(trackerEntries.projectId, trackerProjects.id))
    .where(
      and(
        eq(trackerEntries.teamId, teamId),
        gte(trackerEntries.date, from),
        lte(trackerEntries.date, to),
      ),
    );

  let totalSeconds = 0;
  let unbilledSeconds = 0;
  let billableAmount = 0;

  for (const entry of entries) {
    const duration = entry.duration ?? 0;
    totalSeconds += duration;

    if (!entry.billed) {
      unbilledSeconds += duration;
    }

    // Calculate billable amount (rate is hourly)
    const rate = Number(entry.rate ?? 0);
    billableAmount += (rate * duration) / 3600;
  }

  return {
    totalHours: Math.round((totalSeconds / 3600) * 10) / 10, // Round to 1 decimal
    unbilledHours: Math.round((unbilledSeconds / 3600) * 10) / 10,
    billableAmount: Math.round(billableAmount * 100) / 100,
  };
}

type CustomerActivityStats = {
  newCount: number;
};

/**
 * Get customer activity stats for a period
 * - Count new customers created in range
 */
async function getCustomerActivityStats(
  db: Database,
  params: GetInsightActivityDataParams,
): Promise<CustomerActivityStats> {
  const { teamId, from, to } = params;

  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(customers)
    .where(
      and(
        eq(customers.teamId, teamId),
        gte(customers.createdAt, from),
        lte(customers.createdAt, to),
      ),
    );

  return {
    newCount: result?.count ?? 0,
  };
}

type InboxActivityStats = {
  matchedCount: number;
};

/**
 * Get inbox activity stats for a period
 * - Count receipts/items matched (status = 'done') in range
 */
async function getInboxActivityStats(
  db: Database,
  params: GetInsightActivityDataParams,
): Promise<InboxActivityStats> {
  const { teamId, from, to } = params;

  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(inbox)
    .where(
      and(
        eq(inbox.teamId, teamId),
        eq(inbox.status, "done"),
        gte(inbox.createdAt, from),
        lte(inbox.createdAt, to),
      ),
    );

  return {
    matchedCount: result?.count ?? 0,
  };
}

type TransactionActivityStats = {
  categorizedCount: number;
};

/**
 * Get transaction activity stats for a period
 * - Count transactions categorized (categorySlug not null) in range
 */
async function getTransactionActivityStats(
  db: Database,
  params: GetInsightActivityDataParams,
): Promise<TransactionActivityStats> {
  const { teamId, from, to } = params;

  // Count transactions that were categorized in the period
  // We check for categorySlug being set and updatedAt in range
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(transactions)
    .where(
      and(
        eq(transactions.teamId, teamId),
        isNotNull(transactions.categorySlug),
        gte(transactions.date, from),
        lte(transactions.date, to),
      ),
    );

  return {
    categorizedCount: result?.count ?? 0,
  };
}

export type InsightActivityData = {
  invoicesSent: number;
  invoicesPaid: number;
  largestPayment?: { customer: string; amount: number };
  hoursTracked: number;
  unbilledHours: number;
  billableAmount: number;
  newCustomers: number;
  receiptsMatched: number;
  transactionsCategorized: number;
};

/**
 * Get all activity data for insights generation
 * Executes all sub-queries in parallel for efficiency
 */
export async function getInsightActivityData(
  db: Database,
  params: GetInsightActivityDataParams,
): Promise<InsightActivityData> {
  const [
    invoiceStats,
    trackerStats,
    customerStats,
    inboxStats,
    transactionStats,
  ] = await Promise.all([
    getInvoiceActivityStats(db, params),
    getTrackerActivityStats(db, params),
    getCustomerActivityStats(db, params),
    getInboxActivityStats(db, params),
    getTransactionActivityStats(db, params),
  ]);

  return {
    invoicesSent: invoiceStats.sent,
    invoicesPaid: invoiceStats.paid,
    largestPayment: invoiceStats.largestPayment,
    hoursTracked: trackerStats.totalHours,
    unbilledHours: trackerStats.unbilledHours,
    billableAmount: trackerStats.billableAmount,
    newCustomers: customerStats.newCount,
    receiptsMatched: inboxStats.matchedCount,
    transactionsCategorized: transactionStats.categorizedCount,
  };
}
