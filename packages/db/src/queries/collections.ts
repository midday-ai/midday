import type { Database } from "@db/client";
import {
  collectionCases,
  collectionStages,
  collectionAgencies,
  collectionNotes,
  mcaDeals,
  merchants,
  users,
} from "@db/schema";
import { and, asc, desc, eq, inArray, isNull, isNotNull, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm/sql/sql";

// ============================================================================
// Collection Case Queries
// ============================================================================

export type GetCollectionCasesParams = {
  teamId: string;
  status?: "active" | "resolved" | null;
  stageId?: string | null;
  assignedTo?: string | null;
  priority?: string | null;
  cursor?: string | null;
  pageSize?: number;
  sort?: string[] | null;
};

export const getCollectionCases = async (
  db: Database,
  params: GetCollectionCasesParams,
) => {
  const {
    teamId,
    status,
    stageId,
    assignedTo,
    priority,
    cursor,
    pageSize = 25,
    sort,
  } = params;

  const whereConditions: SQL[] = [eq(collectionCases.teamId, teamId)];

  if (status === "active") {
    whereConditions.push(isNull(collectionCases.resolvedAt));
  } else if (status === "resolved") {
    whereConditions.push(isNotNull(collectionCases.resolvedAt));
  }

  if (stageId) {
    whereConditions.push(eq(collectionCases.stageId, stageId));
  }

  if (assignedTo) {
    whereConditions.push(eq(collectionCases.assignedTo, assignedTo));
  }

  if (priority) {
    whereConditions.push(
      eq(
        collectionCases.priority,
        priority as (typeof collectionCases.priority.enumValues)[number],
      ),
    );
  }

  // Offset-based pagination (cursor is a stringified offset number)
  const offset = cursor ? Number.parseInt(cursor, 10) : 0;

  // Determine sort order
  let orderBy = desc(collectionCases.createdAt);
  if (sort && sort.length > 0) {
    const [field, direction] = sort[0]!.split(":");
    const isAsc = direction === "asc";

    switch (field) {
      case "priority":
        orderBy = isAsc
          ? asc(collectionCases.priority)
          : desc(collectionCases.priority);
        break;
      case "stageEnteredAt":
        orderBy = isAsc
          ? asc(collectionCases.stageEnteredAt)
          : desc(collectionCases.stageEnteredAt);
        break;
      case "nextFollowUp":
        orderBy = isAsc
          ? asc(collectionCases.nextFollowUp)
          : desc(collectionCases.nextFollowUp);
        break;
      case "currentBalance":
        orderBy = isAsc
          ? asc(mcaDeals.currentBalance)
          : desc(mcaDeals.currentBalance);
        break;
      default:
        orderBy = isAsc
          ? asc(collectionCases.createdAt)
          : desc(collectionCases.createdAt);
    }
  }

  const data = await db
    .select({
      id: collectionCases.id,
      createdAt: collectionCases.createdAt,
      priority: collectionCases.priority,
      outcome: collectionCases.outcome,
      nextFollowUp: collectionCases.nextFollowUp,
      stageEnteredAt: collectionCases.stageEnteredAt,
      enteredCollectionsAt: collectionCases.enteredCollectionsAt,
      resolvedAt: collectionCases.resolvedAt,
      // Stage info
      stageId: collectionStages.id,
      stageName: collectionStages.name,
      stageColor: collectionStages.color,
      stagePosition: collectionStages.position,
      // Deal info
      dealId: mcaDeals.id,
      dealCode: mcaDeals.dealCode,
      currentBalance: mcaDeals.currentBalance,
      fundingAmount: mcaDeals.fundingAmount,
      paybackAmount: mcaDeals.paybackAmount,
      // Merchant info
      merchantId: merchants.id,
      merchantName: merchants.name,
      // Assigned user
      assignedToId: users.id,
      assignedToName: sql<string>`concat(${users.fullName})`.as(
        "assigned_to_name",
      ),
      assignedToAvatar: users.avatarUrl,
      // Computed
      daysInStage: sql<number>`extract(day from now() - ${collectionCases.stageEnteredAt})::int`.as(
        "days_in_stage",
      ),
    })
    .from(collectionCases)
    .leftJoin(
      collectionStages,
      eq(collectionStages.id, collectionCases.stageId),
    )
    .leftJoin(mcaDeals, eq(mcaDeals.id, collectionCases.dealId))
    .leftJoin(merchants, eq(merchants.id, mcaDeals.merchantId))
    .leftJoin(users, eq(users.id, collectionCases.assignedTo))
    .where(and(...whereConditions))
    .orderBy(orderBy)
    .offset(offset)
    .limit(pageSize + 1);

  const hasMore = data.length > pageSize;
  const cases = hasMore ? data.slice(0, pageSize) : data;
  const nextCursor = hasMore ? String(offset + pageSize) : null;

  return {
    data: cases,
    meta: {
      cursor: nextCursor,
      hasMore,
    },
  };
};

type GetCollectionCaseByIdParams = {
  id: string;
  teamId: string;
};

export const getCollectionCaseById = async (
  db: Database,
  params: GetCollectionCaseByIdParams,
) => {
  const [result] = await db
    .select({
      id: collectionCases.id,
      teamId: collectionCases.teamId,
      createdAt: collectionCases.createdAt,
      updatedAt: collectionCases.updatedAt,
      priority: collectionCases.priority,
      outcome: collectionCases.outcome,
      nextFollowUp: collectionCases.nextFollowUp,
      stageEnteredAt: collectionCases.stageEnteredAt,
      enteredCollectionsAt: collectionCases.enteredCollectionsAt,
      resolvedAt: collectionCases.resolvedAt,
      // Stage info
      stageId: collectionStages.id,
      stageName: collectionStages.name,
      stageColor: collectionStages.color,
      stageSlug: collectionStages.slug,
      // Deal info
      dealId: mcaDeals.id,
      dealCode: mcaDeals.dealCode,
      fundingAmount: mcaDeals.fundingAmount,
      factorRate: mcaDeals.factorRate,
      paybackAmount: mcaDeals.paybackAmount,
      dailyPayment: mcaDeals.dailyPayment,
      currentBalance: mcaDeals.currentBalance,
      totalPaid: mcaDeals.totalPaid,
      dealStatus: mcaDeals.status,
      fundedAt: mcaDeals.fundedAt,
      // Merchant info
      merchantId: merchants.id,
      merchantName: merchants.name,
      merchantEmail: merchants.email,
      // Assigned user
      assignedToId: collectionCases.assignedTo,
      assignedToName: sql<string>`concat(${users.fullName})`.as(
        "assigned_to_name",
      ),
      assignedToAvatar: users.avatarUrl,
      // Agency
      agencyId: collectionAgencies.id,
      agencyName: collectionAgencies.name,
      // Computed
      daysInStage: sql<number>`extract(day from now() - ${collectionCases.stageEnteredAt})::int`.as(
        "days_in_stage",
      ),
      daysInCollections: sql<number>`extract(day from now() - ${collectionCases.enteredCollectionsAt})::int`.as(
        "days_in_collections",
      ),
    })
    .from(collectionCases)
    .leftJoin(
      collectionStages,
      eq(collectionStages.id, collectionCases.stageId),
    )
    .leftJoin(mcaDeals, eq(mcaDeals.id, collectionCases.dealId))
    .leftJoin(merchants, eq(merchants.id, mcaDeals.merchantId))
    .leftJoin(users, eq(users.id, collectionCases.assignedTo))
    .leftJoin(
      collectionAgencies,
      eq(collectionAgencies.id, collectionCases.agencyId),
    )
    .where(
      and(
        eq(collectionCases.id, params.id),
        eq(collectionCases.teamId, params.teamId),
      ),
    );

  return result;
};

// ============================================================================
// Collection Case Mutations
// ============================================================================

type CreateCollectionCaseParams = {
  teamId: string;
  dealId: string;
  stageId: string;
  priority?: string;
  assignedTo?: string;
};

export const createCollectionCase = async (
  db: Database,
  params: CreateCollectionCaseParams,
) => {
  const [result] = await db
    .insert(collectionCases)
    .values({
      teamId: params.teamId,
      dealId: params.dealId,
      stageId: params.stageId,
      priority: (params.priority || "medium") as (typeof collectionCases.priority.enumValues)[number],
      assignedTo: params.assignedTo,
    })
    .returning();

  return result;
};

type UpdateCollectionCaseParams = {
  id: string;
  teamId: string;
  stageId?: string;
  assignedTo?: string | null;
  priority?: string;
  outcome?: string | null;
  agencyId?: string | null;
  nextFollowUp?: string | null;
  resolvedAt?: string | null;
};

export const updateCollectionCase = async (
  db: Database,
  params: UpdateCollectionCaseParams,
) => {
  const { id, teamId, ...updateData } = params;

  const updateValues: Partial<typeof collectionCases.$inferInsert> = {
    updatedAt: new Date().toISOString(),
  };

  if (updateData.stageId !== undefined) {
    updateValues.stageId = updateData.stageId;
    updateValues.stageEnteredAt = new Date().toISOString();
  }
  if (updateData.assignedTo !== undefined) {
    updateValues.assignedTo = updateData.assignedTo;
  }
  if (updateData.priority !== undefined) {
    updateValues.priority = updateData.priority as (typeof collectionCases.priority.enumValues)[number];
  }
  if (updateData.outcome !== undefined) {
    updateValues.outcome = updateData.outcome as (typeof collectionCases.outcome.enumValues)[number];
  }
  if (updateData.agencyId !== undefined) {
    updateValues.agencyId = updateData.agencyId;
  }
  if (updateData.nextFollowUp !== undefined) {
    updateValues.nextFollowUp = updateData.nextFollowUp;
  }
  if (updateData.resolvedAt !== undefined) {
    updateValues.resolvedAt = updateData.resolvedAt;
  }

  const [result] = await db
    .update(collectionCases)
    .set(updateValues)
    .where(
      and(eq(collectionCases.id, id), eq(collectionCases.teamId, teamId)),
    )
    .returning();

  return result;
};

// ============================================================================
// Collection Statistics
// ============================================================================

type GetCollectionStatsParams = {
  teamId: string;
};

export const getCollectionStats = async (
  db: Database,
  params: GetCollectionStatsParams,
) => {
  const [result] = await db
    .select({
      activeCases: sql<number>`cast(count(*) filter (where ${collectionCases.resolvedAt} is null) as int)`,
      resolvedCases: sql<number>`cast(count(*) filter (where ${collectionCases.resolvedAt} is not null) as int)`,
      totalOutstanding: sql<number>`coalesce(sum(${mcaDeals.currentBalance}) filter (where ${collectionCases.resolvedAt} is null), 0)`,
      upcomingFollowUps: sql<number>`cast(count(*) filter (where ${collectionCases.nextFollowUp} <= now() + interval '7 days' and ${collectionCases.resolvedAt} is null) as int)`,
      unassigned: sql<number>`cast(count(*) filter (where ${collectionCases.assignedTo} is null and ${collectionCases.resolvedAt} is null) as int)`,
      recoveryRate: sql<number>`
        case
          when count(*) filter (where ${collectionCases.resolvedAt} is not null) > 0
          then round(
            cast(count(*) filter (where ${collectionCases.outcome} in ('paid_in_full', 'settled', 'payment_plan')) as numeric)
            / cast(count(*) filter (where ${collectionCases.resolvedAt} is not null) as numeric) * 100, 1
          )
          else 0
        end
      `,
    })
    .from(collectionCases)
    .leftJoin(mcaDeals, eq(mcaDeals.id, collectionCases.dealId))
    .where(eq(collectionCases.teamId, params.teamId));

  return result;
};

// ============================================================================
// Candidate Deals (deals eligible for collections)
// ============================================================================

type GetCandidateDealsParams = {
  teamId: string;
  cursor?: string | null;
  pageSize?: number;
};

export const getCandidateDeals = async (
  db: Database,
  params: GetCandidateDealsParams,
) => {
  const { teamId, cursor, pageSize = 25 } = params;

  const offset = cursor ? Number.parseInt(cursor, 10) : 0;

  const whereConditions: SQL[] = [
    eq(mcaDeals.teamId, teamId),
    inArray(mcaDeals.status, ["late", "defaulted", "in_collections"]),
    // Exclude deals that already have a collection case
    sql`${mcaDeals.id} not in (select ${collectionCases.dealId} from ${collectionCases})`,
  ];

  const data = await db
    .select({
      dealId: mcaDeals.id,
      dealCode: mcaDeals.dealCode,
      fundingAmount: mcaDeals.fundingAmount,
      paybackAmount: mcaDeals.paybackAmount,
      currentBalance: mcaDeals.currentBalance,
      totalPaid: mcaDeals.totalPaid,
      nsfCount: mcaDeals.nsfCount,
      status: mcaDeals.status,
      fundedAt: mcaDeals.fundedAt,
      createdAt: mcaDeals.createdAt,
      merchantId: merchants.id,
      merchantName: merchants.name,
      merchantEmail: merchants.email,
    })
    .from(mcaDeals)
    .leftJoin(merchants, eq(merchants.id, mcaDeals.merchantId))
    .where(and(...whereConditions))
    .orderBy(desc(mcaDeals.currentBalance))
    .offset(offset)
    .limit(pageSize + 1);

  const hasMore = data.length > pageSize;
  const deals = hasMore ? data.slice(0, pageSize) : data;
  const nextCursor = hasMore ? String(offset + pageSize) : null;

  return {
    data: deals,
    meta: {
      cursor: nextCursor,
      hasMore,
    },
  };
};

// ============================================================================
// Merchant-Level Collections Query
// ============================================================================

type GetCollectionsByMerchantIdParams = {
  merchantId: string;
  teamId: string;
};

export const getCollectionsByMerchantId = async (
  db: Database,
  params: GetCollectionsByMerchantIdParams,
) => {
  const data = await db
    .select({
      id: collectionCases.id,
      createdAt: collectionCases.createdAt,
      priority: collectionCases.priority,
      outcome: collectionCases.outcome,
      resolvedAt: collectionCases.resolvedAt,
      enteredCollectionsAt: collectionCases.enteredCollectionsAt,
      dealCode: mcaDeals.dealCode,
      dealId: mcaDeals.id,
      currentBalance: mcaDeals.currentBalance,
      stageName: collectionStages.name,
      stageColor: collectionStages.color,
      agencyName: collectionAgencies.name,
    })
    .from(collectionCases)
    .innerJoin(mcaDeals, eq(mcaDeals.id, collectionCases.dealId))
    .leftJoin(
      collectionStages,
      eq(collectionStages.id, collectionCases.stageId),
    )
    .leftJoin(
      collectionAgencies,
      eq(collectionAgencies.id, collectionCases.agencyId),
    )
    .where(
      and(
        eq(mcaDeals.merchantId, params.merchantId),
        eq(collectionCases.teamId, params.teamId),
      ),
    )
    .orderBy(desc(collectionCases.createdAt));

  return data;
};
