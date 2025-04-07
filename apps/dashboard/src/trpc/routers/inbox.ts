import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { getInboxQuery, getInboxSearchQuery } from "@midday/supabase/queries";
import { z } from "zod";

export const inboxRouter = createTRPCRouter({
  get: protectedProcedure
    .input(
      z.object({
        from: z.number().optional(),
        to: z.number().optional(),
        done: z.boolean().optional(),
        todo: z.boolean().optional(),
        ascending: z.boolean().optional(),
        searchQuery: z.string().optional(),
      }),
    )
    .query(async ({ ctx: { supabase, teamId }, input }) => {
      const { data } = await getInboxQuery(supabase, {
        teamId: teamId!,
        ...input,
      });

      return data;
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
