import type { Database } from "@db/client";
import { riskConfig } from "@db/schema";
import { eq } from "drizzle-orm";

// ============================================================================
// Types
// ============================================================================

export type RiskWeights = {
  consistency: number;
  nsf: number;
  velocity: number;
  recovery: number;
  progress: number;
  amounts: number;
};

export type EventImpacts = {
  on_time_payment: number;
  missed_payment: number;
  nsf_event: number;
  partial_payment: number;
  overpayment: number;
  recovery_payment: number;
};

export type BandThresholds = {
  low_max: number;
  high_min: number;
};

export type GetRiskConfigParams = {
  teamId: string;
};

export type UpsertRiskConfigParams = {
  teamId: string;
  preset: string;
  weights?: RiskWeights;
  decayHalfLifeDays?: number;
  baselineScore?: number;
  eventImpacts?: EventImpacts;
  bandThresholds?: BandThresholds;
};

// ============================================================================
// Defaults & Presets
// ============================================================================

export const DEFAULT_WEIGHTS: RiskWeights = {
  consistency: 0.25,
  nsf: 0.25,
  velocity: 0.15,
  recovery: 0.15,
  progress: 0.1,
  amounts: 0.1,
};

export const DEFAULT_EVENT_IMPACTS: EventImpacts = {
  on_time_payment: -3,
  missed_payment: 8,
  nsf_event: 12,
  partial_payment: 4,
  overpayment: -5,
  recovery_payment: -6,
};

export const DEFAULT_RISK_CONFIG = {
  preset: "balanced",
  weights: DEFAULT_WEIGHTS,
  decayHalfLifeDays: 30,
  baselineScore: 50,
  eventImpacts: DEFAULT_EVENT_IMPACTS,
  bandThresholds: { low_max: 33, high_min: 67 } as BandThresholds,
};

export const PRESET_CONFIGS = {
  conservative: {
    preset: "conservative",
    weights: { ...DEFAULT_WEIGHTS, nsf: 0.3, consistency: 0.3, velocity: 0.1, amounts: 0.05, progress: 0.1, recovery: 0.15 },
    decayHalfLifeDays: 45,
    baselineScore: 55,
    eventImpacts: { ...DEFAULT_EVENT_IMPACTS, nsf_event: 15, missed_payment: 10 },
    bandThresholds: { low_max: 30, high_min: 60 } as BandThresholds,
  },
  balanced: DEFAULT_RISK_CONFIG,
  lenient: {
    preset: "lenient",
    weights: { ...DEFAULT_WEIGHTS, recovery: 0.2, consistency: 0.2, nsf: 0.2, velocity: 0.15, progress: 0.15, amounts: 0.1 },
    decayHalfLifeDays: 20,
    baselineScore: 45,
    eventImpacts: { ...DEFAULT_EVENT_IMPACTS, nsf_event: 8, recovery_payment: -8 },
    bandThresholds: { low_max: 35, high_min: 70 } as BandThresholds,
  },
} as const;

// ============================================================================
// Queries
// ============================================================================

export const getRiskConfig = async (
  db: Database,
  params: GetRiskConfigParams,
) => {
  const [result] = await db
    .select()
    .from(riskConfig)
    .where(eq(riskConfig.teamId, params.teamId))
    .limit(1);

  if (!result) {
    return {
      ...DEFAULT_RISK_CONFIG,
      teamId: params.teamId,
    };
  }

  return {
    ...result,
    weights: (result.weights ?? DEFAULT_WEIGHTS) as RiskWeights,
    eventImpacts: (result.eventImpacts ?? DEFAULT_EVENT_IMPACTS) as EventImpacts,
    bandThresholds: (result.bandThresholds ?? DEFAULT_RISK_CONFIG.bandThresholds) as BandThresholds,
  };
};

export const upsertRiskConfig = async (
  db: Database,
  params: UpsertRiskConfigParams,
) => {
  const { teamId, ...values } = params;

  const [result] = await db
    .insert(riskConfig)
    .values({
      teamId,
      preset: values.preset,
      weights: values.weights ?? DEFAULT_WEIGHTS,
      decayHalfLifeDays: values.decayHalfLifeDays ?? 30,
      baselineScore: values.baselineScore ?? 50,
      eventImpacts: values.eventImpacts,
      bandThresholds: values.bandThresholds ?? DEFAULT_RISK_CONFIG.bandThresholds,
      updatedAt: new Date().toISOString(),
    })
    .onConflictDoUpdate({
      target: riskConfig.teamId,
      set: {
        preset: values.preset,
        weights: values.weights ?? DEFAULT_WEIGHTS,
        decayHalfLifeDays: values.decayHalfLifeDays ?? 30,
        baselineScore: values.baselineScore ?? 50,
        eventImpacts: values.eventImpacts,
        bandThresholds: values.bandThresholds ?? DEFAULT_RISK_CONFIG.bandThresholds,
        updatedAt: new Date().toISOString(),
      },
    })
    .returning();

  return result;
};
