import type { Database } from "@db/client";
import {
  customers,
  mcaDeals,
  mcaPayments,
  teams,
} from "@db/schema";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm/sql/sql";

// ============================================================================
// MCA Deal Queries
// ============================================================================

type GetMcaDealByIdParams = {
  id: string;
  teamId: string;
};

export const getMcaDealById = async (
  db: Database,
  params: GetMcaDealByIdParams,
) => {
  const [result] = await db
    .select({
      id: mcaDeals.id,
      createdAt: mcaDeals.createdAt,
      updatedAt: mcaDeals.updatedAt,
      customerId: mcaDeals.customerId,
      teamId: mcaDeals.teamId,
      dealCode: mcaDeals.dealCode,
      fundingAmount: mcaDeals.fundingAmount,
      factorRate: mcaDeals.factorRate,
      paybackAmount: mcaDeals.paybackAmount,
      dailyPayment: mcaDeals.dailyPayment,
      paymentFrequency: mcaDeals.paymentFrequency,
      status: mcaDeals.status,
      fundedAt: mcaDeals.fundedAt,
      expectedPayoffDate: mcaDeals.expectedPayoffDate,
      currentBalance: mcaDeals.currentBalance,
      totalPaid: mcaDeals.totalPaid,
      nsfCount: mcaDeals.nsfCount,
      externalId: mcaDeals.externalId,
      // Customer info
      customerName: customers.name,
      customerEmail: customers.email,
      // Payment count
      paymentCount: sql<number>`cast(count(${mcaPayments.id}) as int)`,
    })
    .from(mcaDeals)
    .where(
      and(eq(mcaDeals.id, params.id), eq(mcaDeals.teamId, params.teamId)),
    )
    .leftJoin(customers, eq(customers.id, mcaDeals.customerId))
    .leftJoin(mcaPayments, eq(mcaPayments.dealId, mcaDeals.id))
    .groupBy(mcaDeals.id, customers.id);

  return result;
};

type GetMcaDealByCodeParams = {
  dealCode: string;
  teamId: string;
};

export const getMcaDealByCode = async (
  db: Database,
  params: GetMcaDealByCodeParams,
) => {
  const [result] = await db
    .select()
    .from(mcaDeals)
    .where(
      and(
        eq(mcaDeals.dealCode, params.dealCode),
        eq(mcaDeals.teamId, params.teamId),
      ),
    )
    .limit(1);

  return result;
};

export type GetMcaDealsParams = {
  teamId: string;
  cursor?: string | null;
  pageSize?: number;
  customerId?: string | null;
  status?: string | null;
  sort?: string[] | null;
};

export const getMcaDeals = async (
  db: Database,
  params: GetMcaDealsParams,
) => {
  const { teamId, cursor, pageSize = 25, customerId, status, sort } = params;

  const whereConditions: SQL[] = [eq(mcaDeals.teamId, teamId)];

  if (customerId) {
    whereConditions.push(eq(mcaDeals.customerId, customerId));
  }

  if (status) {
    whereConditions.push(eq(mcaDeals.status, status as typeof mcaDeals.status.enumValues[number]));
  }

  // Handle cursor-based pagination
  if (cursor) {
    whereConditions.push(sql`${mcaDeals.createdAt} < ${cursor}`);
  }

  // Determine sort order
  let orderBy = desc(mcaDeals.createdAt);
  if (sort && sort.length > 0) {
    const [field, direction] = sort[0]!.split(":");
    const isAsc = direction === "asc";

    switch (field) {
      case "dealCode":
        orderBy = isAsc ? asc(mcaDeals.dealCode) : desc(mcaDeals.dealCode);
        break;
      case "fundingAmount":
        orderBy = isAsc ? asc(mcaDeals.fundingAmount) : desc(mcaDeals.fundingAmount);
        break;
      case "currentBalance":
        orderBy = isAsc ? asc(mcaDeals.currentBalance) : desc(mcaDeals.currentBalance);
        break;
      case "status":
        orderBy = isAsc ? asc(mcaDeals.status) : desc(mcaDeals.status);
        break;
      case "fundedAt":
        orderBy = isAsc ? asc(mcaDeals.fundedAt) : desc(mcaDeals.fundedAt);
        break;
      default:
        orderBy = isAsc ? asc(mcaDeals.createdAt) : desc(mcaDeals.createdAt);
    }
  }

  const data = await db
    .select({
      id: mcaDeals.id,
      createdAt: mcaDeals.createdAt,
      customerId: mcaDeals.customerId,
      dealCode: mcaDeals.dealCode,
      fundingAmount: mcaDeals.fundingAmount,
      factorRate: mcaDeals.factorRate,
      paybackAmount: mcaDeals.paybackAmount,
      dailyPayment: mcaDeals.dailyPayment,
      status: mcaDeals.status,
      fundedAt: mcaDeals.fundedAt,
      currentBalance: mcaDeals.currentBalance,
      totalPaid: mcaDeals.totalPaid,
      nsfCount: mcaDeals.nsfCount,
      // Customer info
      customerName: customers.name,
      customerEmail: customers.email,
      // Calculated paid percentage
      paidPercentage: sql<number>`
        case
          when ${mcaDeals.paybackAmount} > 0
          then round((${mcaDeals.totalPaid}::numeric / ${mcaDeals.paybackAmount}::numeric) * 100, 2)
          else 0
        end
      `.as("paid_percentage"),
    })
    .from(mcaDeals)
    .where(and(...whereConditions))
    .leftJoin(customers, eq(customers.id, mcaDeals.customerId))
    .orderBy(orderBy)
    .limit(pageSize + 1);

  const hasMore = data.length > pageSize;
  const deals = hasMore ? data.slice(0, pageSize) : data;
  const nextCursor = hasMore ? deals[deals.length - 1]?.createdAt : null;

  return {
    data: deals,
    meta: {
      cursor: nextCursor,
      hasMore,
    },
  };
};

