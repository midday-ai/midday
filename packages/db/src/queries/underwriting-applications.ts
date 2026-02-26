import type { Database } from "@db/client";
import { underwritingApplications, merchants } from "@db/schema";
import { and, desc, eq, sql } from "drizzle-orm";

// ============================================================================
// Underwriting Application Queries
// ============================================================================

type GetUnderwritingApplicationByIdParams = {
  id: string;
  teamId: string;
};

export const getUnderwritingApplicationById = async (
  db: Database,
  params: GetUnderwritingApplicationByIdParams,
) => {
  const [result] = await db
    .select({
      id: underwritingApplications.id,
      merchantId: underwritingApplications.merchantId,
      teamId: underwritingApplications.teamId,
      status: underwritingApplications.status,
      requestedAmountMin: underwritingApplications.requestedAmountMin,
      requestedAmountMax: underwritingApplications.requestedAmountMax,
      useOfFunds: underwritingApplications.useOfFunds,
      ficoRange: underwritingApplications.ficoRange,
      timeInBusinessMonths: underwritingApplications.timeInBusinessMonths,
      brokerNotes: underwritingApplications.brokerNotes,
      priorMcaHistory: underwritingApplications.priorMcaHistory,
      decision: underwritingApplications.decision,
      decisionDate: underwritingApplications.decisionDate,
      decidedBy: underwritingApplications.decidedBy,
      decisionNotes: underwritingApplications.decisionNotes,
      createdAt: underwritingApplications.createdAt,
      updatedAt: underwritingApplications.updatedAt,
      // Merchant info
      merchantName: merchants.name,
      merchantEmail: merchants.email,
      merchantState: merchants.state,
      merchantIndustry: merchants.industry,
    })
    .from(underwritingApplications)
    .where(
      and(
        eq(underwritingApplications.id, params.id),
        eq(underwritingApplications.teamId, params.teamId),
      ),
    )
    .leftJoin(merchants, eq(merchants.id, underwritingApplications.merchantId));

  return result ?? null;
};

type GetUnderwritingByMerchantParams = {
  merchantId: string;
  teamId: string;
};

export const getUnderwritingByMerchant = async (
  db: Database,
  params: GetUnderwritingByMerchantParams,
) => {
  const [result] = await db
    .select()
    .from(underwritingApplications)
    .where(
      and(
        eq(underwritingApplications.merchantId, params.merchantId),
        eq(underwritingApplications.teamId, params.teamId),
      ),
    )
    .orderBy(desc(underwritingApplications.createdAt))
    .limit(1);

  return result ?? null;
};

// ============================================================================
// Underwriting Application Mutations
// ============================================================================

type CreateUnderwritingApplicationParams = {
  merchantId: string;
  teamId: string;
  requestedAmountMin?: number | null;
  requestedAmountMax?: number | null;
  useOfFunds?: string | null;
  ficoRange?: string | null;
  timeInBusinessMonths?: number | null;
  brokerNotes?: string | null;
  priorMcaHistory?: string | null;
};

export const createUnderwritingApplication = async (
  db: Database,
  params: CreateUnderwritingApplicationParams,
) => {
  const { merchantId, teamId, ...rest } = params;

  const [result] = await db
    .insert(underwritingApplications)
    .values({
      merchantId,
      teamId,
      ...rest,
    })
    .returning();

  return result;
};

type UpdateUnderwritingApplicationParams = {
  id: string;
  teamId: string;
  status?: string;
  requestedAmountMin?: number | null;
  requestedAmountMax?: number | null;
  useOfFunds?: string | null;
  ficoRange?: string | null;
  timeInBusinessMonths?: number | null;
  brokerNotes?: string | null;
  priorMcaHistory?: string | null;
  decision?: string | null;
  decisionDate?: string | null;
  decidedBy?: string | null;
  decisionNotes?: string | null;
};

export const updateUnderwritingApplication = async (
  db: Database,
  params: UpdateUnderwritingApplicationParams,
) => {
  const { id, teamId, ...updateData } = params;

  const updateValues: Partial<typeof underwritingApplications.$inferInsert> =
    {};

  if (updateData.status !== undefined) {
    updateValues.status =
      updateData.status as (typeof underwritingApplications.status.enumValues)[number];
  }
  if (updateData.requestedAmountMin !== undefined) {
    updateValues.requestedAmountMin = updateData.requestedAmountMin;
  }
  if (updateData.requestedAmountMax !== undefined) {
    updateValues.requestedAmountMax = updateData.requestedAmountMax;
  }
  if (updateData.useOfFunds !== undefined) {
    updateValues.useOfFunds = updateData.useOfFunds;
  }
  if (updateData.ficoRange !== undefined) {
    updateValues.ficoRange = updateData.ficoRange;
  }
  if (updateData.timeInBusinessMonths !== undefined) {
    updateValues.timeInBusinessMonths = updateData.timeInBusinessMonths;
  }
  if (updateData.brokerNotes !== undefined) {
    updateValues.brokerNotes = updateData.brokerNotes;
  }
  if (updateData.priorMcaHistory !== undefined) {
    updateValues.priorMcaHistory = updateData.priorMcaHistory;
  }
  if (updateData.decision !== undefined) {
    updateValues.decision =
      updateData.decision as (typeof underwritingApplications.decision.enumValues)[number] | null;
  }
  if (updateData.decisionDate !== undefined) {
    updateValues.decisionDate = updateData.decisionDate;
  }
  if (updateData.decidedBy !== undefined) {
    updateValues.decidedBy = updateData.decidedBy;
  }
  if (updateData.decisionNotes !== undefined) {
    updateValues.decisionNotes = updateData.decisionNotes;
  }

  updateValues.updatedAt = new Date().toISOString();

  const [result] = await db
    .update(underwritingApplications)
    .set(updateValues)
    .where(
      and(
        eq(underwritingApplications.id, id),
        eq(underwritingApplications.teamId, teamId),
      ),
    )
    .returning();

  return result;
};
