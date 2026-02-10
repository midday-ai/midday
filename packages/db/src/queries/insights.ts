import {
  differenceInDays,
  endOfQuarter,
  format,
  getQuarter,
  startOfQuarter,
} from "date-fns";
import {
  and,
  count,
  desc,
  eq,
  gte,
  isNotNull,
  isNull,
  lte,
  sql,
} from "drizzle-orm";
import type { Database, DatabaseOrTransaction } from "../client";
import {
  bankAccounts,
  bankConnections,
  customers,
  type ExpenseAnomaly,
  type InsightActivity,
  type InsightAnomaly,
  type InsightContent,
  type InsightMetric,
  type InsightMilestone,
  type InsightPredictions,
  inbox,
  type insightPeriodTypeEnum,
  type insightStatusEnum,
  insights,
  insightUserStatus,
  invoices,
  trackerEntries,
  trackerProjects,
  transactions,
} from "../schema";

/**
 * Insight type returned from database queries
 */
export type Insight = typeof insights.$inferSelect;

export type CreateInsightParams = {
  teamId: string;
  periodType: (typeof insightPeriodTypeEnum.enumValues)[number];
  periodStart: Date;
  periodEnd: Date;
  periodYear: number;
  periodNumber: number;
  currency: string;
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
      periodYear: params.periodYear,
      periodNumber: params.periodNumber,
      currency: params.currency,
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
  title?: string;
  selectedMetrics?: InsightMetric[];
  allMetrics?: Record<string, InsightMetric>;
  anomalies?: InsightAnomaly[];
  expenseAnomalies?: ExpenseAnomaly[];
  milestones?: InsightMilestone[];
  activity?: InsightActivity;
  content?: InsightContent;
  predictions?: InsightPredictions;
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
    .orderBy(desc(insights.periodYear), desc(insights.periodNumber))
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

export type HasEarlierInsightParams = {
  teamId: string;
  periodType: (typeof insightPeriodTypeEnum.enumValues)[number];
  periodYear: number;
  periodNumber: number;
};

/**
 * Check if any completed insight exists with an earlier period than the given one.
 * Used to determine if an insight is the first for a team (for UI display purposes).
 */
export async function hasEarlierInsight(
  db: Database,
  params: HasEarlierInsightParams,
): Promise<boolean> {
  const { teamId, periodType, periodYear, periodNumber } = params;

  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(insights)
    .where(
      and(
        eq(insights.teamId, teamId),
        eq(insights.periodType, periodType),
        eq(insights.status, "completed"),
        // Earlier period: either earlier year, or same year with earlier period number
        sql`(${insights.periodYear} < ${periodYear} OR (${insights.periodYear} = ${periodYear} AND ${insights.periodNumber} < ${periodNumber}))`,
      ),
    )
    .limit(1);

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
      // Calculate billable amount for unbilled work only (rate is hourly)
      const rate = Number(entry.rate ?? 0);
      billableAmount += (rate * duration) / 3600;
    }
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

// ============================================================================
// INSIGHT USER STATUS (PER-USER READ/DISMISS TRACKING)
// ============================================================================

export type InsightUserStatus = typeof insightUserStatus.$inferSelect;

/**
 * Get user's status for an insight
 */
export async function getInsightUserStatus(
  db: Database,
  params: { insightId: string; userId: string },
): Promise<InsightUserStatus | null> {
  const [result] = await db
    .select()
    .from(insightUserStatus)
    .where(
      and(
        eq(insightUserStatus.insightId, params.insightId),
        eq(insightUserStatus.userId, params.userId),
      ),
    )
    .limit(1);

  return result ?? null;
}

/**
 * Mark an insight as read for a user
 * Creates or updates the user status record
 */
export async function markInsightAsRead(
  db: DatabaseOrTransaction,
  params: { insightId: string; userId: string },
): Promise<InsightUserStatus> {
  const [result] = await db
    .insert(insightUserStatus)
    .values({
      insightId: params.insightId,
      userId: params.userId,
      readAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [insightUserStatus.insightId, insightUserStatus.userId],
      set: {
        readAt: sql`COALESCE(${insightUserStatus.readAt}, NOW())`,
        updatedAt: new Date(),
      },
    })
    .returning();

  if (!result) {
    throw new Error("Failed to mark insight as read");
  }

  return result;
}

/**
 * Dismiss an insight for a user
 * Creates or updates the user status record
 */
export async function dismissInsight(
  db: DatabaseOrTransaction,
  params: { insightId: string; userId: string },
): Promise<InsightUserStatus> {
  const [result] = await db
    .insert(insightUserStatus)
    .values({
      insightId: params.insightId,
      userId: params.userId,
      dismissedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [insightUserStatus.insightId, insightUserStatus.userId],
      set: {
        dismissedAt: new Date(),
        updatedAt: new Date(),
      },
    })
    .returning();

  if (!result) {
    throw new Error("Failed to dismiss insight");
  }

  return result;
}

/**
 * Undo dismiss for an insight (set dismissedAt back to null)
 */
export async function undoDismissInsight(
  db: DatabaseOrTransaction,
  params: { insightId: string; userId: string },
): Promise<InsightUserStatus | null> {
  const [result] = await db
    .update(insightUserStatus)
    .set({
      dismissedAt: null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(insightUserStatus.insightId, params.insightId),
        eq(insightUserStatus.userId, params.userId),
      ),
    )
    .returning();

  return result ?? null;
}

export type GetInsightsForUserParams = {
  teamId: string;
  userId: string;
  periodType?: (typeof insightPeriodTypeEnum.enumValues)[number];
  includeDismissed?: boolean;
  cursor?: string | null;
  pageSize?: number;
  status?: (typeof insightStatusEnum.enumValues)[number];
};

/**
 * Get insights for a user with their read/dismiss status
 * By default, filters out dismissed insights
 */
export async function getInsightsForUser(
  db: Database,
  params: GetInsightsForUserParams,
) {
  const {
    teamId,
    userId,
    periodType,
    includeDismissed = false,
    cursor,
    pageSize = 10,
    status,
  } = params;

  const offset = cursor ? Number.parseInt(cursor, 10) : 0;

  // Build base query with left join to get user status
  const query = db
    .select({
      insight: insights,
      userStatus: {
        readAt: insightUserStatus.readAt,
        dismissedAt: insightUserStatus.dismissedAt,
      },
    })
    .from(insights)
    .leftJoin(
      insightUserStatus,
      and(
        eq(insightUserStatus.insightId, insights.id),
        eq(insightUserStatus.userId, userId),
      ),
    );

  // Build conditions
  const conditions = [eq(insights.teamId, teamId)];

  if (periodType) {
    conditions.push(eq(insights.periodType, periodType));
  }

  if (status) {
    conditions.push(eq(insights.status, status));
  }

  // Filter out dismissed unless explicitly requested
  if (!includeDismissed) {
    conditions.push(isNull(insightUserStatus.dismissedAt));
  }

  const data = await query
    .where(and(...conditions))
    .orderBy(desc(insights.periodYear), desc(insights.periodNumber))
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
    data: data.map((row) => ({
      ...row.insight,
      userStatus: row.userStatus,
    })),
  };
}

// ============================================================================
// DATA QUALITY CHECK
// ============================================================================

/**
 * Minimum thresholds for generating meaningful insights
 */
export const DATA_QUALITY_THRESHOLDS = {
  /** Minimum number of transactions in the period */
  MIN_TRANSACTIONS: 3,
  /** Maximum days since last bank sync (to ensure data freshness)
   * Set to 7 to account for weekends (2-3 days) + bank sync delays (1-3 days) */
  MAX_BANK_SYNC_AGE_DAYS: 7,
  /** Minimum data points required (transactions + invoices) */
  MIN_TOTAL_DATA_POINTS: 3,
} as const;

