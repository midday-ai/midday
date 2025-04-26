import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { isMimeTypeSupportedForProcessing } from "@midday/documents/utils";
import type { processDocument } from "@midday/jobs/tasks/document/process-document";
import { deleteDocument } from "@midday/supabase/mutations";
import { getDocumentQuery, getDocumentsQuery } from "@midday/supabase/queries";
import { share } from "@midday/supabase/storage";
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

  share: protectedProcedure
    .input(z.object({ filePath: z.string(), expireIn: z.number() }))
    .mutation(async ({ input, ctx: { supabase } }) => {
      console.log(input);
      const { data } = await share(supabase, {
        bucket: "vault",
        path: input.filePath,
        expireIn: input.expireIn,
      });

      return data;
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
      console.log(input);
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
});
