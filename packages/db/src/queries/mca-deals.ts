import type { Database } from "@db/client";
import {
  merchants,
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
      merchantId: mcaDeals.merchantId,
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
      // Merchant info
      merchantName: merchants.name,
      merchantEmail: merchants.email,
      // Payment count
      paymentCount: sql<number>`cast(count(${mcaPayments.id}) as int)`,
    })
    .from(mcaDeals)
    .where(
      and(eq(mcaDeals.id, params.id), eq(mcaDeals.teamId, params.teamId)),
    )
    .leftJoin(merchants, eq(merchants.id, mcaDeals.merchantId))
    .leftJoin(mcaPayments, eq(mcaPayments.dealId, mcaDeals.id))
    .groupBy(mcaDeals.id, merchants.id);

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
  merchantId?: string | null;
  status?: string | null;
  sort?: string[] | null;
};

export const getMcaDeals = async (
  db: Database,
  params: GetMcaDealsParams,
) => {
  const { teamId, cursor, pageSize = 25, merchantId, status, sort } = params;

  const whereConditions: SQL[] = [eq(mcaDeals.teamId, teamId)];

  if (merchantId) {
    whereConditions.push(eq(mcaDeals.merchantId, merchantId));
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
      merchantId: mcaDeals.merchantId,
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
      // Merchant info
      merchantName: merchants.name,
      merchantEmail: merchants.email,
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
    .leftJoin(merchants, eq(merchants.id, mcaDeals.merchantId))
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

type GetMcaDealsByMerchantParams = {
  merchantId: string;
  teamId: string;
};

export const getMcaDealsByMerchant = async (
  db: Database,
  params: GetMcaDealsByMerchantParams,
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
        eq(mcaDeals.merchantId, params.merchantId),
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
  merchantId: string;
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
  brokerId?: string;
  // Contract Dates
  startDate?: string;
  maturityDate?: string;
  firstPaymentDate?: string;
  // Holdback
  holdbackPercentage?: number;
  // Legal Terms
  uccFilingStatus?: string;
  personalGuarantee?: boolean;
  defaultTerms?: string;
  curePeriodDays?: number;
};

export const createMcaDeal = async (
  db: Database,
  params: CreateMcaDealParams,
) => {
  const [result] = await db
    .insert(mcaDeals)
    .values({
      teamId: params.teamId,
      merchantId: params.merchantId,
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
      brokerId: params.brokerId,
      startDate: params.startDate,
      maturityDate: params.maturityDate,
      firstPaymentDate: params.firstPaymentDate,
      holdbackPercentage: params.holdbackPercentage,
      uccFilingStatus: params.uccFilingStatus,
      personalGuarantee: params.personalGuarantee,
      defaultTerms: params.defaultTerms,
      curePeriodDays: params.curePeriodDays,
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
  merchantId?: string;
};

export const getMcaDealStats = async (
  db: Database,
  params: GetMcaDealStatsParams,
) => {
  const whereConditions: SQL[] = [eq(mcaDeals.teamId, params.teamId)];

  if (params.merchantId) {
    whereConditions.push(eq(mcaDeals.merchantId, params.merchantId));
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
// Status Breakdown (for dashboard widgets)
// ============================================================================

type GetMcaDealStatusBreakdownParams = {
  teamId: string;
};

export const getMcaDealStatusBreakdown = async (
  db: Database,
  params: GetMcaDealStatusBreakdownParams,
) => {
  const results = await db
    .select({
      status: mcaDeals.status,
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(mcaDeals)
    .where(eq(mcaDeals.teamId, params.teamId))
    .groupBy(mcaDeals.status);

  const breakdown: Record<string, number> = {
    active: 0,
    late: 0,
    paid_off: 0,
    defaulted: 0,
    paused: 0,
    in_collections: 0,
  };

  for (const row of results) {
    if (row.status) {
      breakdown[row.status] = row.count;
    }
  }

  return breakdown;
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
  // First get the merchant by portal ID
  const [merchant] = await db
    .select({
      id: merchants.id,
      name: merchants.name,
      email: merchants.email,
      teamId: merchants.teamId,
      portalId: merchants.portalId,
      team: {
        name: teams.name,
        logoUrl: teams.logoUrl,
        branding: teams.branding,
      },
    })
    .from(merchants)
    .where(eq(merchants.portalId, params.portalId))
    .leftJoin(teams, eq(teams.id, merchants.teamId))
    .limit(1);

  if (!merchant) {
    return null;
  }

  // Get all MCA deals for this merchant
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
    .where(eq(mcaDeals.merchantId, merchant.id))
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
    merchant,
    deals,
    summary,
  };
};
