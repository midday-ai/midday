import {
  deleteBrokerSchema,
  getBrokerByIdSchema,
  getBrokerByPortalIdSchema,
  getBrokerDealStatsSchema,
  getBrokerDealsSchema,
  getBrokersSchema,
  getCommissionsByBrokerSchema,
  getCommissionsByDealSchema,
  toggleBrokerPortalSchema,
  updateCommissionSchema,
  upsertBrokerSchema,
} from "@api/schemas/brokers";
import {
  createTRPCRouter,
  memberProcedure,
  protectedProcedure,
  publicProcedure,
} from "@api/trpc/init";
import {
  deleteBroker,
  getBrokerById,
  getBrokerByPortalId,
  getBrokerDealStats,
  getBrokerDeals,
  getBrokers,
  getCommissionsByBroker,
  getCommissionsByDeal,
  markCommissionPaid,
  toggleBrokerPortal,
  upsertBroker,
} from "@midday/db/queries";
import { brokerCommissions, usersOnTeam } from "@midday/db/schema";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";

export const brokersRouter = createTRPCRouter({
  get: protectedProcedure
    .input(getBrokersSchema.optional())
    .query(async ({ ctx: { teamId, db }, input }) => {
      return getBrokers(db, {
        teamId: teamId!,
        ...input,
      });
    }),

  getById: protectedProcedure
    .input(getBrokerByIdSchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      return getBrokerById(db, {
        id: input.id,
        teamId: teamId!,
      });
    }),

  upsert: memberProcedure
    .input(upsertBrokerSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      return upsertBroker(db, {
        ...input,
        teamId: teamId!,
      });
    }),

  delete: memberProcedure
    .input(deleteBrokerSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      return deleteBroker(db, {
        id: input.id,
        teamId: teamId!,
      });
    }),

  togglePortal: memberProcedure
    .input(toggleBrokerPortalSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      return toggleBrokerPortal(db, {
        brokerId: input.brokerId,
        teamId: teamId!,
        enabled: input.enabled,
      });
    }),

  getDeals: protectedProcedure
    .input(getBrokerDealsSchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      return getBrokerDeals(db, {
        brokerId: input.brokerId,
        teamId: teamId!,
      });
    }),

  getDealStats: protectedProcedure
    .input(getBrokerDealStatsSchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      return getBrokerDealStats(db, {
        brokerId: input.brokerId,
        teamId: teamId!,
      });
    }),

  getCommissions: protectedProcedure
    .input(getCommissionsByBrokerSchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      return getCommissionsByBroker(db, {
        brokerId: input.brokerId,
        teamId: teamId!,
      });
    }),

  getCommissionsByDeal: protectedProcedure
    .input(getCommissionsByDealSchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      return getCommissionsByDeal(db, {
        dealId: input.dealId,
        teamId: teamId!,
      });
    }),

  updateCommission: memberProcedure
    .input(updateCommissionSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      if (
        input.status === "paid" &&
        !input.commissionPercentage &&
        !input.commissionAmount
      ) {
        return markCommissionPaid(db, {
          id: input.id,
          teamId: teamId!,
        });
      }

      const updates: Record<string, unknown> = {};
      if (input.status) updates.status = input.status;
      if (input.note !== undefined) updates.note = input.note;
      if (input.commissionPercentage !== undefined)
        updates.commissionPercentage = input.commissionPercentage;
      if (input.commissionAmount !== undefined)
        updates.commissionAmount = input.commissionAmount;
      if (input.status === "paid") updates.paidAt = new Date();

      const [result] = await db
        .update(brokerCommissions)
        .set(updates)
        .where(
          and(
            eq(brokerCommissions.id, input.id),
            eq(brokerCommissions.teamId, teamId!),
          ),
        )
        .returning();

      if (!result) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Commission not found",
        });
      }

      return result;
    }),

  // Self-service procedures (broker uses their own session)
  getMyProfile: protectedProcedure.query(
    async ({ ctx: { db, teamId, session } }) => {
      const membership = await db.query.usersOnTeam.findFirst({
        where: and(
          eq(usersOnTeam.userId, session.user.id),
          eq(usersOnTeam.teamId, teamId!),
        ),
        columns: { entityId: true, entityType: true },
      });

      if (!membership?.entityId || membership.entityType !== "broker") {
        return null;
      }

      return getBrokerById(db, { id: membership.entityId, teamId: teamId! });
    },
  ),

  getMyDeals: protectedProcedure.query(
    async ({ ctx: { db, teamId, session } }) => {
      const membership = await db.query.usersOnTeam.findFirst({
        where: and(
          eq(usersOnTeam.userId, session.user.id),
          eq(usersOnTeam.teamId, teamId!),
        ),
        columns: { entityId: true, entityType: true },
      });

      if (!membership?.entityId || membership.entityType !== "broker") {
        return [];
      }

      return getBrokerDeals(db, {
        brokerId: membership.entityId,
        teamId: teamId!,
      });
    },
  ),

  getMyDealStats: protectedProcedure.query(
    async ({ ctx: { db, teamId, session } }) => {
      const membership = await db.query.usersOnTeam.findFirst({
        where: and(
          eq(usersOnTeam.userId, session.user.id),
          eq(usersOnTeam.teamId, teamId!),
        ),
        columns: { entityId: true, entityType: true },
      });

      if (!membership?.entityId || membership.entityType !== "broker") {
        return {
          totalDeals: 0,
          activeDeals: 0,
          totalFunded: 0,
          totalBalance: 0,
          totalPaid: 0,
        };
      }

      return getBrokerDealStats(db, {
        brokerId: membership.entityId,
        teamId: teamId!,
      });
    },
  ),

  getMyCommissions: protectedProcedure.query(
    async ({ ctx: { db, teamId, session } }) => {
      const membership = await db.query.usersOnTeam.findFirst({
        where: and(
          eq(usersOnTeam.userId, session.user.id),
          eq(usersOnTeam.teamId, teamId!),
        ),
        columns: { entityId: true, entityType: true },
      });

      if (!membership?.entityId || membership.entityType !== "broker") {
        return [];
      }

      return getCommissionsByBroker(db, {
        brokerId: membership.entityId,
        teamId: teamId!,
      });
    },
  ),

  // Public procedures (for broker portal)
  getByPortalId: publicProcedure
    .input(getBrokerByPortalIdSchema)
    .query(async ({ ctx: { db }, input }) => {
      return getBrokerByPortalId(db, {
        portalId: input.portalId,
      });
    }),

  getPortalDeals: publicProcedure
    .input(getBrokerByPortalIdSchema)
    .query(async ({ ctx: { db }, input }) => {
      const broker = await getBrokerByPortalId(db, {
        portalId: input.portalId,
      });

      if (!broker) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Broker portal not found",
        });
      }

      return getBrokerDeals(db, {
        brokerId: broker.id,
        teamId: broker.teamId,
      });
    }),
});
