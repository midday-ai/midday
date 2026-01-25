import type { Database } from "@db/client";
import { mcaDeals, mcaPayments } from "@db/schema";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm/sql/sql";

// ============================================================================
// MCA Payment Queries
// ============================================================================

type GetMcaPaymentByIdParams = {
  id: string;
  teamId: string;
};

export const getMcaPaymentById = async (
  db: Database,
  params: GetMcaPaymentByIdParams,
) => {
  const [result] = await db
    .select()
    .from(mcaPayments)
    .where(
      and(eq(mcaPayments.id, params.id), eq(mcaPayments.teamId, params.teamId)),
    )
    .limit(1);

  return result;
};

export type GetMcaPaymentsParams = {
  teamId: string;
  dealId?: string | null;
  cursor?: string | null;
  pageSize?: number;
  status?: string | null;
  sort?: string[] | null;
};

export const getMcaPayments = async (
  db: Database,
  params: GetMcaPaymentsParams,
) => {
  const { teamId, dealId, cursor, pageSize = 50, status, sort } = params;

  const whereConditions: SQL[] = [eq(mcaPayments.teamId, teamId)];

  if (dealId) {
    whereConditions.push(eq(mcaPayments.dealId, dealId));
  }

  if (status) {
    whereConditions.push(eq(mcaPayments.status, status as typeof mcaPayments.status.enumValues[number]));
  }

  // Handle cursor-based pagination
  if (cursor) {
    whereConditions.push(sql`${mcaPayments.paymentDate} < ${cursor}`);
  }

  // Determine sort order
  let orderBy = desc(mcaPayments.paymentDate);
  if (sort && sort.length > 0) {
    const [field, direction] = sort[0]!.split(":");
    const isAsc = direction === "asc";

    switch (field) {
      case "amount":
        orderBy = isAsc ? asc(mcaPayments.amount) : desc(mcaPayments.amount);
        break;
      case "status":
        orderBy = isAsc ? asc(mcaPayments.status) : desc(mcaPayments.status);
        break;
      case "createdAt":
        orderBy = isAsc ? asc(mcaPayments.createdAt) : desc(mcaPayments.createdAt);
        break;
      default:
        orderBy = isAsc ? asc(mcaPayments.paymentDate) : desc(mcaPayments.paymentDate);
    }
  }

  const data = await db
    .select({
      id: mcaPayments.id,
      createdAt: mcaPayments.createdAt,
      dealId: mcaPayments.dealId,
      amount: mcaPayments.amount,
      paymentDate: mcaPayments.paymentDate,
      paymentType: mcaPayments.paymentType,
      status: mcaPayments.status,
      description: mcaPayments.description,
      nsfAt: mcaPayments.nsfAt,
      nsfFee: mcaPayments.nsfFee,
      balanceBefore: mcaPayments.balanceBefore,
      balanceAfter: mcaPayments.balanceAfter,
      externalId: mcaPayments.externalId,
      // Deal info
      dealCode: mcaDeals.dealCode,
    })
    .from(mcaPayments)
    .where(and(...whereConditions))
    .leftJoin(mcaDeals, eq(mcaDeals.id, mcaPayments.dealId))
    .orderBy(orderBy)
    .limit(pageSize + 1);

  const hasMore = data.length > pageSize;
  const payments = hasMore ? data.slice(0, pageSize) : data;
  const nextCursor = hasMore ? payments[payments.length - 1]?.paymentDate : null;

  return {
    data: payments,
    meta: {
      cursor: nextCursor,
      hasMore,
    },
  };
};

type GetMcaPaymentsByDealParams = {
  dealId: string;
  teamId: string;
};

export const getMcaPaymentsByDeal = async (
  db: Database,
  params: GetMcaPaymentsByDealParams,
) => {
  const data = await db
    .select()
    .from(mcaPayments)
    .where(
      and(
        eq(mcaPayments.dealId, params.dealId),
        eq(mcaPayments.teamId, params.teamId),
      ),
    )
    .orderBy(desc(mcaPayments.paymentDate));

  return data;
};

// ============================================================================
// MCA Payment Mutations
// ============================================================================

export type CreateMcaPaymentParams = {
  teamId: string;
  dealId: string;
  amount: number;
  paymentDate: string;
  paymentType?: string;
  status?: string;
  description?: string;
  nsfAt?: string;
  nsfFee?: number;
  balanceBefore?: number;
  balanceAfter?: number;
  externalId?: string;
};

