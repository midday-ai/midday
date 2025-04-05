import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import {
  getBankAccountsCurrenciesQuery,
  getTeamBankAccountsQuery,
} from "@midday/supabase/queries";
import { z } from "zod";

export const bankAccountsRouter = createTRPCRouter({
  get: protectedProcedure
    .input(
      z.object({
        enabled: z.boolean().optional(),
      }),
    )
    .query(async ({ input, ctx: { supabase, teamId } }) => {
      return getTeamBankAccountsQuery(supabase, {
        teamId: teamId!,
        enabled: input.enabled ?? true,
      });
    }),

  currencies: protectedProcedure.query(
    async ({ ctx: { supabase, teamId } }) => {
      return getBankAccountsCurrenciesQuery(supabase, {
        teamId: teamId!,
      });
    },
  ),
});
