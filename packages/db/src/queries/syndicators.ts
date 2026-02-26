import type { Database } from "@db/client";
import {
  mcaDeals,
  merchants,
  syndicationParticipants,
  syndicators,
  teams,
} from "@db/schema";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm/sql/sql";
import { nanoid } from "nanoid";

// ============================================================================
// Types
// ============================================================================

type GetSyndicatorByIdParams = {
  id: string;
  teamId: string;
};

type GetSyndicatorsParams = {
  teamId: string;
  cursor?: string | null;
  pageSize?: number;
  sort?: string[] | null;
  q?: string | null;
};

type UpsertSyndicatorParams = {
  id?: string;
  teamId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  companyName?: string | null;
  website?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  country?: string | null;
  status?: "active" | "inactive";
  note?: string | null;
  externalId?: string | null;
};

type DeleteSyndicatorParams = {
  id: string;
  teamId: string;
};

type ToggleSyndicatorPortalParams = {
  syndicatorId: string;
  teamId: string;
  enabled: boolean;
};

type GetSyndicatorByPortalIdParams = {
  portalId: string;
};

type GetSyndicatorDealsParams = {
  syndicatorId: string;
  teamId: string;
};

type GetSyndicatorDealStatsParams = {
  syndicatorId: string;
  teamId: string;
};

// ============================================================================
// Queries
// ============================================================================

export const getSyndicatorById = async (
  db: Database,
  params: GetSyndicatorByIdParams,
) => {
  const [result] = await db
    .select({
      id: syndicators.id,
      createdAt: syndicators.createdAt,
      updatedAt: syndicators.updatedAt,
      teamId: syndicators.teamId,
      name: syndicators.name,
      email: syndicators.email,
      phone: syndicators.phone,
      companyName: syndicators.companyName,
      website: syndicators.website,
      addressLine1: syndicators.addressLine1,
      addressLine2: syndicators.addressLine2,
      city: syndicators.city,
      state: syndicators.state,
      zip: syndicators.zip,
      country: syndicators.country,
      portalEnabled: syndicators.portalEnabled,
      portalId: syndicators.portalId,
      status: syndicators.status,
      note: syndicators.note,
      externalId: syndicators.externalId,
      // Syndication aggregates
      dealCount: sql<number>`(select cast(count(*) as int) from syndication_participants where syndication_participants.syndicator_id = ${syndicators.id})`,
      activeDealCount: sql<number>`(select cast(count(*) as int) from syndication_participants sp inner join mca_deals md on md.id = sp.deal_id where sp.syndicator_id = ${syndicators.id} and md.status = 'active')`,
      totalFundingShare: sql<number>`(select coalesce(sum(funding_share), 0) from syndication_participants where syndication_participants.syndicator_id = ${syndicators.id})`,
    })
    .from(syndicators)
    .where(
      and(
        eq(syndicators.id, params.id),
        eq(syndicators.teamId, params.teamId),
      ),
    )
    .limit(1);

  return result;
};

