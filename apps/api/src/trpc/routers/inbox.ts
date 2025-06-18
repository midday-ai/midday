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
  getInbox,
  getInboxById,
  getInboxSearch,
  matchTransaction,
  unmatchTransaction,
  updateInbox,
} from "@midday/db/queries";
import { processAttachmentJob } from "@midday/worker/jobs";

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
      return deleteInbox(db, {
        id: input.id,
        teamId: teamId!,
      });
    }),

  processAttachments: protectedProcedure
    .input(processAttachmentsSchema)
    .mutation(async ({ ctx: { teamId }, input }) => {
      return await processAttachmentJob.batchTrigger(
        input.map((item) => ({
          payload: {
            filePath: item.filePath,
            mimetype: item.mimetype,
            size: item.size,
            teamId: teamId!,
          },
        })),
      );
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
});
