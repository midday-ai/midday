import {
  deleteDocumentSchema,
  getDocumentSchema,
  getDocumentsSchema,
  getRelatedDocumentsSchema,
  processDocumentSchema,
  reprocessDocumentSchema,
  signedUrlSchema,
  signedUrlsSchema,
} from "@api/schemas/documents";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import {
  checkDocumentAttachments,
  deleteDocument,
  getDocumentById,
  getDocuments,
  getRelatedDocuments,
  updateDocumentProcessingStatus,
  updateDocuments,
} from "@midday/db/queries";
import { isMimeTypeSupportedForProcessing } from "@midday/documents/utils";
import { triggerJob } from "@midday/job-client";
import { remove, signedUrl } from "@midday/supabase/storage";
import { TRPCError } from "@trpc/server";

export const documentsRouter = createTRPCRouter({
  get: protectedProcedure
    .input(getDocumentsSchema)
    .query(async ({ input, ctx: { db, teamId } }) => {
      return getDocuments(db, {
        teamId: teamId!,
        ...input,
      });
    }),

  getById: protectedProcedure
    .input(getDocumentSchema)
    .query(async ({ input, ctx: { db, teamId } }) => {
      const result = await getDocumentById(db, {
        id: input.id,
        filePath: input.filePath,
        teamId: teamId!,
      });

      return result ?? null;
    }),

  getRelatedDocuments: protectedProcedure
    .input(getRelatedDocumentsSchema)
    .query(async ({ input, ctx: { db, teamId } }) => {
      return getRelatedDocuments(db, {
        id: input.id,
        pageSize: input.pageSize,
        teamId: teamId!,
      });
    }),

  checkAttachments: protectedProcedure
    .input(deleteDocumentSchema)
    .query(async ({ input, ctx: { db, teamId } }) => {
      return checkDocumentAttachments(db, {
        id: input.id,
        teamId: teamId!,
      });
    }),

  delete: protectedProcedure
    .input(deleteDocumentSchema)
    .mutation(async ({ input, ctx: { db, supabase, teamId } }) => {
      const document = await deleteDocument(db, {
        id: input.id,
        teamId: teamId!,
      });

      if (!document || !document.pathTokens) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Document not found",
        });
      }

      // Delete from storage
      await remove(supabase, {
        bucket: "vault",
        path: document.pathTokens,
      });

      return document;
    }),

  processDocument: protectedProcedure
    .input(processDocumentSchema)
    .mutation(async ({ ctx: { teamId, db }, input }) => {
      const supportedDocuments = input.filter((item) =>
        isMimeTypeSupportedForProcessing(item.mimetype),
      );

      const unsupportedDocuments = input.filter(
        (item) => !isMimeTypeSupportedForProcessing(item.mimetype),
      );

      if (unsupportedDocuments.length > 0) {
        const unsupportedNames = unsupportedDocuments.map((doc) =>
          doc.filePath.join("/"),
        );

        await updateDocuments(db, {
          ids: unsupportedNames,
          teamId: teamId!,
          processingStatus: "completed",
        });
      }

      if (supportedDocuments.length === 0) {
        return;
      }

      // Trigger BullMQ jobs for each supported document
      // Use deterministic jobId based on teamId:filePath for deduplication
      const jobResults = await Promise.all(
        supportedDocuments.map((item) =>
          triggerJob(
            "process-document",
            {
              filePath: item.filePath,
              mimetype: item.mimetype,
              teamId: teamId!,
            },
            "documents",
            { jobId: `process-doc_${teamId}_${item.filePath.join("/")}` },
          ),
        ),
      );

      return {
        jobs: jobResults.map((result) => ({ id: result.id })),
      };
    }),

  reprocessDocument: protectedProcedure
    .input(reprocessDocumentSchema)
    .mutation(async ({ ctx: { teamId, db }, input }) => {
      // Get the document to reprocess
      const document = await getDocumentById(db, {
        id: input.id,
        teamId: teamId!,
      });

      if (!document) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Document not found",
        });
      }

      // Get mimetype from metadata
      const mimetype =
        (document.metadata as { mimetype?: string })?.mimetype ??
        "application/octet-stream";

      // Validate pathTokens exists - required for job processing
      if (!document.pathTokens || document.pathTokens.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Document has no file path and cannot be reprocessed",
        });
      }

      // Check if it's a supported file type
      if (!isMimeTypeSupportedForProcessing(mimetype)) {
        // Mark unsupported files as completed
        await updateDocumentProcessingStatus(db, {
          id: input.id,
          processingStatus: "completed",
        });
        return {
          success: true,
          skipped: true,
          document: { id: input.id, processingStatus: "completed" as const },
        };
      }

      // Reset status to pending
      await updateDocumentProcessingStatus(db, {
        id: input.id,
        processingStatus: "pending",
      });

      // Trigger reprocessing with unique jobId (includes timestamp)
      // Unlike initial processing which uses deterministic IDs to prevent duplicate uploads,
      // reprocessing MUST use unique IDs because BullMQ won't create a new job if an ID exists.
      // Completed jobs are retained for 24h and failed for 7 days, so deterministic IDs
      // would cause retries within these windows to silently fail (returns existing job).
      const jobResult = await triggerJob(
        "process-document",
        {
          filePath: document.pathTokens,
          mimetype,
          teamId: teamId!,
        },
        "documents",
        {
          jobId: `reprocess-doc_${teamId}_${document.pathTokens.join("/")}_${Date.now()}`,
        },
      );

      return {
        success: true,
        jobId: jobResult.id,
        document: { id: input.id, processingStatus: "pending" as const },
      };
    }),

  signedUrl: protectedProcedure
    .input(signedUrlSchema)
    .mutation(async ({ input, ctx: { supabase } }) => {
      const { data } = await signedUrl(supabase, {
        bucket: "vault",
        path: input.filePath,
        expireIn: input.expireIn,
      });

      return data;
    }),

  signedUrls: protectedProcedure
    .input(signedUrlsSchema)
    .mutation(async ({ input, ctx: { supabase } }) => {
      const signedUrls = [];

      for (const filePath of input) {
        const { data } = await signedUrl(supabase, {
          bucket: "vault",
          path: filePath,
          expireIn: 60, // 1 Minute
        });

        if (data?.signedUrl) {
          signedUrls.push(data.signedUrl);
        }
      }

      return signedUrls ?? [];
    }),
});
