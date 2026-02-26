import {
  upsertCollectionStageSchema,
  swapStagePositionsSchema,
  upsertCollectionAgencySchema,
  upsertEscalationRuleSchema,
  upsertSlaConfigSchema,
  deleteByIdSchema,
} from "@api/schemas/collections";
import {
  createTRPCRouter,
  adminProcedure,
  protectedProcedure,
} from "@api/trpc/init";
import {
  getCollectionStages,
  upsertCollectionStage,
  deleteCollectionStage,
  swapStagePositions,
  seedDefaultStages,
  getCollectionAgencies,
  upsertCollectionAgency,
  deleteCollectionAgency,
  getEscalationRules,
  upsertEscalationRule,
  deleteEscalationRule,
  getSlaConfigs,
  upsertSlaConfig,
  deleteSlaConfig,
} from "@db/queries/collection-config";

export const collectionConfigRouter = createTRPCRouter({
  // Stages
  getStages: protectedProcedure.query(async ({ ctx: { db, teamId } }) => {
    await seedDefaultStages(db, { teamId: teamId! });
    return getCollectionStages(db, { teamId: teamId! });
  }),

  upsertStage: adminProcedure
    .input(upsertCollectionStageSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      return upsertCollectionStage(db, {
        ...input,
        teamId: teamId!,
      });
    }),

  swapStagePositions: adminProcedure
    .input(swapStagePositionsSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      return swapStagePositions(db, {
        teamId: teamId!,
        stageAId: input.stageAId,
        stageBId: input.stageBId,
      });
    }),

  deleteStage: adminProcedure
    .input(deleteByIdSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      return deleteCollectionStage(db, {
        id: input.id,
        teamId: teamId!,
      });
    }),

  // Agencies
  getAgencies: protectedProcedure.query(async ({ ctx: { db, teamId } }) => {
    return getCollectionAgencies(db, { teamId: teamId! });
  }),

  upsertAgency: adminProcedure
    .input(upsertCollectionAgencySchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      return upsertCollectionAgency(db, {
        ...input,
        teamId: teamId!,
      });
    }),

  deleteAgency: adminProcedure
    .input(deleteByIdSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      return deleteCollectionAgency(db, {
        id: input.id,
        teamId: teamId!,
      });
    }),

  // Escalation Rules
  getRules: protectedProcedure.query(async ({ ctx: { db, teamId } }) => {
    return getEscalationRules(db, { teamId: teamId! });
  }),

  upsertRule: adminProcedure
    .input(upsertEscalationRuleSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      return upsertEscalationRule(db, {
        ...input,
        teamId: teamId!,
      });
    }),

  deleteRule: adminProcedure
    .input(deleteByIdSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      return deleteEscalationRule(db, {
        id: input.id,
        teamId: teamId!,
      });
    }),

  // SLA Configs
  getSlaConfigs: protectedProcedure.query(async ({ ctx: { db, teamId } }) => {
    return getSlaConfigs(db, { teamId: teamId! });
  }),

  upsertSlaConfig: adminProcedure
    .input(upsertSlaConfigSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      return upsertSlaConfig(db, {
        ...input,
        teamId: teamId!,
      });
    }),

  deleteSlaConfig: adminProcedure
    .input(deleteByIdSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      return deleteSlaConfig(db, {
        id: input.id,
        teamId: teamId!,
      });
    }),
});
