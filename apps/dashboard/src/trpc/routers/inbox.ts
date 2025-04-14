import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { getInboxQuery, getInboxSearchQuery } from "@midday/supabase/queries";
import { tasks } from "@trigger.dev/sdk/v3";
import type { processAttachment } from "jobs/tasks/inbox/process-attachment";
import { z } from "zod";

export const inboxRouter = createTRPCRouter({
  get: protectedProcedure
    .input(
      z.object({
        cursor: z.string().nullable().optional(),
        order: z.string().nullable().optional(),
        pageSize: z.number().optional(),
        filter: z
          .object({
            q: z.string().nullable().optional(),
            done: z.boolean().optional(),
          })
          .optional(),
      }),
    )
    .query(async ({ ctx: { supabase, teamId }, input }) => {
      return getInboxQuery(supabase, {
        teamId: teamId!,
        ...input,
      });
    }),

  processAttachments: protectedProcedure
    .input(
      z.array(
        z.object({
          mimetype: z.string(),
          size: z.number(),
          file_path: z.array(z.string()),
        }),
      ),
    )
    .mutation(async ({ ctx: { teamId }, input }) => {
      return tasks.batchTrigger<typeof processAttachment>(
        "process-attachment",
        input.map((item) => ({
          payload: {
            file_path: item.file_path,
            mimetype: item.mimetype,
            size: item.size,
            teamId: teamId!,
          },
        })),
      );
    }),

  search: protectedProcedure
    .input(
      z.object({
        query: z.string(),
        limit: z.number().optional(),
      }),
    )
    .query(async ({ ctx: { supabase, teamId }, input }) => {
      const { query, limit = 10 } = input;

      return getInboxSearchQuery(supabase, {
        teamId: teamId!,
        q: query,
        limit,
      });
    }),
});