export type DataQualityResult = {
  /** Whether the team has sufficient data for insights */
  hasSufficientData: boolean;
  /** Reason for skipping if insufficient */
  skipReason?: string;
  /** Detailed metrics about the data quality check */
  metrics: {
    transactionCount: number;
    invoiceCount: number;
    hasBankConnection: boolean;
    lastBankSyncDate: Date | null;
    bankSyncAgeDays: number | null;
  };
};

/**
 * Check if a team has sufficient data quality for meaningful insight generation.
 *
 * This prevents generating empty or misleading insights for teams with:
 * - No transactions
 * - No recent bank syncs
 * - Minimal activity
 */
export async function checkInsightDataQuality(
  db: Database,
  params: {
    teamId: string;
    periodStart: string;
    periodEnd: string;
  },
): Promise<DataQualityResult> {
  const { teamId, periodStart, periodEnd } = params;

  // Fetch data quality metrics in parallel
  const [transactionResult, invoiceResult, bankConnectionResult] =
    await Promise.all([
      // Count transactions in the period
      db
        .select({ count: count() })
        .from(transactions)
        .where(
          and(
            eq(transactions.teamId, teamId),
            gte(transactions.date, periodStart),
            sql`${transactions.date} <= ${periodEnd}`,
          ),
        )
        .then((r) => r[0]?.count ?? 0),

      // Count invoices in the period (sent or paid)
      db
        .select({ count: count() })
        .from(invoices)
        .where(
          and(
            eq(invoices.teamId, teamId),
            gte(invoices.issueDate, periodStart),
            sql`${invoices.issueDate} <= ${periodEnd}`,
          ),
        )
        .then((r) => r[0]?.count ?? 0),

      // Get most recent bank sync
      db
        .select({
          lastAccessed: bankConnections.lastAccessed,
        })
        .from(bankConnections)
        .innerJoin(
          bankAccounts,
          eq(bankAccounts.bankConnectionId, bankConnections.id),
        )
        .where(
          and(
            eq(bankAccounts.teamId, teamId),
            eq(bankAccounts.enabled, true),
            isNotNull(bankConnections.lastAccessed),
          ),
        )
        .orderBy(sql`${bankConnections.lastAccessed} DESC`)
        .limit(1)
        .then((r) => r[0]?.lastAccessed ?? null),
    ]);

  const transactionCount = transactionResult;
  const invoiceCount = invoiceResult;
  const lastBankSync = bankConnectionResult
    ? new Date(bankConnectionResult)
    : null;

  // Calculate bank sync age
  const bankSyncAgeDays = lastBankSync
    ? Math.floor((Date.now() - lastBankSync.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const metrics: DataQualityResult["metrics"] = {
    transactionCount,
    invoiceCount,
    hasBankConnection: lastBankSync !== null,
    lastBankSyncDate: lastBankSync,
    bankSyncAgeDays,
  };

  // Check 1: Minimum transactions
  if (transactionCount < DATA_QUALITY_THRESHOLDS.MIN_TRANSACTIONS) {
    // Allow if they have invoices instead (invoice-focused business)
    const totalDataPoints = transactionCount + invoiceCount;
    if (totalDataPoints < DATA_QUALITY_THRESHOLDS.MIN_TOTAL_DATA_POINTS) {
      return {
        hasSufficientData: false,
        skipReason: `Insufficient data: only ${transactionCount} transactions and ${invoiceCount} invoices in period (minimum ${DATA_QUALITY_THRESHOLDS.MIN_TOTAL_DATA_POINTS} data points required)`,
        metrics,
      };
    }
  }

  // Check 2: Bank sync freshness (only if they have bank connections)
  if (lastBankSync && bankSyncAgeDays !== null) {
    if (bankSyncAgeDays > DATA_QUALITY_THRESHOLDS.MAX_BANK_SYNC_AGE_DAYS) {
      return {
        hasSufficientData: false,
        skipReason: `Stale bank data: last sync was ${bankSyncAgeDays} days ago (maximum ${DATA_QUALITY_THRESHOLDS.MAX_BANK_SYNC_AGE_DAYS} days allowed)`,
        metrics,
      };
    }
  }

  // Check 3: No bank connection AND no invoices = probably not using the platform actively
  if (!lastBankSync && invoiceCount === 0 && transactionCount === 0) {
    return {
      hasSufficientData: false,
      skipReason: "No bank connection and no activity in period",
      metrics,
    };
  }

  return {
    hasSufficientData: true,
    metrics,
  };
}

// ============================================================================
// DETAILED "MONEY ON TABLE" QUERIES
// ============================================================================

export type OverdueInvoiceDetail = {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail?: string;
  amount: number;
  currency: string;
  dueDate: string;
  daysOverdue: number;
};

/**
 * Get detailed overdue invoice information with customer names and days overdue.
 * Returns invoices sorted by days overdue (oldest first).
 */
export async function getOverdueInvoiceDetails(
  db: Database,
  params: { teamId: string; currency?: string },
): Promise<OverdueInvoiceDetail[]> {
  const { teamId, currency } = params;

  const conditions = [
    eq(invoices.teamId, teamId),
    eq(invoices.status, "overdue"),
    isNotNull(invoices.dueDate),
  ];

  if (currency) {
    conditions.push(eq(invoices.currency, currency));
  }

  const result = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      customerName: invoices.customerName,
      amount: invoices.amount,
      currency: invoices.currency,
      dueDate: invoices.dueDate,
      customerEmail: customers.email,
    })
    .from(invoices)
    .leftJoin(customers, eq(invoices.customerId, customers.id))
    .where(and(...conditions))
    .orderBy(sql`${invoices.dueDate} ASC`);

  const now = new Date();

  return result.map((inv) => {
    const dueDate = new Date(inv.dueDate!);
    const daysOverdue = Math.floor(
      (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    return {
      id: inv.id,
      invoiceNumber: inv.invoiceNumber ?? "",
      customerName: inv.customerName ?? "Unknown",
      customerEmail: inv.customerEmail ?? undefined,
      amount: Number(inv.amount ?? 0),
      currency: inv.currency ?? "USD",
      dueDate: inv.dueDate!,
      daysOverdue: Math.max(0, daysOverdue),
    };
  });
}

/**
 * Overdue invoice with payment behavior anomaly detection
 */
export type OverdueInvoiceWithBehavior = OverdueInvoiceDetail & {
  typicalPayDays?: number; // Customer's average days to pay
  isUnusual: boolean; // Current overdue is unusual for this customer
  unusualReason?: string; // "usually pays within 14 days"
};

/**
 * Get overdue invoices enriched with customer payment behavior analysis.
 * Flags invoices that are unusual given the customer's typical payment patterns.
 */
export async function getOverdueInvoicesWithBehavior(
  db: Database,
  params: { teamId: string; currency?: string },
): Promise<OverdueInvoiceWithBehavior[]> {
  const { teamId, currency } = params;

  // First, get overdue invoices
  const overdueInvoices = await getOverdueInvoiceDetails(db, {
    teamId,
    currency,
  });

  if (overdueInvoices.length === 0) {
    return [];
  }

  // Get customer IDs from overdue invoices
  const customerConditions = [
    eq(invoices.teamId, teamId),
    eq(invoices.status, "paid"),
    isNotNull(invoices.paidAt),
    isNotNull(invoices.dueDate),
  ];

  // Get payment behavior for all customers with paid invoices
  const paymentBehavior = await db
    .select({
      customerName: invoices.customerName,
      avgDaysToPay: sql<number>`
        AVG(
          EXTRACT(DAY FROM (${invoices.paidAt}::timestamp - ${invoices.dueDate}::timestamp))
        )::float
      `,
      invoiceCount: sql<number>`COUNT(*)::int`,
    })
    .from(invoices)
    .where(and(...customerConditions))
    .groupBy(invoices.customerName)
    .having(sql`COUNT(*) >= 2`); // Need at least 2 paid invoices for reliable pattern

  // Build a map of customer payment behavior
  const behaviorMap = new Map<string, { avgDays: number; count: number }>();
  for (const row of paymentBehavior) {
    if (row.customerName) {
      // avgDaysToPay is relative to due date:
      // negative = paid before due, positive = paid after due
      // Add grace period of ~14 days as "normal" payment time after due date
      const normalPayDays = Math.max(0, Math.round(row.avgDaysToPay ?? 0) + 14);
      behaviorMap.set(row.customerName, {
        avgDays: normalPayDays,
        count: row.invoiceCount,
      });
    }
  }

  // Enrich overdue invoices with behavior analysis
  return overdueInvoices.map((inv) => {
    const behavior = behaviorMap.get(inv.customerName);

    if (!behavior) {
      // No payment history - can't determine if unusual
      return { ...inv, isUnusual: false };
    }

    // Consider unusual if current overdue is > 1.5x their typical late payment + 7 days buffer
    const unusualThreshold = Math.max(
      behavior.avgDays * 1.5,
      behavior.avgDays + 7,
    );
    const isUnusual = inv.daysOverdue > unusualThreshold;

    return {
      ...inv,
      typicalPayDays: behavior.avgDays,
      isUnusual,
      unusualReason: isUnusual
        ? `usually pays within ${behavior.avgDays} days`
        : undefined,
    };
  });
}

export type UnbilledHoursDetail = {
  projectId: string;
  projectName: string;
  customerName?: string;
  hours: number;
  rate: number;
  currency: string;
  billableAmount: number;
};

/**
 * Get detailed unbilled hours by project with customer names and calculated amounts.
 * Returns projects with unbilled work, sorted by billable amount (highest first).
 */
export async function getUnbilledHoursDetails(
  db: Database,
  params: { teamId: string; currency?: string },
): Promise<UnbilledHoursDetail[]> {
  const { teamId, currency } = params;

  // Get unbilled entries grouped by project
  const result = await db
    .select({
      projectId: trackerProjects.id,
      projectName: trackerProjects.name,
      customerName: customers.name,
      rate: trackerProjects.rate,
      currency: trackerProjects.currency,
      totalSeconds: sql<number>`COALESCE(SUM(${trackerEntries.duration}), 0)::int`,
    })
    .from(trackerEntries)
    .innerJoin(
      trackerProjects,
      eq(trackerEntries.projectId, trackerProjects.id),
    )
    .leftJoin(customers, eq(trackerProjects.customerId, customers.id))
    .where(
      and(
        eq(trackerEntries.teamId, teamId),
        eq(trackerEntries.billed, false),
        currency ? eq(trackerProjects.currency, currency) : sql`true`,
      ),
    )
    .groupBy(
      trackerProjects.id,
      trackerProjects.name,
      trackerProjects.rate,
      trackerProjects.currency,
      customers.name,
    )
    .having(sql`SUM(${trackerEntries.duration}) > 0`);

  return result
    .map((row) => {
      const hours = Math.round((row.totalSeconds / 3600) * 10) / 10;
      const rate = Number(row.rate ?? 0);
      const billableAmount = Math.round(hours * rate * 100) / 100;

      return {
        projectId: row.projectId,
        projectName: row.projectName,
        customerName: row.customerName ?? undefined,
        hours,
        rate,
        currency: row.currency ?? "USD",
        billableAmount,
      };
    })
    .filter((row) => row.hours > 0)
    .sort((a, b) => b.billableAmount - a.billableAmount);
}

export type DraftInvoiceDetail = {
  id: string;
  invoiceNumber?: string;
  customerName: string;
  amount: number;
  currency: string;
  createdAt: string;
};

/**
 * Get draft invoices that are ready to send.
 * Returns drafts sorted by amount (highest first).
 */
export async function getDraftInvoices(
  db: Database,
  params: { teamId: string; currency?: string },
): Promise<DraftInvoiceDetail[]> {
  const { teamId, currency } = params;

  const conditions = [
    eq(invoices.teamId, teamId),
    eq(invoices.status, "draft"),
  ];

  if (currency) {
    conditions.push(eq(invoices.currency, currency));
  }

  const result = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      customerName: invoices.customerName,
      amount: invoices.amount,
      currency: invoices.currency,
      createdAt: invoices.createdAt,
    })
    .from(invoices)
    .where(and(...conditions))
    .orderBy(sql`${invoices.amount} DESC`);

  return result.map((inv) => ({
    id: inv.id,
    invoiceNumber: inv.invoiceNumber ?? undefined,
    customerName: inv.customerName ?? "Unknown",
    amount: Number(inv.amount ?? 0),
    currency: inv.currency ?? "USD",
    createdAt: inv.createdAt ?? new Date().toISOString(),
  }));
}

