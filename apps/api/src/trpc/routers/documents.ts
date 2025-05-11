import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { isMimeTypeSupportedForProcessing } from "@midday/documents/utils";
import type { processDocument } from "@midday/jobs/tasks/document/process-document";
import { deleteDocument } from "@midday/supabase/mutations";
import {
  getDocumentQuery,
  getDocumentsQuery,
  getRelatedDocumentsQuery,
} from "@midday/supabase/queries";
import { signedUrl } from "@midday/supabase/storage";
import { tasks } from "@trigger.dev/sdk/v3";
import { z } from "zod";

export const documentsRouter = createTRPCRouter({
  get: protectedProcedure
    .input(
      z.object({
        cursor: z.string().nullable().optional(),
        sort: z.array(z.string(), z.string()).nullable().optional(),
        pageSize: z.number().optional(),
        filter: z
          .object({
            q: z.string().nullable().optional(),
            tags: z.array(z.string()).nullable().optional(),
          })
          .optional(),
      }),
    )
    .query(async ({ input, ctx: { supabase, teamId } }) => {
      return getDocumentsQuery(supabase, {
        teamId: teamId!,
        ...input,
      });
    }),

  getById: protectedProcedure
    .input(
      z.object({
        id: z.string().nullable().optional(),
        filePath: z.string().nullable().optional(),
      }),
    )
    .query(async ({ input, ctx: { supabase, teamId } }) => {
      const { data } = await getDocumentQuery(supabase, {
        id: input.id,
        filePath: input.filePath,
        teamId: teamId!,
      });

      return data;
    }),

  getRelatedDocuments: protectedProcedure
    .input(z.object({ id: z.string(), pageSize: z.number() }))
    .query(async ({ input, ctx: { supabase, teamId } }) => {
      return getRelatedDocumentsQuery(supabase, {
        id: input.id,
        teamId: teamId!,
        pageSize: input.pageSize,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx: { supabase } }) => {
      const { data } = await deleteDocument(supabase, {
        id: input.id,
      });

      return data;
    }),

  processDocument: protectedProcedure
    .input(
      z.array(
        z.object({
          mimetype: z.string(),
          size: z.number(),
          file_path: z.array(z.string()),
        }),
      ),
    )
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
    .input(z.object({ filePath: z.string(), expireIn: z.number() }))
    .mutation(async ({ input, ctx: { supabase } }) => {
      const { data } = await signedUrl(supabase, {
        bucket: "vault",
        path: input.filePath,
        expireIn: input.expireIn,
      });

      return data;
    }),

  signedUrls: protectedProcedure
    .input(z.array(z.string()))
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
