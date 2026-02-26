import type { Database } from "@db/client";
import { brokerCommissions, brokers, mcaDeals } from "@db/schema";
import { and, desc, eq, sql } from "drizzle-orm";

// ============================================================================
// Types
// ============================================================================

type GetCommissionsByBrokerParams = {
  brokerId: string;
  teamId: string;
};

type GetCommissionsByDealParams = {
  dealId: string;
  teamId: string;
};

type UpsertCommissionParams = {
  id?: string;
  dealId: string;
  brokerId: string;
  teamId: string;
  commissionPercentage: number;
  commissionAmount: number;
  status?: "pending" | "paid" | "cancelled";
  note?: string | null;
};

type MarkCommissionPaidParams = {
  id: string;
  teamId: string;
};

// ============================================================================
// Queries
// ============================================================================

export async function getCommissionsByBroker(
  db: Database,
  params: GetCommissionsByBrokerParams,
) {
  const results = await db
    .select({
      id: brokerCommissions.id,
      createdAt: brokerCommissions.createdAt,
      dealId: brokerCommissions.dealId,
      brokerId: brokerCommissions.brokerId,
      commissionPercentage: brokerCommissions.commissionPercentage,
      commissionAmount: brokerCommissions.commissionAmount,
      status: brokerCommissions.status,
      paidAt: brokerCommissions.paidAt,
      note: brokerCommissions.note,
      // Deal info
      dealCode: mcaDeals.dealCode,
      fundingAmount: mcaDeals.fundingAmount,
      dealStatus: mcaDeals.status,
      merchantName: sql<string>`(select name from merchants where merchants.id = ${mcaDeals.merchantId})`,
    })
    .from(brokerCommissions)
    .innerJoin(mcaDeals, eq(mcaDeals.id, brokerCommissions.dealId))
    .where(
      and(
        eq(brokerCommissions.brokerId, params.brokerId),
        eq(brokerCommissions.teamId, params.teamId),
      ),
    )
    .orderBy(desc(brokerCommissions.createdAt));

  return results;
}

export async function getCommissionsByDeal(
  db: Database,
  params: GetCommissionsByDealParams,
) {
  const results = await db
    .select({
      id: brokerCommissions.id,
      createdAt: brokerCommissions.createdAt,
      brokerId: brokerCommissions.brokerId,
      commissionPercentage: brokerCommissions.commissionPercentage,
      commissionAmount: brokerCommissions.commissionAmount,
      status: brokerCommissions.status,
      paidAt: brokerCommissions.paidAt,
      note: brokerCommissions.note,
      // Broker info
      brokerName: brokers.name,
      brokerCompany: brokers.companyName,
    })
    .from(brokerCommissions)
    .innerJoin(brokers, eq(brokers.id, brokerCommissions.brokerId))
    .where(
      and(
        eq(brokerCommissions.dealId, params.dealId),
        eq(brokerCommissions.teamId, params.teamId),
      ),
    );

  return results;
}

export async function upsertCommission(
  db: Database,
  params: UpsertCommissionParams,
) {
  const { id, ...rest } = params;

  const [commission] = await db
    .insert(brokerCommissions)
    .values({
      id,
      ...rest,
    })
    .onConflictDoUpdate({
      target: [brokerCommissions.dealId, brokerCommissions.brokerId],
      set: {
        commissionPercentage: rest.commissionPercentage,
        commissionAmount: rest.commissionAmount,
        status: rest.status,
        note: rest.note,
      },
    })
    .returning();

  return commission;
}

export async function markCommissionPaid(
  db: Database,
  params: MarkCommissionPaidParams,
) {
  const [result] = await db
    .update(brokerCommissions)
    .set({
      status: "paid",
      paidAt: new Date().toISOString(),
    })
    .where(
      and(
        eq(brokerCommissions.id, params.id),
        eq(brokerCommissions.teamId, params.teamId),
      ),
    )
    .returning();

  return result;
}