// ============================================================================
// CONSOLIDATED INSIGHT HISTORY (Single query for all historical analysis)
// ============================================================================

// Forward type declarations for compute functions
// (Full definitions are below in their respective sections for documentation)

export type StreakType =
  | "revenue_growth"
  | "revenue_decline"
  | "profitable"
  | "invoices_paid_on_time"
  | null;

export type StreakInfo = {
  type: StreakType;
  count: number;
  description: string | null;
};

export type MomentumType = "accelerating" | "steady" | "decelerating";

export type RecoveryInfo = {
  isRecovery: boolean;
  downWeeksBefore: number;
  strength?: "strong" | "moderate" | "mild";
  description?: string;
};

export type HistoricalContext = {
  revenueRank: number | null;
  revenueHighestSince?: string;
  profitRank: number | null;
  profitHighestSince?: string;
  isAllTimeRevenueHigh: boolean;
  isAllTimeProfitHigh: boolean;
  isRecentRevenueHigh: boolean;
  isRecentProfitHigh: boolean;
  weeksOfHistory: number;
  yearOverYear?: {
    lastYearRevenue: number;
    lastYearProfit: number;
    revenueChangePercent: number;
    profitChangePercent: number;
    hasComparison: boolean;
  };
  quarterPace?: {
    currentQuarter: number; // Q1, Q2, Q3, Q4
    qtdRevenue: number; // Revenue so far this quarter
    projectedRevenue: number; // Projected full quarter revenue
    lastYearQuarterRevenue: number; // Same quarter last year
    vsLastYearPercent: number; // +/- vs last year
    hasComparison: boolean;
  };
};

/**
 * A single week's data from insight history
 */
export type InsightHistoryWeek = {
  periodYear: number;
  periodNumber: number;
  periodStart: Date;
  revenue: number;
  expenses: number;
  profit: number;
  hasOverdue: boolean;
  invoicesPaid: number; // Number of invoices paid this week
  predictions?: InsightPredictions;
};

/**
 * Consolidated historical insight data - fetched once, used by multiple functions
 */
export type InsightHistoryData = {
  weeks: InsightHistoryWeek[];
  weeksOfHistory: number;
};

/**
 * Fetch insight history once for a team. This data can be reused by:
 * - getRollingAveragesFromHistory
 * - getStreakInfoFromHistory
 * - getHistoricalContextFromHistory
 * - getMomentumFromHistory
 * - detectRecoveryFromHistory
 *
 * This eliminates 5-6 redundant database queries during insight generation.
 *
 * @param weeksBack - Maximum weeks to fetch (default 52 for YoY comparison)
 */