export const createMcaPayment = async (
  db: Database,
  params: CreateMcaPaymentParams,
) => {
  const [result] = await db
    .insert(mcaPayments)
    .values({
      teamId: params.teamId,
      dealId: params.dealId,
      amount: params.amount,
      paymentDate: params.paymentDate,
      paymentType: (params.paymentType || "ach") as typeof mcaPayments.paymentType.enumValues[number],
      status: (params.status || "completed") as typeof mcaPayments.status.enumValues[number],
      description: params.description,
      nsfAt: params.nsfAt,
      nsfFee: params.nsfFee,
      balanceBefore: params.balanceBefore,
      balanceAfter: params.balanceAfter,
      externalId: params.externalId,
    })
    .returning();

  return result;
};

export type UpdateMcaPaymentParams = {
  id: string;
  teamId: string;
  status?: string;
  nsfAt?: string;
  nsfFee?: number;
  balanceAfter?: number;
  description?: string;
};

export const updateMcaPayment = async (
  db: Database,
  params: UpdateMcaPaymentParams,
) => {
  const { id, teamId, ...updateData } = params;

  const updateValues: Partial<typeof mcaPayments.$inferInsert> = {};

  if (updateData.status !== undefined) {
    updateValues.status = updateData.status as typeof mcaPayments.status.enumValues[number];
  }
  if (updateData.nsfAt !== undefined) {
    updateValues.nsfAt = updateData.nsfAt;
  }
  if (updateData.nsfFee !== undefined) {
    updateValues.nsfFee = updateData.nsfFee;
  }
  if (updateData.balanceAfter !== undefined) {
    updateValues.balanceAfter = updateData.balanceAfter;
  }
  if (updateData.description !== undefined) {
    updateValues.description = updateData.description;
  }

  const [result] = await db
    .update(mcaPayments)
    .set(updateValues)
    .where(and(eq(mcaPayments.id, id), eq(mcaPayments.teamId, teamId)))
    .returning();

  return result;
};

export const deleteMcaPayment = async (
  db: Database,
  params: { id: string; teamId: string },
) => {
  const [result] = await db
    .delete(mcaPayments)
    .where(
      and(eq(mcaPayments.id, params.id), eq(mcaPayments.teamId, params.teamId)),
    )
    .returning();

  return result;
};

// ============================================================================
// MCA Payment Statistics
// ============================================================================

type GetMcaPaymentStatsParams = {
  teamId: string;
  dealId?: string;
};

export const getMcaPaymentStats = async (
  db: Database,
  params: GetMcaPaymentStatsParams,
) => {
  const whereConditions: SQL[] = [eq(mcaPayments.teamId, params.teamId)];

  if (params.dealId) {
    whereConditions.push(eq(mcaPayments.dealId, params.dealId));
  }

  const [result] = await db
    .select({
      totalPayments: sql<number>`cast(count(*) as int)`,
      completedPayments: sql<number>`cast(count(*) filter (where ${mcaPayments.status} = 'completed') as int)`,
      returnedPayments: sql<number>`cast(count(*) filter (where ${mcaPayments.status} = 'returned') as int)`,
      totalAmount: sql<number>`coalesce(sum(${mcaPayments.amount}) filter (where ${mcaPayments.status} = 'completed'), 0)`,
      totalNsfFees: sql<number>`coalesce(sum(${mcaPayments.nsfFee}), 0)`,
    })
    .from(mcaPayments)
    .where(and(...whereConditions));

  return result;
};

// ============================================================================
// Portal Queries (for merchant portal)
// ============================================================================

type GetMcaPaymentsByPortalDealParams = {
  dealId: string;
  portalId: string;
};

export const getMcaPaymentsByPortalDeal = async (
  db: Database,
  params: GetMcaPaymentsByPortalDealParams,
) => {
  // Verify the deal belongs to the customer with this portal ID
  const [deal] = await db
    .select({
      id: mcaDeals.id,
      teamId: mcaDeals.teamId,
    })
    .from(mcaDeals)
    .innerJoin(
      sql`customers c ON c.id = ${mcaDeals.customerId} AND c.portal_id = ${params.portalId}`,
    )
    .where(eq(mcaDeals.id, params.dealId))
    .limit(1);

  if (!deal) {
    return null;
  }

  // Get payments for this deal
  const payments = await db
    .select({
      id: mcaPayments.id,
      createdAt: mcaPayments.createdAt,
      amount: mcaPayments.amount,
      paymentDate: mcaPayments.paymentDate,
      paymentType: mcaPayments.paymentType,
      status: mcaPayments.status,
      description: mcaPayments.description,
      nsfFee: mcaPayments.nsfFee,
      balanceBefore: mcaPayments.balanceBefore,
      balanceAfter: mcaPayments.balanceAfter,
    })
    .from(mcaPayments)
    .where(eq(mcaPayments.dealId, params.dealId))
    .orderBy(desc(mcaPayments.paymentDate));

  return payments;
};
