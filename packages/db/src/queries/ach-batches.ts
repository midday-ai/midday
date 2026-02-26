import type { Database } from "@db/client";
import { achBatches, achBatchItems, mcaDeals, merchants, bankAccounts } from "@db/schema";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm/sql/sql";

// ============================================================================
// ACH Batch Queries
// ============================================================================

export type GetAchBatchesParams = {
  teamId: string;
  status?: string | null;
  cursor?: string | null;
  pageSize?: number;
};

export const getAchBatches = async (
  db: Database,
  params: GetAchBatchesParams,
) => {
  const { teamId, status, cursor, pageSize = 25 } = params;

  const whereConditions: SQL[] = [eq(achBatches.teamId, teamId)];

  if (status) {
    whereConditions.push(
      eq(
        achBatches.status,
        status as (typeof achBatches.status.enumValues)[number],
      ),
    );
  }

  if (cursor) {
    whereConditions.push(
      sql`${achBatches.createdAt} < ${cursor}`,
    );
  }

  const data = await db
    .select()
    .from(achBatches)
    .where(and(...whereConditions))
    .orderBy(desc(achBatches.createdAt))
    .limit(pageSize + 1);

  const hasMore = data.length > pageSize;
  const items = hasMore ? data.slice(0, pageSize) : data;
  const nextCursor = hasMore ? items[items.length - 1]?.createdAt : null;

  return { data: items, meta: { cursor: nextCursor, hasMore } };
};

export const getAchBatchById = async (
  db: Database,
  params: { id: string; teamId: string },
) => {
  const [batch] = await db
    .select()
    .from(achBatches)
    .where(
      and(eq(achBatches.id, params.id), eq(achBatches.teamId, params.teamId)),
    )
    .limit(1);

  if (!batch) return null;

  const items = await db
    .select({
      id: achBatchItems.id,
      dealId: achBatchItems.dealId,
      receiverName: achBatchItems.receiverName,
      receiverRouting: achBatchItems.receiverRouting,
      receiverAccount: achBatchItems.receiverAccount,
      amount: achBatchItems.amount,
      transactionCode: achBatchItems.transactionCode,
      individualId: achBatchItems.individualId,
      addenda: achBatchItems.addenda,
      status: achBatchItems.status,
      dealCode: mcaDeals.dealCode,
      merchantName: merchants.name,
    })
    .from(achBatchItems)
    .leftJoin(mcaDeals, eq(mcaDeals.id, achBatchItems.dealId))
    .leftJoin(merchants, eq(merchants.id, mcaDeals.merchantId))
    .where(eq(achBatchItems.batchId, params.id))
    .orderBy(asc(achBatchItems.receiverName));

  return { ...batch, items };
};

// ============================================================================
// ACH Batch Mutations
// ============================================================================

export type CreateAchBatchParams = {
  teamId: string;
  createdBy: string;
  effectiveDate: string;
  description?: string;
  originatorBankAccountId?: string;
  originatorName?: string;
  originatorRouting?: string;
  originatorAccount?: string;
};

export const createAchBatch = async (
  db: Database,
  params: CreateAchBatchParams,
) => {
  // Generate batch number: ACH-YYYYMMDD-XXXX
  const dateStr = params.effectiveDate.replace(/-/g, "");
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const batchNumber = `ACH-${dateStr}-${randomSuffix}`;

  const [result] = await db
    .insert(achBatches)
    .values({
      teamId: params.teamId,
      createdBy: params.createdBy,
      batchNumber,
      effectiveDate: params.effectiveDate,
      description: params.description,
      originatorBankAccountId: params.originatorBankAccountId,
      originatorName: params.originatorName,
      originatorRouting: params.originatorRouting,
      originatorAccount: params.originatorAccount,
    })
    .returning();

  return result;
};

