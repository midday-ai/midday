import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { getVaultActivityQuery } from "@midday/supabase/queries";
import { z } from "zod";

export const vaultRouter = createTRPCRouter({
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
