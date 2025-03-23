import { z } from "zod";
import { getTransactionsQuery } from "../db/transactions";
import { baseProcedure, createTRPCRouter } from "../init";

export const transactionsRouter = createTRPCRouter({
  getTransactions: baseProcedure
    .input(z.object({ teamId: z.string() }))
    .query(async ({ input, ctx: { supabase } }) => {
      return getTransactionsQuery(supabase, {
        teamId: input.teamId,
        from: 0,
        to: 10,
      });
    }),
});
