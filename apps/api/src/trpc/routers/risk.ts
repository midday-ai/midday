import {
  createTRPCRouter,
  memberProcedure,
  protectedProcedure,
} from "@api/trpc/init";
import {
  getRiskConfig,
  upsertRiskConfig,
  PRESET_CONFIGS,
} from "@db/queries/risk-config";
import {
  getRiskScore,
  getRiskScoresByTeam,
  getRiskDistribution,
} from "@db/queries/risk-scores";
import { getRiskEvents } from "@db/queries/risk-events";
import {
  calculateRiskScore,
  recalculateAllDealRisks,
} from "@api/services/risk-engine";
import { z } from "zod";

const weightsSchema = z.object({
  consistency: z.number().min(0).max(1),
  nsf: z.number().min(0).max(1),
  velocity: z.number().min(0).max(1),
  recovery: z.number().min(0).max(1),
  progress: z.number().min(0).max(1),
  amounts: z.number().min(0).max(1),
});

const bandThresholdsSchema = z.object({
  low_max: z.number().min(0).max(100),
  high_min: z.number().min(0).max(100),
});

export const riskRouter = createTRPCRouter({
  getConfig: protectedProcedure.query(async ({ ctx: { db, teamId } }) => {
    return getRiskConfig(db, { teamId: teamId! });
  }),

  saveConfig: memberProcedure
    .input(
      z.object({
        preset: z.string(),
        weights: weightsSchema.optional(),
        decayHalfLifeDays: z.number().int().min(5).max(120).optional(),
        baselineScore: z.number().int().min(0).max(100).optional(),
        bandThresholds: bandThresholdsSchema.optional(),
      }),
    )
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      // If selecting a named preset, use its full config
      if (input.preset !== "custom" && input.preset in PRESET_CONFIGS) {
        const presetConfig =
          PRESET_CONFIGS[input.preset as keyof typeof PRESET_CONFIGS];
        await upsertRiskConfig(db, {
          teamId: teamId!,
          preset: input.preset,
          weights: presetConfig.weights,
          decayHalfLifeDays: presetConfig.decayHalfLifeDays,
          baselineScore: presetConfig.baselineScore,
          bandThresholds: presetConfig.bandThresholds,
        });
      } else {
        await upsertRiskConfig(db, {
          teamId: teamId!,
          preset: "custom",
          weights: input.weights,
          decayHalfLifeDays: input.decayHalfLifeDays,
          baselineScore: input.baselineScore,
          bandThresholds: input.bandThresholds,
        });
      }

      // Recalculate all scores with new config
      const result = await recalculateAllDealRisks(db, teamId!);
      return { saved: true, recalculated: result.recalculated };
    }),

  getPresets: protectedProcedure.query(() => {
    return Object.entries(PRESET_CONFIGS).map(([key, config]) => ({
      key,
      ...config,
    }));
  }),

  getScore: protectedProcedure
    .input(z.object({ dealId: z.string().uuid() }))
    .query(async ({ ctx: { db, teamId }, input }) => {
      return getRiskScore(db, { dealId: input.dealId, teamId: teamId! });
    }),

  getScores: protectedProcedure
    .input(z.object({ dealIds: z.array(z.string().uuid()) }))
    .query(async ({ ctx: { db, teamId }, input }) => {
      if (input.dealIds.length === 0) return [];
      return getRiskScoresByTeam(db, {
        teamId: teamId!,
        dealIds: input.dealIds,
      });
    }),

  getDistribution: protectedProcedure.query(
    async ({ ctx: { db, teamId } }) => {
      return getRiskDistribution(db, { teamId: teamId! });
    },
  ),

  getEvents: protectedProcedure
    .input(
      z.object({
        dealId: z.string().uuid(),
        limit: z.number().int().min(1).max(100).optional(),
      }),
    )
    .query(async ({ ctx: { db, teamId }, input }) => {
      return getRiskEvents(db, {
        dealId: input.dealId,
        teamId: teamId!,
        limit: input.limit,
      });
    }),

  recalculate: memberProcedure
    .input(z.object({ dealId: z.string().uuid() }))
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      await calculateRiskScore(db, input.dealId, teamId!);
      return getRiskScore(db, { dealId: input.dealId, teamId: teamId! });
    }),

  recalculateAll: memberProcedure.mutation(
    async ({ ctx: { db, teamId } }) => {
      return recalculateAllDealRisks(db, teamId!);
    },
  ),
});
