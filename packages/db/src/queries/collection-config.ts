import type { Database } from "@db/client";
import {
  collectionAgencies,
  collectionCases,
  collectionEscalationRules,
  collectionSlaConfigs,
  collectionStages,
} from "@db/schema";
import { and, asc, eq, sql } from "drizzle-orm";

// ============================================================================
// Collection Stages
// ============================================================================

export const getCollectionStages = async (
  db: Database,
  params: { teamId: string },
) => {
  return db
    .select()
    .from(collectionStages)
    .where(eq(collectionStages.teamId, params.teamId))
    .orderBy(asc(collectionStages.position));
};

type UpsertCollectionStageParams = {
  id?: string;
  teamId: string;
  name: string;
  slug: string;
  position: number;
  color?: string;
  isDefault?: boolean;
  isTerminal?: boolean;
};

export const upsertCollectionStage = async (
  db: Database,
  params: UpsertCollectionStageParams,
) => {
  if (params.id) {
    const [result] = await db
      .update(collectionStages)
      .set({
        name: params.name,
        slug: params.slug,
        position: params.position,
        color: params.color,
        isDefault: params.isDefault,
        isTerminal: params.isTerminal,
      })
      .where(
        and(
          eq(collectionStages.id, params.id),
          eq(collectionStages.teamId, params.teamId),
        ),
      )
      .returning();
    return result;
  }

  const [result] = await db
    .insert(collectionStages)
    .values({
      teamId: params.teamId,
      name: params.name,
      slug: params.slug,
      position: params.position,
      color: params.color,
      isDefault: params.isDefault,
      isTerminal: params.isTerminal,
    })
    .returning();
  return result;
};

export const swapStagePositions = async (
  db: Database,
  params: {
    teamId: string;
    stageAId: string;
    stageBId: string;
  },
) => {
  return db.transaction(async (tx) => {
    const [stageA] = await tx
      .select({ id: collectionStages.id, position: collectionStages.position })
      .from(collectionStages)
      .where(
        and(
          eq(collectionStages.id, params.stageAId),
          eq(collectionStages.teamId, params.teamId),
        ),
      );

    const [stageB] = await tx
      .select({ id: collectionStages.id, position: collectionStages.position })
      .from(collectionStages)
      .where(
        and(
          eq(collectionStages.id, params.stageBId),
          eq(collectionStages.teamId, params.teamId),
        ),
      );

    if (!stageA || !stageB) {
      throw new Error("One or both stages not found");
    }

    await tx
      .update(collectionStages)
      .set({ position: stageB.position })
      .where(eq(collectionStages.id, stageA.id));

    await tx
      .update(collectionStages)
      .set({ position: stageA.position })
      .where(eq(collectionStages.id, stageB.id));
  });
};