type GetMcaDealsByCustomerParams = {
  customerId: string;
  teamId: string;
};

export const getMcaDealsByCustomer = async (
  db: Database,
  params: GetMcaDealsByCustomerParams,
) => {
  const data = await db
    .select({
      id: mcaDeals.id,
      createdAt: mcaDeals.createdAt,
      dealCode: mcaDeals.dealCode,
      fundingAmount: mcaDeals.fundingAmount,
      factorRate: mcaDeals.factorRate,
      paybackAmount: mcaDeals.paybackAmount,
      dailyPayment: mcaDeals.dailyPayment,
      status: mcaDeals.status,
      fundedAt: mcaDeals.fundedAt,
      currentBalance: mcaDeals.currentBalance,
      totalPaid: mcaDeals.totalPaid,
      nsfCount: mcaDeals.nsfCount,
      paidPercentage: sql<number>`
        case
          when ${mcaDeals.paybackAmount} > 0
          then round((${mcaDeals.totalPaid}::numeric / ${mcaDeals.paybackAmount}::numeric) * 100, 2)
          else 0
        end
      `.as("paid_percentage"),
    })
    .from(mcaDeals)
    .where(
      and(
        eq(mcaDeals.customerId, params.customerId),
        eq(mcaDeals.teamId, params.teamId),
      ),
    )
    .orderBy(desc(mcaDeals.fundedAt));

  return data;
};

// ============================================================================
// MCA Deal Mutations
// ============================================================================

export type CreateMcaDealParams = {
  teamId: string;
  customerId: string;
  dealCode: string;
  fundingAmount: number;
  factorRate: number;
  paybackAmount: number;
  dailyPayment?: number;
  paymentFrequency?: string;
  status?: string;
  fundedAt?: string;
  expectedPayoffDate?: string;
  currentBalance: number;
  externalId?: string;
};

export const createMcaDeal = async (
  db: Database,
  params: CreateMcaDealParams,
) => {
  const [result] = await db
    .insert(mcaDeals)
    .values({
      teamId: params.teamId,
      customerId: params.customerId,
      dealCode: params.dealCode,
      fundingAmount: params.fundingAmount,
      factorRate: params.factorRate,
      paybackAmount: params.paybackAmount,
      dailyPayment: params.dailyPayment,
      paymentFrequency: params.paymentFrequency || "daily",
      status: (params.status || "active") as typeof mcaDeals.status.enumValues[number],
      fundedAt: params.fundedAt,
      expectedPayoffDate: params.expectedPayoffDate,
      currentBalance: params.currentBalance,
      externalId: params.externalId,
    })
    .returning();

  return result;
};

export type UpdateMcaDealParams = {
  id: string;
  teamId: string;
  status?: string;
  currentBalance?: number;
  totalPaid?: number;
  nsfCount?: number;
  dailyPayment?: number;
  expectedPayoffDate?: string;
};

export const updateMcaDeal = async (
  db: Database,
  params: UpdateMcaDealParams,
) => {
  const { id, teamId, ...updateData } = params;

  const updateValues: Partial<typeof mcaDeals.$inferInsert> = {};

  if (updateData.status !== undefined) {
    updateValues.status = updateData.status as typeof mcaDeals.status.enumValues[number];
  }
  if (updateData.currentBalance !== undefined) {
    updateValues.currentBalance = updateData.currentBalance;
  }
  if (updateData.totalPaid !== undefined) {
    updateValues.totalPaid = updateData.totalPaid;
  }
  if (updateData.nsfCount !== undefined) {
    updateValues.nsfCount = updateData.nsfCount;
  }
  if (updateData.dailyPayment !== undefined) {
    updateValues.dailyPayment = updateData.dailyPayment;
  }
  if (updateData.expectedPayoffDate !== undefined) {
    updateValues.expectedPayoffDate = updateData.expectedPayoffDate;
  }

  const [result] = await db
    .update(mcaDeals)
    .set(updateValues)
    .where(and(eq(mcaDeals.id, id), eq(mcaDeals.teamId, teamId)))
    .returning();

  return result;
};

