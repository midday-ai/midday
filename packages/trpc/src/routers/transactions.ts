import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../init";

export const transactionsRouter = createTRPCRouter({
  getTransactions: protectedProcedure.query(async ({ ctx, supabase }) => {
    return [];
  }),
});
