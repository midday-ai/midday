import {
  getCollectionCasesSchema,
  createCollectionCaseSchema,
  updateCollectionCaseSchema,
  resolveCollectionCaseSchema,
  getCollectionNotesSchema,
  addCollectionNoteSchema,
  markNotificationReadSchema,
} from "@api/schemas/collections";
import {
  createTRPCRouter,
  memberProcedure,
  protectedProcedure,
} from "@api/trpc/init";
import {
  getCollectionCases,
  getCollectionCaseById,
  createCollectionCase,
  updateCollectionCase,
  getCollectionStats,
  getCandidateDeals,
  getCollectionsByMerchantId,
} from "@db/queries/collections";
import {
  getCollectionNotes,
  createCollectionNote,
} from "@db/queries/collection-notes";
import {
  getUnreadNotifications,
  getNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "@db/queries/collection-notifications";
import { seedDefaultStages } from "@db/queries/collection-config";
import { z } from "zod";

export const collectionsRouter = createTRPCRouter({
  get: protectedProcedure
    .input(getCollectionCasesSchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      return getCollectionCases(db, {
        teamId: teamId!,
        status: input.status,
        stageId: input.stageId,
        assignedTo: input.assignedTo,
        priority: input.priority,
        cursor: input.cursor,
        pageSize: input.pageSize,
        sort: input.sort,
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx: { db, teamId }, input }) => {
      return getCollectionCaseById(db, {
        id: input.id,
        teamId: teamId!,
      });
    }),

  getStats: protectedProcedure.query(async ({ ctx: { db, teamId } }) => {
    return getCollectionStats(db, { teamId: teamId! });
  }),

  getCandidates: protectedProcedure
    .input(
      z.object({
        cursor: z.string().nullish(),
        pageSize: z.number().min(1).max(100).optional(),
      }),
    )
    .query(async ({ ctx: { db, teamId }, input }) => {
      return getCandidateDeals(db, {
        teamId: teamId!,
        cursor: input.cursor,
        pageSize: input.pageSize,
      });
    }),

  getByMerchantId: protectedProcedure
    .input(z.object({ merchantId: z.string().uuid() }))
    .query(async ({ ctx: { db, teamId }, input }) => {
      return getCollectionsByMerchantId(db, {
        merchantId: input.merchantId,
        teamId: teamId!,
      });
    }),

  create: memberProcedure
    .input(createCollectionCaseSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      // Seed default stages if none exist yet
      await seedDefaultStages(db, { teamId: teamId! });

      let stageId = input.stageId;
      if (!stageId) {
        // Use the default stage
        const { getCollectionStages } = await import(
          "@db/queries/collection-config"
        );
        const stages = await getCollectionStages(db, { teamId: teamId! });
        const defaultStage = stages.find((s) => s.isDefault);
        stageId = defaultStage?.id ?? stages[0]?.id;
        if (!stageId) {
          throw new Error("No collection stages configured");
        }
      }

      return createCollectionCase(db, {
        teamId: teamId!,
        dealId: input.dealId,
        stageId,
        priority: input.priority,
        assignedTo: input.assignedTo,
      });
    }),

  update: memberProcedure
    .input(updateCollectionCaseSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      return updateCollectionCase(db, {
        id: input.id,
        teamId: teamId!,
        stageId: input.stageId,
        assignedTo: input.assignedTo,
        priority: input.priority,
        nextFollowUp: input.nextFollowUp,
      });
    }),

  resolve: memberProcedure
    .input(resolveCollectionCaseSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      return updateCollectionCase(db, {
        id: input.id,
        teamId: teamId!,
        outcome: input.outcome,
        agencyId: input.outcome === "sent_to_agency" ? input.agencyId : null,
        resolvedAt: new Date().toISOString(),
      });
    }),

  // Notes
  getNotes: protectedProcedure
    .input(getCollectionNotesSchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      return getCollectionNotes(db, {
        caseId: input.caseId,
        teamId: teamId!,
        cursor: input.cursor,
        pageSize: input.pageSize,
      });
    }),

  addNote: memberProcedure
    .input(addCollectionNoteSchema)
    .mutation(async ({ ctx: { db, teamId, session }, input }) => {
      return createCollectionNote(db, {
        caseId: input.caseId,
        teamId: teamId!,
        authorId: session.user.id,
        contactName: input.contactName,
        contactMethod: input.contactMethod,
        followUpDate: input.followUpDate,
        summary: input.summary,
      });
    }),

  // Notifications
  getNotifications: protectedProcedure.query(
    async ({ ctx: { db, teamId, session } }) => {
      return getUnreadNotifications(db, {
        userId: session.user.id,
        teamId: teamId!,
      });
    },
  ),

  getNotificationCount: protectedProcedure.query(
    async ({ ctx: { db, teamId, session } }) => {
      return getNotificationCount(db, {
        userId: session.user.id,
        teamId: teamId!,
      });
    },
  ),

  markNotificationRead: protectedProcedure
    .input(markNotificationReadSchema)
    .mutation(async ({ ctx: { db, session }, input }) => {
      return markNotificationRead(db, {
        id: input.id,
        userId: session.user.id,
      });
    }),

  markAllNotificationsRead: protectedProcedure.mutation(
    async ({ ctx: { db, teamId, session } }) => {
      return markAllNotificationsRead(db, {
        userId: session.user.id,
        teamId: teamId!,
      });
    },
  ),
});
