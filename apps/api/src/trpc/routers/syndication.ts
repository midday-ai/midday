import {
  deleteSyndicatorSchema,
  getParticipantsByDealSchema,
  getSyndicatorByIdSchema,
  getSyndicatorByPortalIdSchema,
  getSyndicatorDealStatsSchema,
  getSyndicatorDealsSchema,
  getSyndicatorsSchema,
  removeParticipantSchema,
  toggleSyndicatorPortalSchema,
  upsertParticipantSchema,
  upsertSyndicatorSchema,
} from "@api/schemas/syndication";
import {
  createTRPCRouter,
  memberProcedure,
  protectedProcedure,
  publicProcedure,
} from "@api/trpc/init";
import {
  deleteSyndicator,
  getSyndicatorById,
  getSyndicatorByPortalId,
  getSyndicatorDealStats,
  getSyndicatorDeals,
  getSyndicators,
  toggleSyndicatorPortal,
  upsertSyndicator,
  getParticipantsByDeal,
  upsertParticipant,
  removeParticipant,
  validateSplits,
} from "@midday/db/queries";
import { TRPCError } from "@trpc/server";

export const syndicationRouter = createTRPCRouter({
  get: protectedProcedure
    .input(getSyndicatorsSchema.optional())
    .query(async ({ ctx: { teamId, db }, input }) => {
      return getSyndicators(db, {
        teamId: teamId!,
        ...input,
      });
    }),

  getById: protectedProcedure
    .input(getSyndicatorByIdSchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      return getSyndicatorById(db, {
        id: input.id,
        teamId: teamId!,
      });
    }),

  upsert: memberProcedure
    .input(upsertSyndicatorSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      return upsertSyndicator(db, {
        ...input,
        teamId: teamId!,
      });
    }),

  delete: memberProcedure
    .input(deleteSyndicatorSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      return deleteSyndicator(db, {
        id: input.id,
        teamId: teamId!,
      });
    }),

  togglePortal: memberProcedure
    .input(toggleSyndicatorPortalSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      return toggleSyndicatorPortal(db, {
        syndicatorId: input.syndicatorId,
        teamId: teamId!,
        enabled: input.enabled,
      });
    }),

  getDeals: protectedProcedure
    .input(getSyndicatorDealsSchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      return getSyndicatorDeals(db, {
        syndicatorId: input.syndicatorId,
        teamId: teamId!,
      });
    }),

  getDealStats: protectedProcedure
    .input(getSyndicatorDealStatsSchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      return getSyndicatorDealStats(db, {
        syndicatorId: input.syndicatorId,
        teamId: teamId!,
      });
    }),

  getParticipantsByDeal: protectedProcedure
    .input(getParticipantsByDealSchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      return getParticipantsByDeal(db, {
        dealId: input.dealId,
        teamId: teamId!,
      });
    }),

  addParticipant: memberProcedure
    .input(upsertParticipantSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      // Validate splits won't exceed 100%
      const splits = await validateSplits(db, {
        dealId: input.dealId,
        teamId: teamId!,
      });

      const newTotal = splits.total + input.ownershipPercentage;
      if (newTotal > 1.0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Total ownership would be ${(newTotal * 100).toFixed(1)}%. Maximum is 100%. Available: ${(splits.remaining * 100).toFixed(1)}%.`,
        });
      }

      return upsertParticipant(db, {
        ...input,
        teamId: teamId!,
      });
    }),

  removeParticipant: memberProcedure
    .input(removeParticipantSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      return removeParticipant(db, {
        id: input.id,
        teamId: teamId!,
      });
    }),

  updateParticipant: memberProcedure
    .input(upsertParticipantSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      // Validate splits won't exceed 100% (exclude current participant)
      const splits = await validateSplits(db, {
        dealId: input.dealId,
        teamId: teamId!,
        excludeParticipantId: input.id,
      });

      const newTotal = splits.total + input.ownershipPercentage;
      if (newTotal > 1.0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Total ownership would be ${(newTotal * 100).toFixed(1)}%. Maximum is 100%. Available: ${(splits.remaining * 100).toFixed(1)}%.`,
        });
      }

      return upsertParticipant(db, {
        ...input,
        teamId: teamId!,
      });
    }),

  // Public procedures (for syndicator portal)
  getByPortalId: publicProcedure
    .input(getSyndicatorByPortalIdSchema)
    .query(async ({ ctx: { db }, input }) => {
      return getSyndicatorByPortalId(db, {
        portalId: input.portalId,
      });
    }),

  getPortalDeals: publicProcedure
    .input(getSyndicatorByPortalIdSchema)
    .query(async ({ ctx: { db }, input }) => {
      const syndicator = await getSyndicatorByPortalId(db, {
        portalId: input.portalId,
      });

      if (!syndicator) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Syndicator portal not found",
        });
      }

      return getSyndicatorDeals(db, {
        syndicatorId: syndicator.id,
        teamId: syndicator.teamId,
      });
    }),
});
