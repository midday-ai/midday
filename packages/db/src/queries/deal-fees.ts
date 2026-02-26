import type { Database } from "@db/client";
import { dealFees } from "@db/schema";
import { and, eq, sql } from "drizzle-orm";

// ============================================================================
// Types
// ============================================================================

type CreateDealFeeParams = {
  dealId: string;
  teamId: string;
  feeType: "origination" | "processing" | "underwriting" | "broker" | "other";
  feeName: string;
  amount: number;
  percentage?: number | null;
};

type GetDealFeesByDealParams = {
  dealId: string;
  teamId: string;
};

type DeleteDealFeeParams = {
  id: string;
  teamId: string;
};

// ============================================================================
// Queries
// ============================================================================

export const createDealFee = async (
  db: Database,
  params: CreateDealFeeParams,
) => {
  const [result] = await db
    .insert(dealFees)
    .values({
      dealId: params.dealId,
      teamId: params.teamId,
      feeType: params.feeType,
      feeName: params.feeName,
      amount: params.amount,
      percentage: params.percentage ?? null,
    })
    .returning();

  return result;
};

export const getDealFeesByDeal = async (
  db: Database,
  params: GetDealFeesByDealParams,
) => {
  return db
    .select({
      id: dealFees.id,
      dealId: dealFees.dealId,
      teamId: dealFees.teamId,
      feeType: dealFees.feeType,
      feeName: dealFees.feeName,
      amount: dealFees.amount,
      percentage: dealFees.percentage,
      createdAt: dealFees.createdAt,
    })
    .from(dealFees)
    .where(
      and(eq(dealFees.dealId, params.dealId), eq(dealFees.teamId, params.teamId)),
    )
    .orderBy(dealFees.createdAt);
};

export const deleteDealFee = async (
  db: Database,
  params: DeleteDealFeeParams,
) => {
  const [result] = await db
    .delete(dealFees)
    .where(
      and(eq(dealFees.id, params.id), eq(dealFees.teamId, params.teamId)),
    )
    .returning({ id: dealFees.id });

  return result;
};

export const getTotalFeesByDeal = async (
  db: Database,
  params: GetDealFeesByDealParams,
) => {
  const [result] = await db
    .select({
      totalFees: sql<number>`coalesce(sum(${dealFees.amount}), 0)`,
      feeCount: sql<number>`cast(count(*) as int)`,
    })
    .from(dealFees)
    .where(
      and(eq(dealFees.dealId, params.dealId), eq(dealFees.teamId, params.teamId)),
    );

  return result;
};
