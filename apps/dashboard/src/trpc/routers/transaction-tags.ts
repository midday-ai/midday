import {
  createTransactionTag,
  deleteTransactionTag,
} from "@midday/supabase/mutations";
import { z } from "zod";
import { protectedProcedure } from "../init";
import { createTRPCRouter } from "../init";

export const transactionTagsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        transactionId: z.string(),
        tagId: z.string(),
      }),
    )
    .mutation(async ({ ctx: { supabase, teamId }, input }) => {
      const { data } = await createTransactionTag(supabase, {
        teamId,
        transactionId: input.transactionId,
        tagId: input.tagId,
      });

      return data;
    }),

  delete: protectedProcedure
    .input(
      z.object({
        transactionId: z.string(),
        tagId: z.string(),
      }),
    )
    .mutation(async ({ ctx: { supabase }, input }) => {
      const { data } = await deleteTransactionTag(supabase, {
        transactionId: input.transactionId,
        tagId: input.tagId,
      });

      return data;
    }),
});