export async function getInsightHistory(
  db: Database,
  params: {
    teamId: string;
    weeksBack?: number;
    excludeCurrentPeriod?: { year: number; number: number };
  },
): Promise<InsightHistoryData> {
  const { teamId, weeksBack = 52, excludeCurrentPeriod } = params;

  const conditions = [
    eq(insights.teamId, teamId),
    eq(insights.periodType, "weekly"),
    eq(insights.status, "completed"),
    isNotNull(insights.allMetrics),
  ];

  if (excludeCurrentPeriod) {
    conditions.push(
      sql`NOT (${insights.periodYear} = ${excludeCurrentPeriod.year} AND ${insights.periodNumber} = ${excludeCurrentPeriod.number})`,
    );
  }

  const pastInsights = await db
    .select({
      allMetrics: insights.allMetrics,
      activity: insights.activity,
      predictions: insights.predictions,
      periodStart: insights.periodStart,
      periodYear: insights.periodYear,
      periodNumber: insights.periodNumber,
    })
    .from(insights)
    .where(and(...conditions))
    .orderBy(desc(insights.periodYear), desc(insights.periodNumber))
    .limit(weeksBack);

  const weeks: InsightHistoryWeek[] = pastInsights
    .map((insight): InsightHistoryWeek | null => {
      const metrics = insight.allMetrics as Record<
        string,
        { value: number }
      > | null;
      const activity = insight.activity as {
        invoicesOverdue?: number;
        invoicesPaid?: number;
      } | null;

      if (!metrics) return null;

      const week: InsightHistoryWeek = {
        periodYear: insight.periodYear,
        periodNumber: insight.periodNumber,
        periodStart: insight.periodStart,
        revenue: metrics.revenue?.value ?? 0,
        expenses: metrics.expenses?.value ?? 0,
        profit: metrics.netProfit?.value ?? metrics.profit?.value ?? 0,
        hasOverdue: (activity?.invoicesOverdue ?? 0) > 0,
        invoicesPaid: activity?.invoicesPaid ?? 0,
      };

      if (insight.predictions) {
        week.predictions = insight.predictions;
      }

      return week;
    })
    .filter((w): w is InsightHistoryWeek => w !== null);

  return {
    weeks,
    weeksOfHistory: weeks.length,
  };
}

/**
 * Compute rolling averages from pre-fetched history data.
 * Pure function - no database access.
 */
export function computeRollingAverages(
  history: InsightHistoryData,
  weeksBack = 4,
): RollingAverages {
  const weeksToUse = history.weeks.slice(0, weeksBack);

  if (weeksToUse.length === 0) {
    return { avgRevenue: 0, avgExpenses: 0, avgProfit: 0, weeksIncluded: 0 };
  }

  let totalRevenue = 0;
  let totalExpenses = 0;
  let totalProfit = 0;

  for (const week of weeksToUse) {
    totalRevenue += week.revenue;
    totalExpenses += week.expenses;
    totalProfit += week.profit;
  }

  const count = weeksToUse.length;
  return {
    avgRevenue: Math.round((totalRevenue / count) * 100) / 100,
    avgExpenses: Math.round((totalExpenses / count) * 100) / 100,
    avgProfit: Math.round((totalProfit / count) * 100) / 100,
    weeksIncluded: count,
  };
}

/**
 * Compute streak info from pre-fetched history data.
 * Pure function - no database access.
 */
export function computeStreakInfo(
  history: InsightHistoryData,
  currentWeek: {
    revenue: number;
    profit: number;
    hasOverdue: boolean;
    invoicesPaid: number;
  },
): StreakInfo {
  if (history.weeks.length === 0) {
    return { type: null, count: 0, description: null };
  }

  // Build array with current week first
  const weeks = [currentWeek, ...history.weeks.slice(0, 8)];

  // Check for revenue growth streak
  let growthStreak = 0;
  for (let i = 0; i < weeks.length - 1; i++) {
    if (weeks[i]!.revenue > weeks[i + 1]!.revenue) {
      growthStreak++;
    } else {
      break;
    }
  }

  // Check for revenue decline streak
  let declineStreak = 0;
  for (let i = 0; i < weeks.length - 1; i++) {
    if (weeks[i]!.revenue < weeks[i + 1]!.revenue) {
      declineStreak++;
    } else {
      break;
    }
  }

  // Check for profitable streak
  let profitableStreak = 0;
  for (const week of weeks) {
    if (week.profit > 0) {
      profitableStreak++;
    } else {
      break;
    }
  }

  // Check for invoices paid on time streak
  // IMPORTANT: Only count weeks where there were invoices to pay AND none were overdue
  // Weeks with no invoice activity don't count towards this streak
  let paidOnTimeStreak = 0;
  for (const week of weeks) {
    // Must have had invoices paid AND no overdue to count
    if (week.invoicesPaid > 0 && !week.hasOverdue) {
      paidOnTimeStreak++;
    } else if (week.invoicesPaid === 0) {
      // No invoice activity this week - skip but don't break streak
      // This allows gaps in invoice activity without resetting the streak
      // (intentionally empty - just skip to next iteration)
    } else {
      // Had overdue invoices - streak is broken
      break;
    }
  }

  // Return the most significant streak
  if (growthStreak >= 2) {
    return {
      type: "revenue_growth",
      count: growthStreak,
      description: `${growthStreak} consecutive growth weeks`,
    };
  }
  if (profitableStreak >= 3) {
    return {
      type: "profitable",
      count: profitableStreak,
      description: `${profitableStreak} profitable weeks in a row`,
    };
  }
  if (paidOnTimeStreak >= 3) {
    return {
      type: "invoices_paid_on_time",
      count: paidOnTimeStreak,
      description: `${paidOnTimeStreak} weeks with all invoices paid on time`,
    };
  }
  if (declineStreak >= 2) {
    return {
      type: "revenue_decline",
      count: declineStreak,
      description: `Revenue down ${declineStreak} weeks in a row`,
    };
  }

  return { type: null, count: 0, description: null };
}

/**
 * Compute historical context from pre-fetched history data.
 * Pure function - no database access.
 */
