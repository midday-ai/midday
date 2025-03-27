import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { getTeamBankAccountsQuery } from "@midday/supabase/queries";
import { z } from "zod";

export const bankAccountsRouter = createTRPCRouter({
  getBankAccounts: protectedProcedure
    .input(
      z.object({
        enabled: z.boolean().optional(),
      }),
    )
    .query(async ({ input, ctx: { supabase, teamId } }) => {
      return getTeamBankAccountsQuery(supabase, {
        teamId,
        enabled: input.enabled ?? true,
      });
    }),
});
