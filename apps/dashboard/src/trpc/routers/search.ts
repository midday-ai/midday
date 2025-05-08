import { globalSearchQuery } from "@midday/supabase/queries";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../init";

export const searchRouter = createTRPCRouter({
  global: protectedProcedure
    .input(
      z.object({
        searchTerm: z.string().optional(),
        language: z.string().optional(),
        limit: z.number().default(10),
        itemsPerTableLimit: z.number().default(5),
      }),
    )
    .query(async ({ input, ctx: { supabase, teamId } }) => {
      const results = await globalSearchQuery(supabase, {
        teamId: teamId!,
        ...input,
      });

      return results;
    }),
});
