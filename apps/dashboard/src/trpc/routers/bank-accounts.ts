import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { deleteBankAccount } from "@midday/supabase/mutations";
import {
  getBankAccountsBalancesQuery,
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

  balances: protectedProcedure.query(async ({ ctx: { supabase, teamId } }) => {
    const { data } = await getBankAccountsBalancesQuery(supabase, teamId!);

    return data;
  }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx: { supabase } }) => {
      const { data } = await deleteBankAccount(supabase, input.id);

      return data;
    }),
});
