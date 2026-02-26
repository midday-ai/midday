import type { Database } from "@db/client";
import { riskScores } from "@db/schema";
import { and, eq, inArray, sql } from "drizzle-orm";

// ============================================================================
// Types
// ============================================================================

export type SubScores = {
  consistency: number;
  nsf: number;
  velocity: number;
  recovery: number;
  progress: number;
  amounts: number;
};

export type GetRiskScoreParams = {
  dealId: string;
  teamId: string;
};

export type GetRiskScoresByTeamParams = {
  teamId: string;
  dealIds?: string[];
};

export type UpsertRiskScoreParams = {
  teamId: string;
  dealId: string;
  overallScore: number;
  previousScore?: number | null;
  band: string;
  subScores: SubScores;
  triggeringPaymentId?: string | null;
};

// ============================================================================
// Queries
// ============================================================================

export const getRiskScore = async (
  db: Database,
  params: GetRiskScoreParams,
) => {
  const [result] = await db
    .select()
    .from(riskScores)
    .where(
      and(
        eq(riskScores.dealId, params.dealId),
        eq(riskScores.teamId, params.teamId),
      ),
    )
    .limit(1);

  return result ?? null;
};

export const getRiskScoresByTeam = async (
  db: Database,
  params: GetRiskScoresByTeamParams,
) => {
  const conditions = [eq(riskScores.teamId, params.teamId)];

  if (params.dealIds && params.dealIds.length > 0) {
    conditions.push(inArray(riskScores.dealId, params.dealIds));
  }

  return db
    .select()
    .from(riskScores)
    .where(and(...conditions));
};

export const upsertRiskScore = async (
  db: Database,
  params: UpsertRiskScoreParams,
) => {
  const [result] = await db
    .insert(riskScores)
    .values({
      teamId: params.teamId,
      dealId: params.dealId,
      overallScore: params.overallScore,
      previousScore: params.previousScore,
      band: params.band,
      subScores: params.subScores,
      triggeringPaymentId: params.triggeringPaymentId,
      calculatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .onConflictDoUpdate({
      target: riskScores.dealId,
      set: {
        overallScore: params.overallScore,
        previousScore: params.previousScore,
        band: params.band,
        subScores: params.subScores,
        triggeringPaymentId: params.triggeringPaymentId,
        calculatedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    })
    .returning();

  return result;
};

export const getRiskDistribution = async (
  db: Database,
  params: { teamId: string },
) => {
  const [result] = await db
    .select({
      low: sql<number>`cast(count(*) filter (where ${riskScores.band} = 'low') as int)`,
      medium: sql<number>`cast(count(*) filter (where ${riskScores.band} = 'medium') as int)`,
      high: sql<number>`cast(count(*) filter (where ${riskScores.band} = 'high') as int)`,
      total: sql<number>`cast(count(*) as int)`,
    })
    .from(riskScores)
    .where(eq(riskScores.teamId, params.teamId));

  return result ?? { low: 0, medium: 0, high: 0, total: 0 };
};
