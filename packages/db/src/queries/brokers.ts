import type { Database } from "@db/client";
import { brokerCommissions, brokers, mcaDeals, teams } from "@db/schema";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm/sql/sql";
import { nanoid } from "nanoid";

// ============================================================================
// Types
// ============================================================================

type GetBrokerByIdParams = {
  id: string;
  teamId: string;
};

type GetBrokersParams = {
  teamId: string;
  cursor?: string | null;
  pageSize?: number;
  sort?: string[] | null;
  q?: string | null;
};

type UpsertBrokerParams = {
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
  commissionPercentage?: number | null;
  status?: "active" | "inactive";
  note?: string | null;
  externalId?: string | null;
};

type DeleteBrokerParams = {
  id: string;
  teamId: string;
};

type ToggleBrokerPortalParams = {
  brokerId: string;
  teamId: string;
  enabled: boolean;
};

type GetBrokerByPortalIdParams = {
  portalId: string;
};

type GetBrokerDealsParams = {
  brokerId: string;
  teamId: string;
};

type GetBrokerDealStatsParams = {
  brokerId: string;
  teamId: string;
};

// ============================================================================
// Queries
// ============================================================================

export const getBrokerById = async (
  db: Database,
  params: GetBrokerByIdParams,
) => {
  const [result] = await db
    .select({
      id: brokers.id,
      createdAt: brokers.createdAt,
      updatedAt: brokers.updatedAt,
      teamId: brokers.teamId,
      name: brokers.name,
      email: brokers.email,
      phone: brokers.phone,
      companyName: brokers.companyName,
      website: brokers.website,
      addressLine1: brokers.addressLine1,
      addressLine2: brokers.addressLine2,
      city: brokers.city,
      state: brokers.state,
      zip: brokers.zip,
      country: brokers.country,
      commissionType: brokers.commissionType,
      commissionPercentage: brokers.commissionPercentage,
      flatFee: brokers.flatFee,
      portalEnabled: brokers.portalEnabled,
      portalId: brokers.portalId,
      status: brokers.status,
      note: brokers.note,
      externalId: brokers.externalId,
      // Deal aggregates
      dealCount: sql<number>`(select cast(count(*) as int) from mca_deals where mca_deals.broker_id = ${brokers.id})`,
      activeDealCount: sql<number>`(select cast(count(*) as int) from mca_deals where mca_deals.broker_id = ${brokers.id} and mca_deals.status = 'active')`,
      totalFundedAmount: sql<number>`(select coalesce(sum(funding_amount), 0) from mca_deals where mca_deals.broker_id = ${brokers.id})`,
      // Commission aggregates
      totalCommissionsEarned: sql<number>`(select coalesce(sum(commission_amount), 0) from broker_commissions where broker_commissions.broker_id = ${brokers.id})`,
      pendingCommissions: sql<number>`(select coalesce(sum(commission_amount), 0) from broker_commissions where broker_commissions.broker_id = ${brokers.id} and broker_commissions.status = 'pending')`,
      paidCommissions: sql<number>`(select coalesce(sum(commission_amount), 0) from broker_commissions where broker_commissions.broker_id = ${brokers.id} and broker_commissions.status = 'paid')`,
    })
    .from(brokers)
    .where(
      and(eq(brokers.id, params.id), eq(brokers.teamId, params.teamId)),
    )
    .limit(1);

  return result;
};

