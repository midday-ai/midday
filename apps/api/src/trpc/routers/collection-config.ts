import {
  createTRPCRouter,
  adminProcedure,
  protectedProcedure,
} from "@api/trpc/init";
import {
  getCollectionStages,
  upsertCollectionStage,
  deleteCollectionStage,
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
import { z } from "zod";

export const collectionConfigRouter = createTRPCRouter({
  // Stages
  getStages: protectedProcedure.query(async ({ ctx: { db, teamId } }) => {
    await seedDefaultStages(db, { teamId: teamId! });
    return getCollectionStages(db, { teamId: teamId! });
  }),

  upsertStage: adminProcedure
    .input(
      z.object({
        id: z.string().uuid().optional(),
        name: z.string().min(1, "Name is required"),
        slug: z.string().min(1, "Slug is required"),
        position: z.number().int().min(0),
        color: z.string().optional(),
        isDefault: z.boolean().optional(),
        isTerminal: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      return upsertCollectionStage(db, {
        ...input,
        teamId: teamId!,
      });
    }),

  deleteStage: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
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
    .input(
      z.object({
        id: z.string().uuid().optional(),
        name: z.string().min(1, "Name is required"),
        contactName: z.string().optional(),
        contactEmail: z.string().email().optional().or(z.literal("")),
        contactPhone: z.string().optional(),
        notes: z.string().optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      return upsertCollectionAgency(db, {
        ...input,
        teamId: teamId!,
      });
    }),

  deleteAgency: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
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
    .input(
      z.object({
        id: z.string().uuid().optional(),
        triggerType: z.enum(["time_based", "event_based"]),
        fromStageId: z.string().uuid(),
        toStageId: z.string().uuid(),
        condition: z.record(z.unknown()),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      return upsertEscalationRule(db, {
        ...input,
        teamId: teamId!,
      });
    }),

  deleteRule: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
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
    .input(
      z.object({
        id: z.string().uuid().optional(),
        stageId: z.string().uuid().optional(),
        metric: z.enum(["time_in_stage", "response_time", "resolution_time"]),
        thresholdMinutes: z.number().int().positive(),
      }),
    )
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      return upsertSlaConfig(db, {
        ...input,
        teamId: teamId!,
      });
    }),

  deleteSlaConfig: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      return deleteSlaConfig(db, {
        id: input.id,
        teamId: teamId!,
      });
    }),
});
