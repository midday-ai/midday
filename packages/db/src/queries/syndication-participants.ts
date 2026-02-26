import type { Database } from "@db/client";
import {
  mcaDeals,
  syndicationParticipants,
  syndicators,
} from "@db/schema";
import { and, eq, sql } from "drizzle-orm";

// ============================================================================
// Types
// ============================================================================

type GetParticipantsByDealParams = {
  dealId: string;
  teamId: string;
};

type GetParticipantsBySyndicatorParams = {
  syndicatorId: string;
  teamId: string;
};

type UpsertParticipantParams = {
  id?: string;
  dealId: string;
  syndicatorId: string;
  teamId: string;
  fundingShare: number;
  ownershipPercentage: number;
  status?: "active" | "bought_out" | "defaulted";
  note?: string | null;
};

type RemoveParticipantParams = {
  id: string;
  teamId: string;
};

type ValidateSplitsParams = {
  dealId: string;
  teamId: string;
  excludeParticipantId?: string;
};

// ============================================================================
// Queries
// ============================================================================

export async function getParticipantsByDeal(
  db: Database,
  params: GetParticipantsByDealParams,
) {
  const results = await db
    .select({
      id: syndicationParticipants.id,
      createdAt: syndicationParticipants.createdAt,
      dealId: syndicationParticipants.dealId,
      syndicatorId: syndicationParticipants.syndicatorId,
      fundingShare: syndicationParticipants.fundingShare,
      ownershipPercentage: syndicationParticipants.ownershipPercentage,
      status: syndicationParticipants.status,
      note: syndicationParticipants.note,
      // Syndicator info
      syndicatorName: syndicators.name,
      syndicatorCompany: syndicators.companyName,
      syndicatorEmail: syndicators.email,
    })
    .from(syndicationParticipants)
    .innerJoin(
      syndicators,
      eq(syndicators.id, syndicationParticipants.syndicatorId),
    )
    .where(
      and(
        eq(syndicationParticipants.dealId, params.dealId),
        eq(syndicationParticipants.teamId, params.teamId),
      ),
    );

  return results;
}

export async function getParticipantsBySyndicator(
  db: Database,
  params: GetParticipantsBySyndicatorParams,
) {
  const results = await db
    .select({
      id: syndicationParticipants.id,
      createdAt: syndicationParticipants.createdAt,
      dealId: syndicationParticipants.dealId,
      syndicatorId: syndicationParticipants.syndicatorId,
      fundingShare: syndicationParticipants.fundingShare,
      ownershipPercentage: syndicationParticipants.ownershipPercentage,
      status: syndicationParticipants.status,
      note: syndicationParticipants.note,
      // Deal info
      dealCode: mcaDeals.dealCode,
      fundingAmount: mcaDeals.fundingAmount,
      dealStatus: mcaDeals.status,
      merchantName: sql<string>`(select name from merchants where merchants.id = ${mcaDeals.merchantId})`,
    })
    .from(syndicationParticipants)
    .innerJoin(mcaDeals, eq(mcaDeals.id, syndicationParticipants.dealId))
    .where(
      and(
        eq(syndicationParticipants.syndicatorId, params.syndicatorId),
        eq(syndicationParticipants.teamId, params.teamId),
      ),
    );

  return results;
}

export async function upsertParticipant(
  db: Database,
  params: UpsertParticipantParams,
) {
  const { id, ...rest } = params;

  const [participant] = await db
    .insert(syndicationParticipants)
    .values({
      id,
      ...rest,
    })
    .onConflictDoUpdate({
      target: [
        syndicationParticipants.dealId,
        syndicationParticipants.syndicatorId,
      ],
      set: {
        fundingShare: rest.fundingShare,
        ownershipPercentage: rest.ownershipPercentage,
        status: rest.status,
        note: rest.note,
      },
    })
    .returning();

  return participant;
}

export async function removeParticipant(
  db: Database,
  params: RemoveParticipantParams,
) {
  const [result] = await db
    .delete(syndicationParticipants)
    .where(
      and(
        eq(syndicationParticipants.id, params.id),
        eq(syndicationParticipants.teamId, params.teamId),
      ),
    )
    .returning({ id: syndicationParticipants.id });

  return result;
}

export async function validateSplits(
  db: Database,
  params: ValidateSplitsParams,
) {
  const conditions = [
    eq(syndicationParticipants.dealId, params.dealId),
    eq(syndicationParticipants.teamId, params.teamId),
  ];

  if (params.excludeParticipantId) {
    conditions.push(
      sql`${syndicationParticipants.id} != ${params.excludeParticipantId}` as any,
    );
  }

  const [result] = await db
    .select({
      total: sql<number>`coalesce(sum(${syndicationParticipants.ownershipPercentage}), 0)`,
    })
    .from(syndicationParticipants)
    .where(and(...conditions));

  const total = Number(result?.total ?? 0);

  return {
    total,
    isValid: total <= 1.0,
    remaining: Math.max(0, 1.0 - total),
  };
}