export const getSyndicators = async (
  db: Database,
  params: GetSyndicatorsParams,
) => {
  const { teamId, sort, cursor, pageSize = 25, q } = params;

  const whereConditions: SQL[] = [eq(syndicators.teamId, teamId)];

  if (q) {
    whereConditions.push(
      sql`${syndicators.name} ILIKE '%' || ${q} || '%' OR ${syndicators.companyName} ILIKE '%' || ${q} || '%' OR ${syndicators.email} ILIKE '%' || ${q} || '%'`,
    );
  }

  const query = db
    .select({
      id: syndicators.id,
      createdAt: syndicators.createdAt,
      teamId: syndicators.teamId,
      name: syndicators.name,
      email: syndicators.email,
      phone: syndicators.phone,
      companyName: syndicators.companyName,
      status: syndicators.status,
      portalEnabled: syndicators.portalEnabled,
      // Syndication aggregates (scalar subqueries)
      dealCount: sql<number>`(select cast(count(*) as int) from syndication_participants where syndication_participants.syndicator_id = ${syndicators.id})`,
      activeDealCount: sql<number>`(select cast(count(*) as int) from syndication_participants sp inner join mca_deals md on md.id = sp.deal_id where sp.syndicator_id = ${syndicators.id} and md.status = 'active')`,
      totalFundingShare: sql<number>`(select coalesce(sum(funding_share), 0) from syndication_participants where syndication_participants.syndicator_id = ${syndicators.id})`,
    })
    .from(syndicators)
    .where(and(...whereConditions));

  // Apply sorting
  if (sort && sort.length === 2) {
    const [column, direction] = sort;
    const isAscending = direction === "asc";

    if (column === "name") {
      isAscending
        ? query.orderBy(asc(syndicators.name))
        : query.orderBy(desc(syndicators.name));
    } else if (column === "created_at") {
      isAscending
        ? query.orderBy(asc(syndicators.createdAt))
        : query.orderBy(desc(syndicators.createdAt));
    } else if (column === "email") {
      isAscending
        ? query.orderBy(asc(syndicators.email))
        : query.orderBy(desc(syndicators.email));
    } else if (column === "company_name") {
      isAscending
        ? query.orderBy(asc(syndicators.companyName))
        : query.orderBy(desc(syndicators.companyName));
    } else if (column === "deals") {
      isAscending
        ? query.orderBy(
            asc(
              sql`(select count(*) from syndication_participants where syndication_participants.syndicator_id = ${syndicators.id})`,
            ),
          )
        : query.orderBy(
            desc(
              sql`(select count(*) from syndication_participants where syndication_participants.syndicator_id = ${syndicators.id})`,
            ),
          );
    } else if (column === "total_funding") {
      isAscending
        ? query.orderBy(
            asc(
              sql`(select coalesce(sum(funding_share), 0) from syndication_participants where syndication_participants.syndicator_id = ${syndicators.id})`,
            ),
          )
        : query.orderBy(
            desc(
              sql`(select coalesce(sum(funding_share), 0) from syndication_participants where syndication_participants.syndicator_id = ${syndicators.id})`,
            ),
          );
    }
  } else {
    query.orderBy(desc(syndicators.createdAt));
  }

  // Apply pagination
  const offset = cursor ? Number.parseInt(cursor, 10) : 0;
  query.limit(pageSize).offset(offset);

  const data = await query;

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
};

export const upsertSyndicator = async (
  db: Database,
  params: UpsertSyndicatorParams,
) => {
  const { id, teamId, ...rest } = params;

  const [syndicator] = await db
    .insert(syndicators)
    .values({
      id,
      teamId,
      ...rest,
    })
    .onConflictDoUpdate({
      target: syndicators.id,
      set: {
        name: rest.name,
        email: rest.email,
        phone: rest.phone,
        companyName: rest.companyName,
        website: rest.website,
        addressLine1: rest.addressLine1,
        addressLine2: rest.addressLine2,
        city: rest.city,
        state: rest.state,
        zip: rest.zip,
        country: rest.country,
        status: rest.status,
        note: rest.note,
        externalId: rest.externalId,
      },
    })
    .returning();

  return syndicator;
};

export const deleteSyndicator = async (
  db: Database,
  params: DeleteSyndicatorParams,
) => {
  const [result] = await db
    .delete(syndicators)
    .where(
      and(
        eq(syndicators.id, params.id),
        eq(syndicators.teamId, params.teamId),
      ),
    )
    .returning({ id: syndicators.id });

  return result;
};