export type AddAchBatchItemsParams = {
  batchId: string;
  teamId: string;
  items: {
    dealId: string;
    mcaPaymentId?: string;
    receiverName: string;
    receiverRouting: string;
    receiverAccount: string;
    amount: number;
    transactionCode?: string;
    individualId?: string;
    addenda?: string;
  }[];
};

export const addAchBatchItems = async (
  db: Database,
  params: AddAchBatchItemsParams,
) => {
  if (params.items.length === 0) return [];

  const values = params.items.map((item) => ({
    batchId: params.batchId,
    teamId: params.teamId,
    dealId: item.dealId,
    mcaPaymentId: item.mcaPaymentId,
    receiverName: item.receiverName,
    receiverRouting: item.receiverRouting,
    receiverAccount: item.receiverAccount,
    amount: item.amount,
    transactionCode: item.transactionCode ?? "27",
    individualId: item.individualId,
    addenda: item.addenda,
  }));

  const results = await db
    .insert(achBatchItems)
    .values(values)
    .returning();

  // Update batch totals
  await db
    .update(achBatches)
    .set({
      totalAmount: sql`(
        SELECT COALESCE(SUM(amount), 0) FROM ach_batch_items WHERE batch_id = ${params.batchId}
      )`,
      itemCount: sql`(
        SELECT COUNT(*) FROM ach_batch_items WHERE batch_id = ${params.batchId}
      )`,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(achBatches.id, params.batchId));

  return results;
};

export const removeAchBatchItems = async (
  db: Database,
  params: { batchId: string; teamId: string; itemIds: string[] },
) => {
  await db
    .delete(achBatchItems)
    .where(
      and(
        eq(achBatchItems.batchId, params.batchId),
        sql`${achBatchItems.id} = ANY(${params.itemIds}::uuid[])`,
      ),
    );

  // Update batch totals
  await db
    .update(achBatches)
    .set({
      totalAmount: sql`(
        SELECT COALESCE(SUM(amount), 0) FROM ach_batch_items WHERE batch_id = ${params.batchId}
      )`,
      itemCount: sql`(
        SELECT COUNT(*) FROM ach_batch_items WHERE batch_id = ${params.batchId}
      )`,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(achBatches.id, params.batchId));
};

export const updateAchBatchStatus = async (
  db: Database,
  params: {
    id: string;
    teamId: string;
    status: string;
    nachaFilePath?: string;
    validationErrors?: unknown[];
  },
) => {
  const updateValues: Partial<typeof achBatches.$inferInsert> = {
    status: params.status as (typeof achBatches.status.enumValues)[number],
    updatedAt: new Date().toISOString(),
  };

  if (params.nachaFilePath) {
    updateValues.nachaFilePath = params.nachaFilePath;
  }

  if (params.validationErrors) {
    updateValues.validationErrors = params.validationErrors;
  }

  if (params.status === "submitted") {
    updateValues.submittedAt = new Date().toISOString();
  }

  if (params.status === "completed") {
    updateValues.completedAt = new Date().toISOString();
  }

  const [result] = await db
    .update(achBatches)
    .set(updateValues)
    .where(
      and(eq(achBatches.id, params.id), eq(achBatches.teamId, params.teamId)),
    )
    .returning();

  return result;
};

// ============================================================================
// Upcoming Payments Query (for batch creation)
// ============================================================================

export type GetUpcomingPaymentsParams = {
  teamId: string;
  effectiveDate: string;
};

export const getUpcomingPayments = async (
  db: Database,
  params: GetUpcomingPaymentsParams,
) => {
  // Get active deals with bank account info for ACH collection
  const deals = await db
    .select({
      id: mcaDeals.id,
      dealCode: mcaDeals.dealCode,
      dailyPayment: mcaDeals.dailyPayment,
      paymentFrequency: mcaDeals.paymentFrequency,
      currentBalance: mcaDeals.currentBalance,
      status: mcaDeals.status,
      nsfCount: mcaDeals.nsfCount,
      merchantName: merchants.name,
      merchantId: merchants.id,
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

  return deals;
};
