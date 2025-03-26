import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { getTeamBankAccountsQuery } from "@midday/supabase/queries";

export const bankAccountsRouter = createTRPCRouter({
  getBankAccounts: protectedProcedure.query(
    async ({ ctx: { supabase, teamId } }) => {
      return getTeamBankAccountsQuery(supabase, {
        teamId,
        enabled: true,
      });
    },
  ),
});