export async function toggleSyndicatorPortal(
  db: Database,
  params: ToggleSyndicatorPortalParams,
) {
  const { syndicatorId, teamId, enabled } = params;

  const [current] = await db
    .select({
      id: syndicators.id,
      portalId: syndicators.portalId,
    })
    .from(syndicators)
    .where(
      and(eq(syndicators.id, syndicatorId), eq(syndicators.teamId, teamId)),
    )
    .limit(1);

  if (!current) {
    throw new Error("Syndicator not found");
  }

  const portalId =
    enabled && !current.portalId ? nanoid(8) : current.portalId;

  const [result] = await db
    .update(syndicators)
    .set({
      portalEnabled: enabled,
      portalId,
    })
    .where(
      and(eq(syndicators.id, syndicatorId), eq(syndicators.teamId, teamId)),
    )
    .returning({
      id: syndicators.id,
      portalEnabled: syndicators.portalEnabled,
      portalId: syndicators.portalId,
    });

  return result;
}

export async function getSyndicatorByPortalId(
  db: Database,
  params: GetSyndicatorByPortalIdParams,
) {
  const { portalId } = params;

  const [result] = await db
    .select({
      id: syndicators.id,
      name: syndicators.name,
      email: syndicators.email,
      companyName: syndicators.companyName,
      teamId: syndicators.teamId,
      portalEnabled: syndicators.portalEnabled,
      portalId: syndicators.portalId,
      team: {
        id: teams.id,
        name: teams.name,
        logoUrl: teams.logoUrl,
        baseCurrency: teams.baseCurrency,
      },
    })
    .from(syndicators)
    .innerJoin(teams, eq(teams.id, syndicators.teamId))
    .where(
      and(
        eq(syndicators.portalId, portalId),
        eq(syndicators.portalEnabled, true),
      ),
    )
    .limit(1);

  return result;
}

export async function getSyndicatorDeals(
  db: Database,
  params: GetSyndicatorDealsParams,
) {
  const results = await db
    .select({
      id: mcaDeals.id,
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
      merchantName: sql<string>`(select name from merchants where merchants.id = ${mcaDeals.merchantId})`,
      // Syndication participation details
      participantId: syndicationParticipants.id,
      fundingShare: syndicationParticipants.fundingShare,
      ownershipPercentage: syndicationParticipants.ownershipPercentage,
      participantStatus: syndicationParticipants.status,
      // Proportional metrics
      theirBalance: sql<number>`${mcaDeals.currentBalance} * ${syndicationParticipants.ownershipPercentage}`,
      theirPaid: sql<number>`${mcaDeals.totalPaid} * ${syndicationParticipants.ownershipPercentage}`,
      theirPayback: sql<number>`${mcaDeals.paybackAmount} * ${syndicationParticipants.ownershipPercentage}`,
    })
    .from(syndicationParticipants)
    .innerJoin(mcaDeals, eq(mcaDeals.id, syndicationParticipants.dealId))
    .where(
      and(
        eq(syndicationParticipants.syndicatorId, params.syndicatorId),
        eq(syndicationParticipants.teamId, params.teamId),
      ),
    )
    .orderBy(desc(mcaDeals.fundedAt));

  return results;
}

export async function getSyndicatorDealStats(
  db: Database,
  params: GetSyndicatorDealStatsParams,
) {
  const [result] = await db
    .select({
      totalDeals: sql<number>`cast(count(*) as int)`,
      activeDeals: sql<number>`cast(count(*) filter (where ${mcaDeals.status} = 'active') as int)`,
      totalFundingShare: sql<number>`coalesce(sum(${syndicationParticipants.fundingShare}), 0)`,
      totalProportionalBalance: sql<number>`coalesce(sum(${mcaDeals.currentBalance} * ${syndicationParticipants.ownershipPercentage}), 0)`,
      totalProportionalPaid: sql<number>`coalesce(sum(${mcaDeals.totalPaid} * ${syndicationParticipants.ownershipPercentage}), 0)`,
    })
    .from(syndicationParticipants)
    .innerJoin(mcaDeals, eq(mcaDeals.id, syndicationParticipants.dealId))
    .where(
      and(
        eq(syndicationParticipants.syndicatorId, params.syndicatorId),
        eq(syndicationParticipants.teamId, params.teamId),
      ),
    );

  return result;
}
