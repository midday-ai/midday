import type { Database } from "@db/client";
import { underwritingScores } from "@db/schema";
import { and, desc, eq } from "drizzle-orm";

// ============================================================================
// Underwriting Score Queries
// ============================================================================

type GetUnderwritingScoreParams = {
  applicationId: string;
  teamId: string;
};

export const getUnderwritingScore = async (
  db: Database,
  params: GetUnderwritingScoreParams,
) => {
  const [result] = await db
    .select()
    .from(underwritingScores)
    .where(
      and(
        eq(underwritingScores.applicationId, params.applicationId),
        eq(underwritingScores.teamId, params.teamId),
      ),
    )
    .orderBy(desc(underwritingScores.scoredAt))
    .limit(1);

  return result ?? null;
};

// ============================================================================
// Underwriting Score Mutations
// ============================================================================

type CreateUnderwritingScoreParams = {
  applicationId: string;
  teamId: string;
  recommendation?: string | null;
  confidence?: string | null;
  buyBoxResults?: unknown;
  bankAnalysis?: unknown;
  extractedMetrics?: unknown;
  riskFlags?: unknown;
  priorMcaFlags?: unknown;
  aiNarrative?: string | null;
};

export const createUnderwritingScore = async (
  db: Database,
  params: CreateUnderwritingScoreParams,
) => {
  const [result] = await db
    .insert(underwritingScores)
    .values({
      applicationId: params.applicationId,
      teamId: params.teamId,
      recommendation:
        params.recommendation as (typeof underwritingScores.recommendation.enumValues)[number] | null,
      confidence:
        params.confidence as (typeof underwritingScores.confidence.enumValues)[number] | null,
      buyBoxResults: params.buyBoxResults,
      bankAnalysis: params.bankAnalysis,
      extractedMetrics: params.extractedMetrics,
      riskFlags: params.riskFlags,
      priorMcaFlags: params.priorMcaFlags,
      aiNarrative: params.aiNarrative,
    })
    .returning();

  return result;
};
