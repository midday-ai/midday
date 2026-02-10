import {
  confirmMatchSchema,
  createInboxBlocklistSchema,
  createInboxItemSchema,
  declineMatchSchema,
  deleteInboxBlocklistSchema,
  deleteInboxManySchema,
  deleteInboxSchema,
  getInboxBlocklistSchema,
  getInboxByIdSchema,
  getInboxByStatusSchema,
  getInboxSchema,
  matchTransactionSchema,
  processAttachmentsSchema,
  retryMatchingSchema,
  searchInboxSchema,
  unmatchTransactionSchema,
  updateInboxSchema,
} from "@api/schemas/inbox";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import {
  checkInboxAttachments,
  confirmSuggestedMatch,
  createInbox,
  createInboxBlocklist,
  declineSuggestedMatch,
  deleteInbox,
  deleteInboxBlocklist,
  deleteInboxEmbedding,
  deleteInboxMany,
  getInbox,
  getInboxBlocklist,
  getInboxById,
  getInboxByStatus,
  getInboxSearch,
  matchTransaction,
  unmatchTransaction,
  updateInbox,
} from "@midday/db/queries";
import { triggerJob } from "@midday/job-client";
import { logger } from "@midday/logger";
import { remove } from "@midday/supabase/storage";

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

  checkAttachments: protectedProcedure
    .input(deleteInboxSchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      return checkInboxAttachments(db, {
        id: input.id,
        teamId: teamId!,
      });
    }),

  delete: protectedProcedure
    .input(deleteInboxSchema)
    .mutation(async ({ ctx: { db, supabase, teamId }, input }) => {
      // Delete inbox item and get filePath for storage cleanup
      const result = await deleteInbox(db, {
        id: input.id,
        teamId: teamId!,
      });

      // Delete file from storage if filePath exists
      if (result?.filePath && result.filePath.length > 0) {
        try {
          await remove(supabase, {
            bucket: "vault",
            path: result.filePath,
          });
        } catch (error) {
          // Log error but don't fail the deletion if file doesn't exist in storage
          logger.error("Failed to delete file from storage", {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      // Delete embedding
      await deleteInboxEmbedding(db, {
        inboxId: input.id,
        teamId: teamId!,
      });
    }),

  deleteMany: protectedProcedure
    .input(deleteInboxManySchema)
    .mutation(async ({ ctx: { db, supabase, teamId }, input }) => {
      // Delete inbox items and get filePaths for storage cleanup
      const results = await deleteInboxMany(db, {
        ids: input,
        teamId: teamId!,
      });

      // Delete files from storage and embeddings
      for (const result of results) {
        // Delete file from storage if filePath exists
        if (result?.filePath && result.filePath.length > 0) {
          try {
            await remove(supabase, {
              bucket: "vault",
              path: result.filePath,
            });
          } catch (error) {
            // Log error but don't fail the deletion if file doesn't exist in storage
            logger.error("Failed to delete file from storage", {
              inboxId: result.id,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }

        // Delete embedding
        try {
          await deleteInboxEmbedding(db, {
            inboxId: result.id,
            teamId: teamId!,
          });
        } catch (error) {
          // Log error but continue with other items
          logger.error("Failed to delete embedding", {
            inboxId: result.id,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      return results;
    }),

  create: protectedProcedure
    .input(createInboxItemSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      return createInbox(db, {
        displayName: input.filename,
        teamId: teamId!,
        filePath: input.filePath,
        fileName: input.filename,
        contentType: input.mimetype,
        size: input.size,
        status: "processing",
      });
    }),

  processAttachments: protectedProcedure
    .input(processAttachmentsSchema)
    .mutation(async ({ ctx: { teamId }, input }) => {
      const jobResults = await Promise.all(
        input.map((item) =>
          triggerJob(
            "process-attachment",
            {
              filePath: item.filePath,
              mimetype: item.mimetype,
              size: item.size,
              teamId: teamId!,
              referenceId: item.referenceId,
              website: item.website,
              senderEmail: item.senderEmail,
              inboxAccountId: item.inboxAccountId,
            },
            "inbox",
          ),
        ),
      );

      // Send notification for user uploads
      // This is a non-critical operation, so we don't await it
      if (input.length > 0) {
        try {
          await triggerJob(
            "notification",
            {
              type: "inbox_new",
              teamId: teamId!,
              totalCount: input.length,
              inboxType: "upload",
            },
            "notifications",
          );
        } catch (error) {
          // Don't fail the entire process if notification fails
          logger.warn("Failed to trigger inbox_new notification", {
            teamId: teamId!,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      return {
        jobs: jobResults.map((result) => ({ id: result.id })),
      };
    }),

  search: protectedProcedure
    .input(searchInboxSchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      const { q, transactionId, limit = 10 } = input;

      return getInboxSearch(db, {
        teamId: teamId!,
        q,
        transactionId,
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
    .mutation(async ({ ctx: { db, teamId, session }, input }) => {
      return unmatchTransaction(db, {
        id: input.id,
        teamId: teamId!,
        userId: session.user.id,
      });
    }),

  // Get inbox items by status
  getByStatus: protectedProcedure
    .input(getInboxByStatusSchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      return getInboxByStatus(db, {
        teamId: teamId!,
        status: input.status,
      });
    }),

  // Confirm a match suggestion
  confirmMatch: protectedProcedure
    .input(confirmMatchSchema)
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
    .input(declineMatchSchema)
    .mutation(async ({ ctx: { db, session, teamId }, input }) => {
      return declineSuggestedMatch(db, {
        suggestionId: input.suggestionId,
        inboxId: input.inboxId,
        userId: session.user.id,
        teamId: teamId!,
      });
    }),

  // Retry matching for an inbox item
  retryMatching: protectedProcedure
    .input(retryMatchingSchema)
    .mutation(async ({ ctx: { teamId }, input }) => {
      const result = await triggerJob(
        "batch-process-matching",
        {
          teamId: teamId!,
          inboxIds: [input.id],
        },
        "inbox",
      );

      return { jobId: result.id };
    }),

  // Blocklist management
  blocklist: createTRPCRouter({
    get: protectedProcedure
      .input(getInboxBlocklistSchema)
      .query(async ({ ctx: { db, teamId } }) => {
        return getInboxBlocklist(db, {
          teamId: teamId!,
        });
      }),

    create: protectedProcedure
      .input(createInboxBlocklistSchema)
      .mutation(async ({ ctx: { db, teamId }, input }) => {
        return createInboxBlocklist(db, {
          teamId: teamId!,
          type: input.type,
          value: input.value,
        });
      }),

    delete: protectedProcedure
      .input(deleteInboxBlocklistSchema)
      .mutation(async ({ ctx: { db, teamId }, input }) => {
        return deleteInboxBlocklist(db, {
          id: input.id,
          teamId: teamId!,
        });
      }),
  }),
});
