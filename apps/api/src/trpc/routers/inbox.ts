import {
  deleteInboxSchema,
  getInboxByIdSchema,
  getInboxSchema,
  matchTransactionSchema,
  processAttachmentsSchema,
  searchInboxSchema,
  unmatchTransactionSchema,
  updateInboxSchema,
} from "@api/schemas/inbox";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import {
  deleteInbox,
  deleteInboxEmbedding,
  getInbox,
  getInboxById,
  getInboxSearch,
  matchTransaction,
  unmatchTransaction,
  updateInbox,
} from "@midday/db/queries";
import {
  confirmSuggestedMatch,
  declineSuggestedMatch,
  getInboxByStatus,
  getInboxSuggestion,
} from "@midday/db/queries/inbox-matching";
import type { ProcessAttachmentPayload } from "@midday/jobs/schema";
import { tasks } from "@trigger.dev/sdk";
import { z } from "zod";

export const inboxRouter = createTRPCRouter({
  get: protectedProcedure
    .input(getInboxSchema.optional())
    .query(async ({ ctx: { db, teamId }, input }) => {
      return getInbox(db, {
        teamId: teamId!,
        ...input,
      });
    }),

  getById: protectedProcedure
    .input(getInboxByIdSchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      return getInboxById(db, {
        id: input.id,
        teamId: teamId!,
      });
    }),

  delete: protectedProcedure
    .input(deleteInboxSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      await Promise.all([
        deleteInboxEmbedding(db, {
          inboxId: input.id,
          teamId: teamId!,
        }),
        deleteInbox(db, {
          id: input.id,
          teamId: teamId!,
        }),
      ]);
    }),

  processAttachments: protectedProcedure
    .input(processAttachmentsSchema)
    .mutation(async ({ ctx: { teamId }, input }) => {
      const batchResult = await tasks.batchTrigger(
        "process-attachment",
        input.map((item) => ({
          payload: {
            filePath: item.filePath,
            mimetype: item.mimetype,
            size: item.size,
            teamId: teamId!,
          },
        })) as { payload: ProcessAttachmentPayload }[],
      );

      // Send notification for user uploads
      await tasks.trigger("notification", {
        type: "inbox_new",
        teamId: teamId!,
        totalCount: input.length,
        inboxType: "upload",
      });

      return batchResult;
    }),

  search: protectedProcedure
    .input(searchInboxSchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      const { query, limit = 10 } = input;

      return getInboxSearch(db, {
        teamId: teamId!,
        q: query,
        limit,
      });
    }),

  update: protectedProcedure
    .input(updateInboxSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      return updateInbox(db, { ...input, teamId: teamId! });
    }),

  matchTransaction: protectedProcedure
    .input(matchTransactionSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      return matchTransaction(db, { ...input, teamId: teamId! });
    }),

  unmatchTransaction: protectedProcedure
    .input(unmatchTransactionSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      return unmatchTransaction(db, {
        id: input.id,
        teamId: teamId!,
      });
    }),

  // Get inbox items by status
  getByStatus: protectedProcedure
    .input(
      z.object({
        status: z
          .enum([
            "processing",
            "pending",
            "archived",
            "new",
            "analyzing",
            "suggested_match",
            "no_match",
            "done",
            "deleted",
          ])
          .optional(),
      }),
    )
    .query(async ({ ctx: { db, teamId }, input }) => {
      return getInboxByStatus(db, {
        teamId: teamId!,
        status: input.status,
      });
    }),

  // Get suggestion for a specific inbox item
  getSuggestion: protectedProcedure
    .input(
      z.object({
        inboxId: z.string().uuid(),
      }),
    )
    .query(async ({ ctx: { db, teamId }, input }) => {
      return getInboxSuggestion(db, {
        teamId: teamId!,
        inboxId: input.inboxId,
      });
    }),

  // Confirm a match suggestion
  confirmMatch: protectedProcedure
    .input(
      z.object({
        suggestionId: z.string().uuid(),
        inboxId: z.string().uuid(),
        transactionId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx: { db, teamId, session }, input }) => {
      return confirmSuggestedMatch(db, {
        teamId: teamId!,
        suggestionId: input.suggestionId,
        inboxId: input.inboxId,
        transactionId: input.transactionId,
        userId: session.user.id,
      });
    }),

  // Decline a match suggestion
  declineMatch: protectedProcedure
    .input(
      z.object({
        suggestionId: z.string().uuid(),
        inboxId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx: { db, session }, input }) => {
      return declineSuggestedMatch(db, {
        suggestionId: input.suggestionId,
        inboxId: input.inboxId,
        userId: session.user.id,
      });
    }),
});
