import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { getInboxQuery, getInboxSearchQuery } from "@midday/supabase/queries";
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