export const getStageUsageCount = async (
  db: Database,
  params: { id: string; teamId: string },
) => {
  const [result] = await db
    .select({
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(collectionCases)
    .where(
      and(
        eq(collectionCases.stageId, params.id),
        eq(collectionCases.teamId, params.teamId),
      ),
    );
  return result?.count ?? 0;
};

export const deleteCollectionStage = async (
  db: Database,
  params: { id: string; teamId: string; force?: boolean },
) => {
  // Check if any cases reference this stage
  const usageCount = await getStageUsageCount(db, params);
  if (usageCount > 0 && !params.force) {
    throw new Error(
      `Cannot delete stage: ${usageCount} case${usageCount !== 1 ? "s" : ""} still reference it. Reassign cases first or use force delete.`,
    );
  }

  const [result] = await db
    .delete(collectionStages)
    .where(
      and(
        eq(collectionStages.id, params.id),
        eq(collectionStages.teamId, params.teamId),
      ),
    )
    .returning();
  return result;
};

const DEFAULT_STAGES = [
  { name: "Early Contact", slug: "early-contact", position: 1, color: "#3B82F6", isDefault: true, isTerminal: false },
  { name: "Promise to Pay", slug: "promise-to-pay", position: 2, color: "#8B5CF6", isDefault: false, isTerminal: false },
  { name: "Payment Plan", slug: "payment-plan", position: 3, color: "#6366F1", isDefault: false, isTerminal: false },
  { name: "Escalated", slug: "escalated", position: 4, color: "#F59E0B", isDefault: false, isTerminal: false },
  { name: "Legal Review", slug: "legal-review", position: 5, color: "#EF4444", isDefault: false, isTerminal: false },
  { name: "Agency Referral", slug: "agency-referral", position: 6, color: "#DC2626", isDefault: false, isTerminal: false },
  { name: "Resolved", slug: "resolved", position: 7, color: "#16A34A", isDefault: false, isTerminal: true },
];

export const seedDefaultStages = async (
  db: Database,
  params: { teamId: string },
) => {
  const existing = await db
    .select({ id: collectionStages.id })
    .from(collectionStages)
    .where(eq(collectionStages.teamId, params.teamId))
    .limit(1);

  if (existing.length > 0) return;

  await db.insert(collectionStages).values(
    DEFAULT_STAGES.map((stage) => ({
      ...stage,
      teamId: params.teamId,
    })),
  );
};

// ============================================================================
// Collection Agencies
// ============================================================================

export const getCollectionAgencies = async (
  db: Database,
  params: { teamId: string },
) => {
  return db
    .select()
    .from(collectionAgencies)
    .where(
      and(
        eq(collectionAgencies.teamId, params.teamId),
        eq(collectionAgencies.isActive, true),
      ),
    )
    .orderBy(asc(collectionAgencies.name));
};

type UpsertCollectionAgencyParams = {
  id?: string;
  teamId: string;
  name: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
  isActive?: boolean;
};

export const upsertCollectionAgency = async (
  db: Database,
  params: UpsertCollectionAgencyParams,
) => {
  if (params.id) {
    const [result] = await db
      .update(collectionAgencies)
      .set({
        name: params.name,
        contactName: params.contactName,
        contactEmail: params.contactEmail,
        contactPhone: params.contactPhone,
        notes: params.notes,
        isActive: params.isActive,
      })
      .where(
        and(
          eq(collectionAgencies.id, params.id),
          eq(collectionAgencies.teamId, params.teamId),
        ),
      )
      .returning();
    return result;
  }

  const [result] = await db
    .insert(collectionAgencies)
    .values({
      teamId: params.teamId,
      name: params.name,
      contactName: params.contactName,
      contactEmail: params.contactEmail,
      contactPhone: params.contactPhone,
      notes: params.notes,
      isActive: params.isActive ?? true,
    })
    .returning();
  return result;
};

export const deleteCollectionAgency = async (
  db: Database,
  params: { id: string; teamId: string },
) => {
  const [result] = await db
    .delete(collectionAgencies)
    .where(
      and(
        eq(collectionAgencies.id, params.id),
        eq(collectionAgencies.teamId, params.teamId),
      ),
    )
    .returning();
  return result;
};

// ============================================================================
// Escalation Rules
// ============================================================================

export const getEscalationRules = async (
  db: Database,
  params: { teamId: string },
) => {
  return db
    .select({
      id: collectionEscalationRules.id,
      teamId: collectionEscalationRules.teamId,
      triggerType: collectionEscalationRules.triggerType,
      fromStageId: collectionEscalationRules.fromStageId,
      toStageId: collectionEscalationRules.toStageId,
      condition: collectionEscalationRules.condition,
      isActive: collectionEscalationRules.isActive,
      createdAt: collectionEscalationRules.createdAt,
    })
    .from(collectionEscalationRules)
    .where(eq(collectionEscalationRules.teamId, params.teamId))
    .orderBy(asc(collectionEscalationRules.createdAt));
};

type UpsertEscalationRuleParams = {
  id?: string;
  teamId: string;
  triggerType: string;
  fromStageId: string;
  toStageId: string;
  condition: Record<string, unknown>;
  isActive?: boolean;
};

export const upsertEscalationRule = async (
  db: Database,
  params: UpsertEscalationRuleParams,
) => {
  const values = {
    triggerType: params.triggerType as (typeof collectionEscalationRules.triggerType.enumValues)[number],
    fromStageId: params.fromStageId,
    toStageId: params.toStageId,
    condition: params.condition,
    isActive: params.isActive ?? true,
  };

  if (params.id) {
    const [result] = await db
      .update(collectionEscalationRules)
      .set(values)
      .where(
        and(
          eq(collectionEscalationRules.id, params.id),
          eq(collectionEscalationRules.teamId, params.teamId),
        ),
      )
      .returning();
    return result;
  }

  const [result] = await db
    .insert(collectionEscalationRules)
    .values({
      ...values,
      teamId: params.teamId,
    })
    .returning();
  return result;
};

export const deleteEscalationRule = async (
  db: Database,
  params: { id: string; teamId: string },
) => {
  const [result] = await db
    .delete(collectionEscalationRules)
    .where(
      and(
        eq(collectionEscalationRules.id, params.id),
        eq(collectionEscalationRules.teamId, params.teamId),
      ),
    )
    .returning();
  return result;
};

// ============================================================================
// SLA Configs
// ============================================================================

export const getSlaConfigs = async (
  db: Database,
  params: { teamId: string },
) => {
  return db
    .select({
      id: collectionSlaConfigs.id,
      teamId: collectionSlaConfigs.teamId,
      stageId: collectionSlaConfigs.stageId,
      metric: collectionSlaConfigs.metric,
      thresholdMinutes: collectionSlaConfigs.thresholdMinutes,
      createdAt: collectionSlaConfigs.createdAt,
      stageName: collectionStages.name,
    })
    .from(collectionSlaConfigs)
    .leftJoin(
      collectionStages,
      eq(collectionStages.id, collectionSlaConfigs.stageId),
    )
    .where(eq(collectionSlaConfigs.teamId, params.teamId))
    .orderBy(asc(collectionSlaConfigs.createdAt));
};

type UpsertSlaConfigParams = {
  id?: string;
  teamId: string;
  stageId?: string;
  metric: string;
  thresholdMinutes: number;
};

export const upsertSlaConfig = async (
  db: Database,
  params: UpsertSlaConfigParams,
) => {
  const values = {
    stageId: params.stageId,
    metric: params.metric as (typeof collectionSlaConfigs.metric.enumValues)[number],
    thresholdMinutes: params.thresholdMinutes,
  };

  if (params.id) {
    const [result] = await db
      .update(collectionSlaConfigs)
      .set(values)
      .where(
        and(
          eq(collectionSlaConfigs.id, params.id),
          eq(collectionSlaConfigs.teamId, params.teamId),
        ),
      )
      .returning();
    return result;
  }

  const [result] = await db
    .insert(collectionSlaConfigs)
    .values({
      ...values,
      teamId: params.teamId,
    })
    .returning();
  return result;
};

export const deleteSlaConfig = async (
  db: Database,
  params: { id: string; teamId: string },
) => {
  const [result] = await db
    .delete(collectionSlaConfigs)
    .where(
      and(
        eq(collectionSlaConfigs.id, params.id),
        eq(collectionSlaConfigs.teamId, params.teamId),
      ),
    )
    .returning();
  return result;
};