export const deleteMcaDeal = async (
  db: Database,
  params: { id: string; teamId: string },
) => {
  const [result] = await db
    .delete(mcaDeals)
    .where(and(eq(mcaDeals.id, params.id), eq(mcaDeals.teamId, params.teamId)))
    .returning();

  return result;
};

// ============================================================================
// MCA Deal Statistics
// ============================================================================

type GetMcaDealStatsParams = {
  teamId: string;
  customerId?: string;
};

export const getMcaDealStats = async (
  db: Database,
  params: GetMcaDealStatsParams,
) => {
  const whereConditions: SQL[] = [eq(mcaDeals.teamId, params.teamId)];

  if (params.customerId) {
    whereConditions.push(eq(mcaDeals.customerId, params.customerId));
  }

  const [result] = await db
    .select({
      totalDeals: sql<number>`cast(count(*) as int)`,
      activeDeals: sql<number>`cast(count(*) filter (where ${mcaDeals.status} = 'active') as int)`,
      totalFunded: sql<number>`coalesce(sum(${mcaDeals.fundingAmount}), 0)`,
      totalPayback: sql<number>`coalesce(sum(${mcaDeals.paybackAmount}), 0)`,
      totalPaid: sql<number>`coalesce(sum(${mcaDeals.totalPaid}), 0)`,
      totalOutstanding: sql<number>`coalesce(sum(${mcaDeals.currentBalance}), 0)`,
      totalNsfCount: sql<number>`coalesce(sum(${mcaDeals.nsfCount}), 0)`,
    })
    .from(mcaDeals)
    .where(and(...whereConditions));

  return result;
};

// ============================================================================
// Portal Queries (for merchant portal)
// ============================================================================

type GetMcaDealsByPortalIdParams = {
  portalId: string;
};

export const getMcaDealsByPortalId = async (
  db: Database,
  params: GetMcaDealsByPortalIdParams,
) => {
  // First get the customer by portal ID
  const [customer] = await db
    .select({
      id: customers.id,
      name: customers.name,
      email: customers.email,
      teamId: customers.teamId,
      portalId: customers.portalId,
      team: {
        name: teams.name,
        logoUrl: teams.logoUrl,
        branding: teams.branding,
      },
    })
    .from(customers)
    .where(eq(customers.portalId, params.portalId))
    .leftJoin(teams, eq(teams.id, customers.teamId))
    .limit(1);

  if (!customer) {
    return null;
  }

  // Get all MCA deals for this customer
  const deals = await db
    .select({
      id: mcaDeals.id,
      createdAt: mcaDeals.createdAt,
      dealCode: mcaDeals.dealCode,
      fundingAmount: mcaDeals.fundingAmount,
      factorRate: mcaDeals.factorRate,
      paybackAmount: mcaDeals.paybackAmount,
      dailyPayment: mcaDeals.dailyPayment,
      paymentFrequency: mcaDeals.paymentFrequency,
      status: mcaDeals.status,
      fundedAt: mcaDeals.fundedAt,
      currentBalance: mcaDeals.currentBalance,
      totalPaid: mcaDeals.totalPaid,
      nsfCount: mcaDeals.nsfCount,
      paidPercentage: sql<number>`
        case
          when ${mcaDeals.paybackAmount} > 0
          then round((${mcaDeals.totalPaid}::numeric / ${mcaDeals.paybackAmount}::numeric) * 100, 2)
          else 0
        end
      `.as("paid_percentage"),
    })
    .from(mcaDeals)
    .where(eq(mcaDeals.customerId, customer.id))
    .orderBy(desc(mcaDeals.fundedAt));

  // Calculate summary
  const summary = {
    totalDeals: deals.length,
    totalFunded: deals.reduce((sum, d) => sum + (d.fundingAmount || 0), 0),
    totalPayback: deals.reduce((sum, d) => sum + (d.paybackAmount || 0), 0),
    totalPaid: deals.reduce((sum, d) => sum + (d.totalPaid || 0), 0),
    totalOutstanding: deals.reduce((sum, d) => sum + (d.currentBalance || 0), 0),
  };

  return {
    customer,
    deals,
    summary,
  };
};
