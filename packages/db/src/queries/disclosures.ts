import type { Database } from "@db/client";
import { disclosures, mcaDeals, merchants } from "@db/schema";
import { and, desc, eq, sql } from "drizzle-orm";

// ============================================================================
// Types
// ============================================================================

type CreateDisclosureParams = {
  dealId: string;
  teamId: string;
  stateCode: string;
  disclosureType?: string;
  templateVersion: string;
  generatedBy?: string;
  dealSnapshot: Record<string, unknown>;
};

type GetDisclosureByIdParams = {
  id: string;
  teamId: string;
};

type GetDisclosuresByDealParams = {
  dealId: string;
  teamId: string;
};

type GetDisclosuresParams = {
  teamId: string;
  cursor?: string | null;
  pageSize?: number;
  status?: string;
  stateCode?: string;
};

type UpdateDisclosureParams = {
  id: string;
  teamId: string;
  status?: string;
  figures?: Record<string, unknown>;
  documentHash?: string;
  filePath?: string[];
  fileSize?: number;
  generatedAt?: string;
};

type AcknowledgeDisclosureParams = {
  id: string;
  teamId: string;
  acknowledgedBy: string;
  signatureData?: unknown;
};

// ============================================================================
// Queries
// ============================================================================

export const createDisclosure = async (
  db: Database,
  params: CreateDisclosureParams,
) => {
  const [result] = await db
    .insert(disclosures)
    .values({
      dealId: params.dealId,
      teamId: params.teamId,
      stateCode: params.stateCode,
      disclosureType: params.disclosureType ?? "mca",
      templateVersion: params.templateVersion,
      status: "pending",
      generatedBy: params.generatedBy,
      dealSnapshot: params.dealSnapshot,
    })
    .returning();

  return result;
};

export const getDisclosureById = async (
  db: Database,
  params: GetDisclosureByIdParams,
) => {
  const [result] = await db
    .select({
      id: disclosures.id,
      createdAt: disclosures.createdAt,
      updatedAt: disclosures.updatedAt,
      dealId: disclosures.dealId,
      teamId: disclosures.teamId,
      stateCode: disclosures.stateCode,
      disclosureType: disclosures.disclosureType,
      templateVersion: disclosures.templateVersion,
      status: disclosures.status,
      figures: disclosures.figures,
      documentHash: disclosures.documentHash,
      filePath: disclosures.filePath,
      fileSize: disclosures.fileSize,
      generatedBy: disclosures.generatedBy,
      generatedAt: disclosures.generatedAt,
      dealSnapshot: disclosures.dealSnapshot,
      acknowledgedAt: disclosures.acknowledgedAt,
      acknowledgedBy: disclosures.acknowledgedBy,
      // Join deal info
      deal: {
        dealCode: mcaDeals.dealCode,
        fundingAmount: mcaDeals.fundingAmount,
        factorRate: mcaDeals.factorRate,
        paybackAmount: mcaDeals.paybackAmount,
        status: mcaDeals.status,
      },
      // Join merchant info
      merchant: {
        name: merchants.name,
        state: merchants.state,
      },
    })
    .from(disclosures)
    .innerJoin(mcaDeals, eq(mcaDeals.id, disclosures.dealId))
    .innerJoin(merchants, eq(merchants.id, mcaDeals.merchantId))
    .where(
      and(
        eq(disclosures.id, params.id),
        eq(disclosures.teamId, params.teamId),
      ),
    )
    .limit(1);

  return result;
};

export const getDisclosuresByDeal = async (
  db: Database,
  params: GetDisclosuresByDealParams,
) => {
  return db
    .select({
      id: disclosures.id,
      createdAt: disclosures.createdAt,
      stateCode: disclosures.stateCode,
      disclosureType: disclosures.disclosureType,
      templateVersion: disclosures.templateVersion,
      status: disclosures.status,
      figures: disclosures.figures,
      documentHash: disclosures.documentHash,
      filePath: disclosures.filePath,
      generatedAt: disclosures.generatedAt,
      acknowledgedAt: disclosures.acknowledgedAt,
      acknowledgedBy: disclosures.acknowledgedBy,
    })
    .from(disclosures)
    .where(
      and(
        eq(disclosures.dealId, params.dealId),
        eq(disclosures.teamId, params.teamId),
      ),
    )
    .orderBy(desc(disclosures.createdAt));
};

export const getDisclosures = async (
  db: Database,
  params: GetDisclosuresParams,
) => {
  const { teamId, cursor, pageSize = 25, status, stateCode } = params;

  const whereConditions = [eq(disclosures.teamId, teamId)];

  if (status) {
    whereConditions.push(eq(disclosures.status, status));
  }
  if (stateCode) {
    whereConditions.push(eq(disclosures.stateCode, stateCode));
  }

  const offset = cursor ? Number.parseInt(cursor, 10) : 0;

  const data = await db
    .select({
      id: disclosures.id,
      createdAt: disclosures.createdAt,
      dealId: disclosures.dealId,
      stateCode: disclosures.stateCode,
      disclosureType: disclosures.disclosureType,
      templateVersion: disclosures.templateVersion,
      status: disclosures.status,
      generatedAt: disclosures.generatedAt,
      acknowledgedAt: disclosures.acknowledgedAt,
      dealCode: mcaDeals.dealCode,
      merchantName: merchants.name,
    })
    .from(disclosures)
    .innerJoin(mcaDeals, eq(mcaDeals.id, disclosures.dealId))
    .innerJoin(merchants, eq(merchants.id, mcaDeals.merchantId))
    .where(and(...whereConditions))
    .orderBy(desc(disclosures.createdAt))
    .limit(pageSize)
    .offset(offset);

  const nextCursor =
    data.length === pageSize ? (offset + pageSize).toString() : undefined;

  return {
    meta: {
      cursor: nextCursor ?? null,
      hasPreviousPage: offset > 0,
      hasNextPage: data.length === pageSize,
    },
    data,
  };
};

export const updateDisclosure = async (
  db: Database,
  params: UpdateDisclosureParams,
) => {
  const { id, teamId, ...updates } = params;

  const [result] = await db
    .update(disclosures)
    .set(updates)
    .where(
      and(eq(disclosures.id, id), eq(disclosures.teamId, teamId)),
    )
    .returning();

  return result;
};

export const acknowledgeDisclosure = async (
  db: Database,
  params: AcknowledgeDisclosureParams,
) => {
  const [result] = await db
    .update(disclosures)
    .set({
      acknowledgedAt: new Date().toISOString(),
      acknowledgedBy: params.acknowledgedBy,
      signatureData: params.signatureData ?? null,
    })
    .where(
      and(
        eq(disclosures.id, params.id),
        eq(disclosures.teamId, params.teamId),
      ),
    )
    .returning({
      id: disclosures.id,
      acknowledgedAt: disclosures.acknowledgedAt,
      acknowledgedBy: disclosures.acknowledgedBy,
    });

  return result;
};

/**
 * Mark existing completed disclosures for a deal as 'superseded'
 * when a new disclosure is generated.
 */
export const supersedeDealDisclosures = async (
  db: Database,
  params: { dealId: string; teamId: string; excludeId?: string },
) => {
  const whereConditions = [
    eq(disclosures.dealId, params.dealId),
    eq(disclosures.teamId, params.teamId),
    eq(disclosures.status, "completed"),
  ];

  if (params.excludeId) {
    whereConditions.push(
      sql`${disclosures.id} != ${params.excludeId}`,
    );
  }

  return db
    .update(disclosures)
    .set({ status: "superseded" })
    .where(and(...whereConditions));
};