export function computeHistoricalContext(
  history: InsightHistoryData,
  currentWeek: {
    revenue: number;
    profit: number;
    periodYear: number;
    periodNumber: number;
  },
): HistoricalContext {
  const { revenue: currentRevenue, profit: currentProfit } = currentWeek;

  // Filter to weeks with revenue > 0
  const validWeeks = history.weeks.filter((w) => w.revenue > 0);

  if (validWeeks.length < 4) {
    return {
      revenueRank: null,
      profitRank: null,
      isAllTimeRevenueHigh: false,
      isAllTimeProfitHigh: false,
      isRecentRevenueHigh: false,
      isRecentProfitHigh: false,
      weeksOfHistory: validWeeks.length,
    };
  }

  // Calculate revenue rank
  const revenueRank =
    validWeeks.filter((w) => w.revenue > currentRevenue).length + 1;
  const isAllTimeRevenueHigh = revenueRank === 1;

  // Find "highest since X" for revenue
  let revenueHighestSince: string | undefined;
  if (revenueRank <= 3 && revenueRank > 1) {
    const higherWeek = validWeeks.find((w) => w.revenue > currentRevenue);
    if (higherWeek) {
      revenueHighestSince = format(higherWeek.periodStart, "MMMM yyyy");
    }
  }

  // Calculate profit rank
  const profitRank =
    validWeeks.filter((w) => w.profit > currentProfit).length + 1;
  const isAllTimeProfitHigh = profitRank === 1 && currentProfit > 0;

  // Find "highest since X" for profit
  let profitHighestSince: string | undefined;
  if (profitRank <= 3 && profitRank > 1 && currentProfit > 0) {
    const higherWeek = validWeeks.find((w) => w.profit > currentProfit);
    if (higherWeek) {
      profitHighestSince = format(higherWeek.periodStart, "MMMM yyyy");
    }
  }

  // Check if in top 3 recent weeks
  const isRecentRevenueHigh = revenueRank <= 3 && validWeeks.length >= 8;
  const isRecentProfitHigh =
    profitRank <= 3 && validWeeks.length >= 8 && currentProfit > 0;

  // Year-over-year comparison
  let yearOverYear: HistoricalContext["yearOverYear"];
  const lastYearInsight = history.weeks.find(
    (w) =>
      w.periodYear === currentWeek.periodYear - 1 &&
      w.periodNumber === currentWeek.periodNumber,
  );

  if (lastYearInsight && lastYearInsight.revenue > 0) {
    const revenueChangePercent = Math.round(
      ((currentRevenue - lastYearInsight.revenue) / lastYearInsight.revenue) *
        100,
    );
    const profitChangePercent =
      lastYearInsight.profit !== 0
        ? Math.round(
            ((currentProfit - lastYearInsight.profit) /
              Math.abs(lastYearInsight.profit)) *
              100,
          )
        : 0;

    yearOverYear = {
      lastYearRevenue: lastYearInsight.revenue,
      lastYearProfit: lastYearInsight.profit,
      revenueChangePercent,
      profitChangePercent,
      hasComparison: true,
    };
  }

  // Quarter pace projection
  let quarterPace: HistoricalContext["quarterPace"];
  const now = new Date();
  const currentQuarter = getQuarter(now);
  const quarterStart = startOfQuarter(now);
  const quarterEnd = endOfQuarter(now);
  const daysElapsed = differenceInDays(now, quarterStart) + 1;
  const totalQuarterDays = differenceInDays(quarterEnd, quarterStart) + 1;

  // Sum up revenue from weeks in current quarter (including current week)
  const quarterWeeks = history.weeks.filter((w) => {
    return (
      w.periodStart >= quarterStart &&
      w.periodStart <= now &&
      w.periodYear === currentWeek.periodYear
    );
  });

  // Add current week to QTD revenue
  const qtdRevenue =
    quarterWeeks.reduce((sum, w) => sum + w.revenue, 0) + currentRevenue;

  if (qtdRevenue > 0 && daysElapsed > 7) {
    // Only project if we have at least a week of data
    const projectedRevenue = Math.round(
      (qtdRevenue / daysElapsed) * totalQuarterDays,
    );

    // Find same quarter last year's total revenue
    const lastYearQuarterWeeks = history.weeks.filter((w) => {
      const weekQuarter = getQuarter(w.periodStart);
      return (
        weekQuarter === currentQuarter &&
        w.periodYear === currentWeek.periodYear - 1
      );
    });

    const lastYearQuarterRevenue = lastYearQuarterWeeks.reduce(
      (sum, w) => sum + w.revenue,
      0,
    );

    const vsLastYearPercent =
      lastYearQuarterRevenue > 0
        ? Math.round(
            ((projectedRevenue - lastYearQuarterRevenue) /
              lastYearQuarterRevenue) *
              100,
          )
        : 0;

    quarterPace = {
      currentQuarter,
      qtdRevenue,
      projectedRevenue,
      lastYearQuarterRevenue,
      vsLastYearPercent,
      hasComparison: lastYearQuarterRevenue > 0,
    };
  }

  return {
    revenueRank,
    revenueHighestSince,
    profitRank,
    profitHighestSince,
    isAllTimeRevenueHigh,
    isAllTimeProfitHigh,
    isRecentRevenueHigh,
    isRecentProfitHigh,
    weeksOfHistory: validWeeks.length,
    yearOverYear,
    quarterPace,
  };
}

/**
 * Compute momentum from pre-fetched history data.
 * Pure function - no database access.
 */
export function computeMomentum(
  history: InsightHistoryData,
  currentRevenue: number,
): {
  momentum: MomentumType;
  currentGrowthRate: number;
  previousGrowthRate: number;
} | null {
  if (history.weeks.length < 2) {
    return null;
  }

  const prevRevenue = history.weeks[0]!.revenue;
  const weekBeforeRevenue = history.weeks[1]!.revenue;

  if (prevRevenue === 0 || weekBeforeRevenue === 0) {
    return null;
  }

  const currentGrowthRate =
    ((currentRevenue - prevRevenue) / prevRevenue) * 100;
  const previousGrowthRate =
    ((prevRevenue - weekBeforeRevenue) / weekBeforeRevenue) * 100;

  return {
    momentum: detectMomentum(currentGrowthRate, previousGrowthRate),
    currentGrowthRate: Math.round(currentGrowthRate * 10) / 10,
    previousGrowthRate: Math.round(previousGrowthRate * 10) / 10,
  };
}

/**
 * Compute recovery info from pre-fetched history data.
 * Pure function - no database access.
 */
export function computeRecovery(
  history: InsightHistoryData,
  currentRevenue: number,
): RecoveryInfo {
  if (history.weeks.length < 2) {
    return { isRecovery: false, downWeeksBefore: 0 };
  }

  const revenues = history.weeks
    .filter((w) => w.revenue > 0)
    .map((w) => w.revenue);
  if (revenues.length < 2) {
    return { isRecovery: false, downWeeksBefore: 0 };
  }

  const previousRevenue = revenues[0]!;

  // Check if current week is up from previous
  if (currentRevenue <= previousRevenue) {
    return { isRecovery: false, downWeeksBefore: 0 };
  }

  // Count consecutive down weeks before the previous week
  let downWeeksBefore = 0;
  for (let i = 0; i < revenues.length - 1; i++) {
    if (revenues[i]! < revenues[i + 1]!) {
      downWeeksBefore++;
    } else {
      break;
    }
  }

  if (downWeeksBefore === 0) {
    return { isRecovery: false, downWeeksBefore: 0 };
  }

  // Calculate recovery strength
  const recoveryPercent =
    ((currentRevenue - previousRevenue) / previousRevenue) * 100;
  let strength: "strong" | "moderate" | "mild";
  if (recoveryPercent >= 20) {
    strength = "strong";
  } else if (recoveryPercent >= 10) {
    strength = "moderate";
  } else {
    strength = "mild";
  }

  const description =
    downWeeksBefore >= 3
      ? `Bounced back after ${downWeeksBefore} down weeks`
      : downWeeksBefore === 2
        ? "Bounced back after 2 down weeks"
        : "Bounced back from last week's dip";

  return {
    isRecovery: true,
    downWeeksBefore,
    strength,
    description,
  };
}

/**
 * Get previous week's predictions from history data.
 * Pure function - no database access.
 */
export function getPredictionsFromHistory(history: InsightHistoryData): {
  predictions: InsightPredictions | null;
  periodStart: Date | null;
} | null {
  if (history.weeks.length === 0) {
    return null;
  }

  const previousWeek = history.weeks[0];
  return {
    predictions: previousWeek?.predictions ?? null,
    periodStart: previousWeek?.periodStart ?? null,
  };
}

// ============================================================================
// ROLLING AVERAGES & COMPARISON CONTEXT
// ============================================================================

export type RollingAverages = {
  avgRevenue: number;
  avgExpenses: number;
  avgProfit: number;
  weeksIncluded: number;
};

/**
 * Get rolling averages for key metrics from past weekly insights.
 * Looks at the last N completed weekly insights to calculate averages.
 *
 * @param weeksBack - Number of past weeks to include (default 4)
 * @param currentPeriodYear - Exclude this period from the average
 * @param currentPeriodNumber - Exclude this period from the average
 */
