import {
  deleteInbox,
  getInbox,
  getInboxById,
  getInboxSearch,
  matchTransaction,
  unmatchTransaction,
  updateInbox,
} from "@api/db/queries/inbox";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import type { processAttachment } from "@midday/jobs/tasks/inbox/process-attachment";
import { tasks } from "@trigger.dev/sdk/v3";
import {
  deleteInboxSchema,
  getInboxByIdSchema,
  getInboxSchema,
  matchTransactionSchema,
  processAttachmentsSchema,
  searchInboxSchema,
  unmatchTransactionSchema,
  updateInboxSchema,
} from "./schema";

export const inboxRouter = createTRPCRouter({
  get: protectedProcedure
    .input(getInboxSchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      return getInbox(db, {
        teamId: teamId!,
        ...input,
      });
    }),

  getById: protectedProcedure
    .input(getInboxByIdSchema)
    .query(async ({ ctx: { db }, input }) => {
      return getInboxById(db, input.id);
    }),

  delete: protectedProcedure
    .input(deleteInboxSchema)
    .mutation(async ({ ctx: { db }, input }) => {
      return deleteInbox(db, input.id);
    }),

  processAttachments: protectedProcedure
    .input(processAttachmentsSchema)
    .mutation(async ({ ctx: { teamId }, input }) => {
      return tasks.batchTrigger<typeof processAttachment>(
        "process-attachment",
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
    .mutation(async ({ ctx: { db }, input }) => {
      return unmatchTransaction(db, input.id);
    }),
});