export const getBrokers = async (
  db: Database,
  params: GetBrokersParams,
) => {
  const { teamId, sort, cursor, pageSize = 25, q } = params;

  const whereConditions: SQL[] = [eq(brokers.teamId, teamId)];

  if (q) {
    whereConditions.push(
      sql`${brokers.name} ILIKE '%' || ${q} || '%' OR ${brokers.companyName} ILIKE '%' || ${q} || '%' OR ${brokers.email} ILIKE '%' || ${q} || '%'`,
    );
  }

  const query = db
    .select({
      id: brokers.id,
      createdAt: brokers.createdAt,
      teamId: brokers.teamId,
      name: brokers.name,
      email: brokers.email,
      phone: brokers.phone,
      companyName: brokers.companyName,
      status: brokers.status,
      commissionPercentage: brokers.commissionPercentage,
      portalEnabled: brokers.portalEnabled,
      // Deal aggregates (scalar subqueries)
      dealCount: sql<number>`(select cast(count(*) as int) from mca_deals where mca_deals.broker_id = ${brokers.id})`,
      activeDealCount: sql<number>`(select cast(count(*) as int) from mca_deals where mca_deals.broker_id = ${brokers.id} and mca_deals.status = 'active')`,
      totalFundedAmount: sql<number>`(select coalesce(sum(funding_amount), 0) from mca_deals where mca_deals.broker_id = ${brokers.id})`,
      // Commission aggregates
      totalCommissionsEarned: sql<number>`(select coalesce(sum(commission_amount), 0) from broker_commissions where broker_commissions.broker_id = ${brokers.id})`,
      pendingCommissions: sql<number>`(select coalesce(sum(commission_amount), 0) from broker_commissions where broker_commissions.broker_id = ${brokers.id} and broker_commissions.status = 'pending')`,
    })
    .from(brokers)
    .where(and(...whereConditions));

  // Apply sorting
  if (sort && sort.length === 2) {
    const [column, direction] = sort;
    const isAscending = direction === "asc";

    if (column === "name") {
      isAscending
        ? query.orderBy(asc(brokers.name))
        : query.orderBy(desc(brokers.name));
    } else if (column === "created_at") {
      isAscending
        ? query.orderBy(asc(brokers.createdAt))
        : query.orderBy(desc(brokers.createdAt));
    } else if (column === "email") {
      isAscending
        ? query.orderBy(asc(brokers.email))
        : query.orderBy(desc(brokers.email));
    } else if (column === "company_name") {
      isAscending
        ? query.orderBy(asc(brokers.companyName))
        : query.orderBy(desc(brokers.companyName));
    } else if (column === "deals") {
      isAscending
        ? query.orderBy(asc(sql`(select count(*) from mca_deals where mca_deals.broker_id = ${brokers.id})`))
        : query.orderBy(desc(sql`(select count(*) from mca_deals where mca_deals.broker_id = ${brokers.id})`));
    } else if (column === "total_funded") {
      isAscending
        ? query.orderBy(asc(sql`(select coalesce(sum(funding_amount), 0) from mca_deals where mca_deals.broker_id = ${brokers.id})`))
        : query.orderBy(desc(sql`(select coalesce(sum(funding_amount), 0) from mca_deals where mca_deals.broker_id = ${brokers.id})`));
    } else if (column === "commissions") {
      isAscending
        ? query.orderBy(asc(sql`(select coalesce(sum(commission_amount), 0) from broker_commissions where broker_commissions.broker_id = ${brokers.id})`))
        : query.orderBy(desc(sql`(select coalesce(sum(commission_amount), 0) from broker_commissions where broker_commissions.broker_id = ${brokers.id})`));
    }
  } else {
    query.orderBy(desc(brokers.createdAt));
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

export const upsertBroker = async (
  db: Database,
  params: UpsertBrokerParams,
) => {
  const { id, teamId, ...rest } = params;

  const [broker] = await db
    .insert(brokers)
    .values({
      id,
      teamId,
      ...rest,
    })
    .onConflictDoUpdate({
      target: brokers.id,
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
        commissionPercentage: rest.commissionPercentage,
        status: rest.status,
        note: rest.note,
        externalId: rest.externalId,
      },
    })
    .returning();

  return broker;
};

export const deleteBroker = async (
  db: Database,
  params: DeleteBrokerParams,
) => {
  const [result] = await db
    .delete(brokers)
    .where(and(eq(brokers.id, params.id), eq(brokers.teamId, params.teamId)))
    .returning({ id: brokers.id });

  return result;
};

export async function toggleBrokerPortal(
  db: Database,
  params: ToggleBrokerPortalParams,
) {
  const { brokerId, teamId, enabled } = params;

  const [currentBroker] = await db
    .select({
      id: brokers.id,
      portalId: brokers.portalId,
    })
    .from(brokers)
    .where(and(eq(brokers.id, brokerId), eq(brokers.teamId, teamId)))
    .limit(1);

  if (!currentBroker) {
    throw new Error("Broker not found");
  }

  const portalId =
    enabled && !currentBroker.portalId ? nanoid(8) : currentBroker.portalId;

  const [result] = await db
    .update(brokers)
    .set({
      portalEnabled: enabled,
      portalId,
    })
    .where(and(eq(brokers.id, brokerId), eq(brokers.teamId, teamId)))
    .returning({
      id: brokers.id,
      portalEnabled: brokers.portalEnabled,
      portalId: brokers.portalId,
    });

  return result;
}

export async function getBrokerByPortalId(
  db: Database,
  params: GetBrokerByPortalIdParams,
) {
  const { portalId } = params;

  const [result] = await db
    .select({
      id: brokers.id,
      name: brokers.name,
      email: brokers.email,
      companyName: brokers.companyName,
      teamId: brokers.teamId,
      portalEnabled: brokers.portalEnabled,
      portalId: brokers.portalId,
      team: {
        id: teams.id,
        name: teams.name,
        logoUrl: teams.logoUrl,
        baseCurrency: teams.baseCurrency,
      },
    })
    .from(brokers)
    .innerJoin(teams, eq(teams.id, brokers.teamId))
    .where(
      and(eq(brokers.portalId, portalId), eq(brokers.portalEnabled, true)),
    )
    .limit(1);

  return result;
}

export async function getBrokerDeals(
  db: Database,
  params: GetBrokerDealsParams,
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
      commissionAmount: brokerCommissions.commissionAmount,
      commissionStatus: brokerCommissions.status,
    })
    .from(mcaDeals)
    .leftJoin(
      brokerCommissions,
      and(
        eq(brokerCommissions.dealId, mcaDeals.id),
        eq(brokerCommissions.brokerId, params.brokerId),
      ),
    )
    .where(
      and(
        eq(mcaDeals.brokerId, params.brokerId),
        eq(mcaDeals.teamId, params.teamId),
      ),
    )
    .orderBy(desc(mcaDeals.fundedAt));

  return results;
}

export async function getBrokerDealStats(
  db: Database,
  params: GetBrokerDealStatsParams,
) {
  const [result] = await db
    .select({
      totalDeals: sql<number>`cast(count(*) as int)`,
      activeDeals: sql<number>`cast(count(*) filter (where ${mcaDeals.status} = 'active') as int)`,
      totalFunded: sql<number>`coalesce(sum(${mcaDeals.fundingAmount}), 0)`,
      totalBalance: sql<number>`coalesce(sum(${mcaDeals.currentBalance}), 0)`,
      totalPaid: sql<number>`coalesce(sum(${mcaDeals.totalPaid}), 0)`,
    })
    .from(mcaDeals)
    .where(
      and(
        eq(mcaDeals.brokerId, params.brokerId),
        eq(mcaDeals.teamId, params.teamId),
      ),
    );

  return result;
}
