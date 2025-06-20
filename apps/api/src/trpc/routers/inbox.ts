import {
  deleteInboxSchema,
  getInboxByIdSchema,
  getInboxSchema,
  matchTransactionSchema,
  processInboxSchema,
  searchInboxSchema,
  unmatchTransactionSchema,
  updateInboxSchema,
} from "@api/schemas/inbox";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import {
  createInbox,
  deleteInbox,
  getInbox,
  getInboxById,
  getInboxSearch,
  matchTransaction,
  unmatchTransaction,
  updateInbox,
} from "@midday/db/queries";
import { processInboxJob } from "@midday/worker/jobs";

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
    .input(processInboxSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      // Create inbox records first
      const inboxRecords = await Promise.all(
        input.map(async (item) => {
          const filename = item.filePath.at(-1);

          if (!filename) {
            throw new Error("Filename not found");
          }

          const inboxRecord = await createInbox(db, {
            teamId: teamId!,
            // NOTE: If we can't parse the name using OCR this will be the fallback name
            displayName: filename,
            filePath: item.filePath,
            fileName: filename,
            contentType: item.mimetype,
            size: item.size,
            referenceId: item.referenceId,
            website: item.website,
            status: "processing",
          });

          if (!inboxRecord) {
            throw new Error("Failed to create inbox record");
          }

          return inboxRecord;
        }),
      );

      // Trigger jobs with inbox IDs
      return processInboxJob.batchTrigger(
        inboxRecords.map((inboxRecord, index) => ({
          payload: {
            inboxId: inboxRecord.id,
            filePath: input[index]!.filePath,
            mimetype: input[index]!.mimetype,
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