export async function getRollingAverages(
  db: Database,
  params: {
    teamId: string;
    weeksBack?: number;
    currentPeriodYear?: number;
    currentPeriodNumber?: number;
  },
): Promise<RollingAverages> {
  const {
    teamId,
    weeksBack = 4,
    currentPeriodYear,
    currentPeriodNumber,
  } = params;

  // Query past weekly insights with completed metrics
  const conditions = [
    eq(insights.teamId, teamId),
    eq(insights.periodType, "weekly"),
    eq(insights.status, "completed"),
    isNotNull(insights.allMetrics),
  ];

  // Exclude current week if specified
  if (currentPeriodYear && currentPeriodNumber) {
    conditions.push(
      sql`NOT (${insights.periodYear} = ${currentPeriodYear} AND ${insights.periodNumber} = ${currentPeriodNumber})`,
    );
  }

  const pastInsights = await db
    .select({
      allMetrics: insights.allMetrics,
      periodYear: insights.periodYear,
      periodNumber: insights.periodNumber,
    })
    .from(insights)
    .where(and(...conditions))
    .orderBy(desc(insights.periodYear), desc(insights.periodNumber))
    .limit(weeksBack);

  if (pastInsights.length === 0) {
    return {
      avgRevenue: 0,
      avgExpenses: 0,
      avgProfit: 0,
      weeksIncluded: 0,
    };
  }

  // Extract metrics from past insights
  let totalRevenue = 0;
  let totalExpenses = 0;
  let totalProfit = 0;
  let validWeeks = 0;

  for (const insight of pastInsights) {
    const metrics = insight.allMetrics as Record<
      string,
      { value: number }
    > | null;
    if (!metrics) continue;

    const revenue = metrics.revenue?.value ?? 0;
    const expenses = metrics.expenses?.value ?? 0;
    const profit = metrics.netProfit?.value ?? metrics.profit?.value ?? 0;

    totalRevenue += revenue;
    totalExpenses += expenses;
    totalProfit += profit;
    validWeeks++;
  }

  if (validWeeks === 0) {
    return {
      avgRevenue: 0,
      avgExpenses: 0,
      avgProfit: 0,
      weeksIncluded: 0,
    };
  }

  return {
    avgRevenue: Math.round((totalRevenue / validWeeks) * 100) / 100,
    avgExpenses: Math.round((totalExpenses / validWeeks) * 100) / 100,
    avgProfit: Math.round((totalProfit / validWeeks) * 100) / 100,
    weeksIncluded: validWeeks,
  };
}

// ============================================================================
// STREAK DETECTION
// ============================================================================

/**
 * Detect consecutive week patterns for celebrating momentum or flagging trends.
 *
 * Detects:
 * - revenue_growth: N consecutive weeks where revenue > previous week
 * - revenue_decline: N consecutive weeks where revenue < previous week
 * - profitable: N consecutive weeks with positive profit
 * - invoices_paid_on_time: N consecutive weeks with no overdue invoices
 */
export async function getStreakInfo(
  db: Database,
  params: {
    teamId: string;
    currentPeriodYear: number;
    currentPeriodNumber: number;
    currentRevenue: number;
    currentProfit: number;
    hasOverdueInvoices: boolean;
  },
): Promise<StreakInfo> {
  const {
    teamId,
    currentPeriodYear,
    currentPeriodNumber,
    currentRevenue,
    currentProfit,
    hasOverdueInvoices,
  } = params;

  // Get the last 8 weekly insights (to detect streaks up to 8 weeks)
  const pastInsights = await db
    .select({
      allMetrics: insights.allMetrics,
      activity: insights.activity,
      periodYear: insights.periodYear,
      periodNumber: insights.periodNumber,
    })
    .from(insights)
    .where(
      and(
        eq(insights.teamId, teamId),
        eq(insights.periodType, "weekly"),
        eq(insights.status, "completed"),
        isNotNull(insights.allMetrics),
        sql`NOT (${insights.periodYear} = ${currentPeriodYear} AND ${insights.periodNumber} = ${currentPeriodNumber})`,
      ),
    )
    .orderBy(desc(insights.periodYear), desc(insights.periodNumber))
    .limit(8);

  if (pastInsights.length === 0) {
    return { type: null, count: 0, description: null };
  }

  // Build array of weekly data points (most recent first)
  type WeekData = {
    revenue: number;
    profit: number;
    hasOverdue: boolean;
  };

  const weeks: WeekData[] = [
    {
      revenue: currentRevenue,
      profit: currentProfit,
      hasOverdue: hasOverdueInvoices,
    },
  ];

  for (const insight of pastInsights) {
    const metrics = insight.allMetrics as Record<
      string,
      { value: number }
    > | null;
    const activity = insight.activity as { invoicesOverdue?: number } | null;

    if (!metrics) continue;

    weeks.push({
      revenue: metrics.revenue?.value ?? 0,
      profit: metrics.netProfit?.value ?? metrics.profit?.value ?? 0,
      hasOverdue: (activity?.invoicesOverdue ?? 0) > 0,
    });
  }

  // Check for revenue growth streak (current week is higher than each previous)
  let growthStreak = 0;
  for (let i = 0; i < weeks.length - 1; i++) {
    if (weeks[i]!.revenue > weeks[i + 1]!.revenue) {
      growthStreak++;
    } else {
      break;
    }
  }

  // Check for revenue decline streak
  let declineStreak = 0;
  for (let i = 0; i < weeks.length - 1; i++) {
    if (weeks[i]!.revenue < weeks[i + 1]!.revenue) {
      declineStreak++;
    } else {
      break;
    }
  }

  // Check for profitable streak
  let profitableStreak = 0;
  for (const week of weeks) {
    if (week.profit > 0) {
      profitableStreak++;
    } else {
      break;
    }
  }

  // Check for invoices paid on time streak
  let paidOnTimeStreak = 0;
  for (const week of weeks) {
    if (!week.hasOverdue) {
      paidOnTimeStreak++;
    } else {
      break;
    }
  }

  // Return the most significant streak (prioritize growth > profitable > paid on time > decline)
  if (growthStreak >= 2) {
    return {
      type: "revenue_growth",
      count: growthStreak,
      description: `${growthStreak} consecutive growth weeks`,
    };
  }

  if (profitableStreak >= 3) {
    return {
      type: "profitable",
      count: profitableStreak,
      description: `${profitableStreak} profitable weeks in a row`,
    };
  }

  if (paidOnTimeStreak >= 3) {
    return {
      type: "invoices_paid_on_time",
      count: paidOnTimeStreak,
      description: `${paidOnTimeStreak} weeks with all invoices paid on time`,
    };
  }

  if (declineStreak >= 2) {
    return {
      type: "revenue_decline",
      count: declineStreak,
      description: `Revenue down ${declineStreak} weeks in a row`,
    };
  }

  return { type: null, count: 0, description: null };
}

// ============================================================================
// HISTORICAL CONTEXT (PERSONAL BESTS)
// ============================================================================

/**
 * Get historical context for the current period's metrics.
 * Finds personal bests and notable comparisons like "Highest since October".
 *
 * Requires at least 4 weeks of history to provide meaningful context.
 */
