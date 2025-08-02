import {
  deleteDocumentSchema,
  getDocumentSchema,
  getDocumentsSchema,
  getRelatedDocumentsSchema,
  processDocumentSchema,
  signedUrlSchema,
  signedUrlsSchema,
} from "@api/schemas/documents";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import {
  deleteDocument,
  getDocumentById,
  getDocuments,
  getRelatedDocuments,
  updateDocuments,
} from "@midday/db/queries";
import { isMimeTypeSupportedForProcessing } from "@midday/documents/utils";
import type { ProcessDocumentPayload } from "@midday/jobs/schema";
import { remove, signedUrl } from "@midday/supabase/storage";
import { tasks } from "@trigger.dev/sdk";
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
      return getDocumentById(db, {
        id: input.id,
        filePath: input.filePath,
        teamId: teamId!,
      });
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

      // Trigger processing task only for supported documents
      return tasks.batchTrigger(
        "process-document",
        supportedDocuments.map(
          (item) =>
            ({
              payload: {
                filePath: item.filePath,
                mimetype: item.mimetype,
                teamId: teamId!,
              },
            }) as { payload: ProcessDocumentPayload },
        ),
      );
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
