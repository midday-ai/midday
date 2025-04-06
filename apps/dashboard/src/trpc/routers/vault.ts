import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { getVaultActivityQuery, getVaultQuery } from "@midday/supabase/queries";
import { z } from "zod";

export const vaultRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx: { supabase, teamId } }) => {
    const { data } = await getVaultQuery(supabase, {
      teamId: teamId!,
    });

    return data;
  }),

  activity: protectedProcedure
    .input(
      z.object({
        pageSize: z.number().optional(),
      }),
    )
    .query(async ({ ctx: { supabase, teamId }, input }) => {
      const { data } = await getVaultActivityQuery(supabase, {
        teamId: teamId!,
        ...input,
      });

      return data;
    }),
});