export async function getHistoricalContext(
  db: Database,
  params: {
    teamId: string;
    currentRevenue: number;
    currentProfit: number;
    currentPeriodYear: number;
    currentPeriodNumber: number;
  },
): Promise<HistoricalContext> {
  const {
    teamId,
    currentRevenue,
    currentProfit,
    currentPeriodYear,
    currentPeriodNumber,
  } = params;

  // Get all past weekly insights ordered by date (most recent first)
  const pastInsights = await db
    .select({
      allMetrics: insights.allMetrics,
      periodStart: insights.periodStart,
      periodYear: insights.periodYear,
      periodNumber: insights.periodNumber,
    })
    .from(insights)
    .where(
      and(
        eq(insights.teamId, teamId),
        eq(insights.periodType, "weekly"),
        eq(insights.status, "completed"),
        isNotNull(insights.allMetrics),
        // Exclude current period
        sql`NOT (${insights.periodYear} = ${currentPeriodYear} AND ${insights.periodNumber} = ${currentPeriodNumber})`,
      ),
    )
    .orderBy(desc(insights.periodStart))
    .limit(52); // Last year of data

  const weeksOfHistory = pastInsights.length;

  // Default response for insufficient history
  if (weeksOfHistory < 4) {
    return {
      revenueRank: null,
      profitRank: null,
      isAllTimeRevenueHigh: false,
      isAllTimeProfitHigh: false,
      isRecentRevenueHigh: false,
      isRecentProfitHigh: false,
      weeksOfHistory,
    };
  }

  // Extract revenue and profit values from past insights
  const historicalWeeks = pastInsights
    .map((insight) => {
      const metrics = insight.allMetrics as Record<
        string,
        { value: number }
      > | null;
      if (!metrics) return null;

      return {
        revenue: metrics.revenue?.value ?? 0,
        profit: metrics.netProfit?.value ?? metrics.profit?.value ?? 0,
        periodStart: insight.periodStart,
      };
    })
    .filter(
      (w): w is { revenue: number; profit: number; periodStart: Date } =>
        w !== null && w.revenue > 0,
    );

  if (historicalWeeks.length < 4) {
    return {
      revenueRank: null,
      profitRank: null,
      isAllTimeRevenueHigh: false,
      isAllTimeProfitHigh: false,
      isRecentRevenueHigh: false,
      isRecentProfitHigh: false,
      weeksOfHistory: historicalWeeks.length,
    };
  }

  // Calculate revenue rank (how many past weeks had higher revenue)
  const revenueRank =
    historicalWeeks.filter((w) => w.revenue > currentRevenue).length + 1;
  const isAllTimeRevenueHigh = revenueRank === 1;

  // Find "highest since X" for revenue if in top 3 but not all-time
  let revenueHighestSince: string | undefined;
  if (revenueRank <= 3 && revenueRank > 1) {
    const higherWeek = historicalWeeks.find((w) => w.revenue > currentRevenue);
    if (higherWeek) {
      revenueHighestSince = format(higherWeek.periodStart, "MMMM yyyy");
    }
  }

  // Calculate profit rank
  const profitRank =
    historicalWeeks.filter((w) => w.profit > currentProfit).length + 1;
  const isAllTimeProfitHigh = profitRank === 1 && currentProfit > 0;

  // Find "highest since X" for profit if in top 3 but not all-time
  let profitHighestSince: string | undefined;
  if (profitRank <= 3 && profitRank > 1 && currentProfit > 0) {
    const higherWeek = historicalWeeks.find((w) => w.profit > currentProfit);
    if (higherWeek) {
      profitHighestSince = format(higherWeek.periodStart, "MMMM yyyy");
    }
  }

  // Check if in top 3 recent weeks (requires at least 8 weeks of history)
  const isRecentRevenueHigh = revenueRank <= 3 && historicalWeeks.length >= 8;
  const isRecentProfitHigh =
    profitRank <= 3 && historicalWeeks.length >= 8 && currentProfit > 0;

  // Year-over-year comparison: find same week from last year
  let yearOverYear: HistoricalContext["yearOverYear"];
  const lastYearWeekNumber = currentPeriodNumber;
  const lastYearYear = currentPeriodYear - 1;

  // Look for the insight from same week last year
  const lastYearInsight = pastInsights.find(
    (insight) =>
      insight.periodYear === lastYearYear &&
      insight.periodNumber === lastYearWeekNumber,
  );

  if (lastYearInsight) {
    const lastYearMetrics = lastYearInsight.allMetrics as Record<
      string,
      { value: number }
    > | null;
    if (lastYearMetrics) {
      const lastYearRevenue = lastYearMetrics.revenue?.value ?? 0;
      const lastYearProfit =
        lastYearMetrics.netProfit?.value ?? lastYearMetrics.profit?.value ?? 0;

      // Calculate percentage changes
      const revenueChangePercent =
        lastYearRevenue > 0
          ? Math.round(
              ((currentRevenue - lastYearRevenue) / lastYearRevenue) * 100,
            )
          : 0;
      const profitChangePercent =
        lastYearProfit !== 0
          ? Math.round(
              ((currentProfit - lastYearProfit) / Math.abs(lastYearProfit)) *
                100,
            )
          : 0;

      yearOverYear = {
        lastYearRevenue,
        lastYearProfit,
        revenueChangePercent,
        profitChangePercent,
        hasComparison: lastYearRevenue > 0,
      };
    }
  }

  return {
    revenueRank,
    revenueHighestSince,
    profitRank,
    profitHighestSince,
    isAllTimeRevenueHigh,
    isAllTimeProfitHigh,
    isRecentRevenueHigh,
    isRecentProfitHigh,
    weeksOfHistory: historicalWeeks.length,
    yearOverYear,
  };
}

// ============================================================================
// FORWARD-LOOKING QUERIES (for addiction loop)
// ============================================================================

export type UpcomingInvoicesResult = {
  totalDue: number;
  count: number;
  currency: string;
};

/**
 * Get invoices due in a future date range.
 * Used to create forward-looking predictions like "Next week: $7,100 in invoices due".
 */
export async function getUpcomingInvoicesForInsight(
  db: Database,
  params: {
    teamId: string;
    fromDate: Date;
    toDate: Date;
    currency?: string;
  },
): Promise<UpcomingInvoicesResult> {
  const { teamId, fromDate, toDate, currency } = params;

  const conditions = [
    eq(invoices.teamId, teamId),
    // Only unpaid invoices (sent but not paid)
    sql`${invoices.status} IN ('unpaid', 'overdue')`,
    isNotNull(invoices.dueDate),
    gte(invoices.dueDate, fromDate.toISOString()),
    lte(invoices.dueDate, toDate.toISOString()),
  ];

  if (currency) {
    conditions.push(eq(invoices.currency, currency));
  }

  const result = await db
    .select({
      totalAmount: sql<number>`COALESCE(SUM(${invoices.amount}), 0)::numeric`,
      invoiceCount: sql<number>`COUNT(*)::int`,
      currency: invoices.currency,
    })
    .from(invoices)
    .where(and(...conditions))
    .groupBy(invoices.currency);

  // Return the first result (or defaults if no invoices)
  const row = result[0];
  return {
    totalDue: Number(row?.totalAmount ?? 0),
    count: row?.invoiceCount ?? 0,
    currency: row?.currency ?? currency ?? "USD",
  };
}

export type OverdueInvoicesSummary = {
  count: number;
  totalAmount: number;
  oldestDays: number;
  currency: string;
};

/**
 * Get summary of overdue invoices for insight nudge section.
 * Returns count, total amount, and how old the oldest overdue invoice is.
 */
