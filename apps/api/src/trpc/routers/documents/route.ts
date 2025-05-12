import { getDocumentById } from "@api/db/queries/documents";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { isMimeTypeSupportedForProcessing } from "@midday/documents/utils";
import type { processDocument } from "@midday/jobs/tasks/document/process-document";
import { deleteDocument } from "@midday/supabase/mutations";
import {
  getDocumentsQuery,
  getRelatedDocumentsQuery,
} from "@midday/supabase/queries";
import { signedUrl } from "@midday/supabase/storage";
import { tasks } from "@trigger.dev/sdk/v3";
import {
  deleteDocumentSchema,
  getDocumentSchema,
  getDocumentsSchema,
  getRelatedDocumentsSchema,
  processDocumentSchema,
  signedUrlSchema,
  signedUrlsSchema,
} from "./schema";

export const documentsRouter = createTRPCRouter({
  get: protectedProcedure
    .input(getDocumentsSchema)
    .query(async ({ input, ctx: { supabase, teamId } }) => {
      return getDocumentsQuery(supabase, {
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
    .query(async ({ input, ctx: { supabase, teamId } }) => {
      return getRelatedDocumentsQuery(supabase, {
        id: input.id,
        teamId: teamId!,
        pageSize: input.pageSize,
      });
    }),

  delete: protectedProcedure
    .input(deleteDocumentSchema)
    .mutation(async ({ input, ctx: { supabase } }) => {
      const { data } = await deleteDocument(supabase, {
        id: input.id,
      });

      return data;
    }),

  processDocument: protectedProcedure
    .input(processDocumentSchema)
    .mutation(async ({ ctx: { teamId, supabase }, input }) => {
      const supportedDocuments = input.filter((item) =>
        isMimeTypeSupportedForProcessing(item.mimetype),
      );

      const unsupportedDocuments = input.filter(
        (item) => !isMimeTypeSupportedForProcessing(item.mimetype),
      );

      if (unsupportedDocuments.length > 0) {
        const unsupportedNames = unsupportedDocuments.map((doc) =>
          doc.file_path.join("/"),
        );

        await supabase
          .from("documents")
          .update({ processing_status: "completed" })
          .in("name", unsupportedNames);
      }

      if (supportedDocuments.length === 0) {
        return;
      }

      // Trigger processing task only for supported documents
      return tasks.batchTrigger<typeof processDocument>(
        "process-document",
        supportedDocuments.map((item) => ({
          payload: {
            file_path: item.file_path,
            mimetype: item.mimetype,
            teamId: teamId!,
          },
        })),
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
