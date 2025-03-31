import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { getInboxSearchQuery } from "@midday/supabase/queries";
import { z } from "zod";

export const inboxRouter = createTRPCRouter({
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
        teamId,
        q: query,
        limit,
      });
    }),
});