export async function getOverdueInvoicesSummary(
  db: Database,
  params: {
    teamId: string;
    asOfDate: Date;
    currency?: string;
  },
): Promise<OverdueInvoicesSummary> {
  const { teamId, asOfDate, currency } = params;

  const conditions = [
    eq(invoices.teamId, teamId),
    eq(invoices.status, "overdue"),
    isNotNull(invoices.dueDate),
  ];

  if (currency) {
    conditions.push(eq(invoices.currency, currency));
  }

  // Get summary stats
  const [summaryResult] = await db
    .select({
      totalAmount: sql<number>`COALESCE(SUM(${invoices.amount}), 0)::numeric`,
      invoiceCount: sql<number>`COUNT(*)::int`,
      oldestDueDate: sql<string>`MIN(${invoices.dueDate})`,
      currency: invoices.currency,
    })
    .from(invoices)
    .where(and(...conditions))
    .groupBy(invoices.currency);

  if (!summaryResult || summaryResult.invoiceCount === 0) {
    return {
      count: 0,
      totalAmount: 0,
      oldestDays: 0,
      currency: currency ?? "USD",
    };
  }

  // Calculate days since oldest due date
  const oldestDueDate = new Date(summaryResult.oldestDueDate);
  const oldestDays = Math.floor(
    (asOfDate.getTime() - oldestDueDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  return {
    count: summaryResult.invoiceCount,
    totalAmount: Number(summaryResult.totalAmount),
    oldestDays: Math.max(0, oldestDays),
    currency: summaryResult.currency ?? currency ?? "USD",
  };
}

// ============================================================================
// MOMENTUM DETECTION
// ============================================================================

/**
 * Detect momentum - is growth accelerating, steady, or decelerating?
 * Compares rate of change between periods.
 *
 * @param currentGrowthRate - Percentage change this period vs previous (e.g., 15 for 15%)
 * @param previousGrowthRate - Percentage change previous period vs one before (e.g., 10 for 10%)
 * @returns 'accelerating' if growth is speeding up, 'decelerating' if slowing, 'steady' otherwise
 */
export function detectMomentum(
  currentGrowthRate: number,
  previousGrowthRate: number,
): MomentumType {
  const difference = currentGrowthRate - previousGrowthRate;

  // Require at least 5 percentage points difference to be significant
  if (difference > 5) {
    return "accelerating";
  }
  if (difference < -5) {
    return "decelerating";
  }
  return "steady";
}

/**
 * Get momentum from historical insight data.
 * Calculates growth rates from past insights and determines if momentum is changing.
 */
export async function getMomentumFromHistory(
  db: Database,
  params: {
    teamId: string;
    currentRevenue: number;
    currentPeriodYear: number;
    currentPeriodNumber: number;
  },
): Promise<{
  momentum: MomentumType;
  currentGrowthRate: number;
  previousGrowthRate: number;
} | null> {
  const { teamId, currentRevenue, currentPeriodYear, currentPeriodNumber } =
    params;

  // Get the last 3 weekly insights (we need 2 previous periods to calculate momentum)
  const pastInsights = await db
    .select({
      allMetrics: insights.allMetrics,
      periodYear: insights.periodYear,
      periodNumber: insights.periodNumber,
    })
    .from(insights)
    .where(
      and(
        eq(insights.teamId, teamId),
        eq(insights.periodType, "weekly"),
        eq(insights.status, "completed"),
        isNotNull(insights.allMetrics),
        sql`NOT (${insights.periodYear} = ${currentPeriodYear} AND ${insights.periodNumber} = ${currentPeriodNumber})`,
      ),
    )
    .orderBy(desc(insights.periodYear), desc(insights.periodNumber))
    .limit(2);

  if (pastInsights.length < 2) {
    return null; // Not enough history
  }

  // Extract revenue values
  const previousWeek = pastInsights[0]!.allMetrics as Record<
    string,
    { value: number }
  > | null;
  const weekBefore = pastInsights[1]!.allMetrics as Record<
    string,
    { value: number }
  > | null;

  const prevRevenue = previousWeek?.revenue?.value ?? 0;
  const weekBeforeRevenue = weekBefore?.revenue?.value ?? 0;

  if (prevRevenue === 0 || weekBeforeRevenue === 0) {
    return null; // Can't calculate growth with zero values
  }

  // Calculate growth rates
  const currentGrowthRate =
    ((currentRevenue - prevRevenue) / prevRevenue) * 100;
  const previousGrowthRate =
    ((prevRevenue - weekBeforeRevenue) / weekBeforeRevenue) * 100;

  return {
    momentum: detectMomentum(currentGrowthRate, previousGrowthRate),
    currentGrowthRate: Math.round(currentGrowthRate * 10) / 10,
    previousGrowthRate: Math.round(previousGrowthRate * 10) / 10,
  };
}

// ============================================================================
// RECOVERY DETECTION
// ============================================================================

/**
 * Detect if current week is a recovery (bounce back) from a dip.
 * A recovery is when revenue increases after 1+ weeks of decline.
 */
export async function detectRecovery(
  db: Database,
  params: {
    teamId: string;
    currentRevenue: number;
    currentPeriodYear: number;
    currentPeriodNumber: number;
  },
): Promise<RecoveryInfo> {
  const { teamId, currentRevenue, currentPeriodYear, currentPeriodNumber } =
    params;

  // Get the last 8 weekly insights
  const pastInsights = await db
    .select({
      allMetrics: insights.allMetrics,
      periodYear: insights.periodYear,
      periodNumber: insights.periodNumber,
    })
    .from(insights)
    .where(
      and(
        eq(insights.teamId, teamId),
        eq(insights.periodType, "weekly"),
        eq(insights.status, "completed"),
        isNotNull(insights.allMetrics),
        sql`NOT (${insights.periodYear} = ${currentPeriodYear} AND ${insights.periodNumber} = ${currentPeriodNumber})`,
      ),
    )
    .orderBy(desc(insights.periodYear), desc(insights.periodNumber))
    .limit(8);

  if (pastInsights.length < 2) {
    return { isRecovery: false, downWeeksBefore: 0 };
  }

  // Extract revenues (most recent first)
  const revenues = pastInsights
    .map((i) => {
      const metrics = i.allMetrics as Record<string, { value: number }> | null;
      return metrics?.revenue?.value ?? 0;
    })
    .filter((r) => r > 0);

  if (revenues.length < 2) {
    return { isRecovery: false, downWeeksBefore: 0 };
  }

  const previousRevenue = revenues[0]!;

  // Check if current week is up from previous
  if (currentRevenue <= previousRevenue) {
    return { isRecovery: false, downWeeksBefore: 0 };
  }

  // Count how many consecutive down weeks preceded the previous week
  let downWeeksBefore = 0;
  for (let i = 0; i < revenues.length - 1; i++) {
    if (revenues[i]! < revenues[i + 1]!) {
      downWeeksBefore++;
    } else {
      break;
    }
  }

  // Only consider it a recovery if there was at least 1 down week
  if (downWeeksBefore === 0) {
    return { isRecovery: false, downWeeksBefore: 0 };
  }

  // Calculate recovery strength
  const recoveryPercent =
    ((currentRevenue - previousRevenue) / previousRevenue) * 100;
  let strength: "strong" | "moderate" | "mild";
  if (recoveryPercent >= 20) {
    strength = "strong";
  } else if (recoveryPercent >= 10) {
    strength = "moderate";
  } else {
    strength = "mild";
  }

  // Build description
  let description: string;
  if (downWeeksBefore >= 3) {
    description = `Bounced back after ${downWeeksBefore} down weeks`;
  } else if (downWeeksBefore === 2) {
    description = "Bounced back after 2 down weeks";
  } else {
    description = "Bounced back from last week's dip";
  }

  return {
    isRecovery: true,
    downWeeksBefore,
    strength,
    description,
  };
}

// ============================================================================
// PREVIOUS PREDICTIONS RETRIEVAL
// ============================================================================

/**
 * Get predictions from the previous week's insight for follow-through comparison.
 */
export async function getPreviousInsightPredictions(
  db: Database,
  params: {
    teamId: string;
    currentPeriodYear: number;
    currentPeriodNumber: number;
  },
): Promise<{
  predictions: InsightPredictions | null;
  periodStart: Date | null;
} | null> {
  const { teamId, currentPeriodYear, currentPeriodNumber } = params;

  // Get the previous week's insight
  const [previousInsight] = await db
    .select({
      predictions: insights.predictions,
      periodStart: insights.periodStart,
    })
    .from(insights)
    .where(
      and(
        eq(insights.teamId, teamId),
        eq(insights.periodType, "weekly"),
        eq(insights.status, "completed"),
        sql`NOT (${insights.periodYear} = ${currentPeriodYear} AND ${insights.periodNumber} = ${currentPeriodNumber})`,
      ),
    )
    .orderBy(desc(insights.periodYear), desc(insights.periodNumber))
    .limit(1);

  if (!previousInsight) {
    return null;
  }

  return {
    predictions: previousInsight.predictions,
    periodStart: previousInsight.periodStart,
  };
}
