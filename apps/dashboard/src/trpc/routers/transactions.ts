import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { transactionsSchema } from "@/trpc/routers/schema";
import { getTransactionsQuery } from "@midday/supabase/queries";

export const transactionsRouter = createTRPCRouter({
  get: protectedProcedure
    .input(transactionsSchema)
    .query(async ({ input, ctx: { supabase, teamId } }) => {
      return getTransactionsQuery(supabase, {
        ...input,
        teamId,
      });
    }),

  getAmountRange: protectedProcedure.query(
    async ({ ctx: { supabase, teamId } }) => {
      const { data } = await supabase.rpc(
        "get_transactions_amount_range_data",
        {
          team_id: teamId,
        },
      );

      return data;
    },
  ),
});
