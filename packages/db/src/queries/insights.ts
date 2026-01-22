import type { Database, DatabaseOrTransaction } from "@db/client";
import {
  type ExpenseAnomaly,
  type InsightActivity,
  type InsightAnomaly,
  type InsightContent,
  type InsightMetric,
  type InsightMilestone,
  bankAccounts,
  bankConnections,
  customers,
  inbox,
  type insightPeriodTypeEnum,
  type insightStatusEnum,
  insightUserStatus,
  insights,
  invoices,
  trackerEntries,
  trackerProjects,
  transactions,
} from "@db/schema";
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
    createdAt: inv.createdAt
      ? inv.createdAt instanceof Date
        ? inv.createdAt.toISOString()
        : String(inv.createdAt)
      : new Date().toISOString(),
  }));
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
