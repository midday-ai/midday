import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import {
  createTransactionCategories,
  deleteTransactionCategory,
  updateTransactionCategory,
} from "@midday/supabase/mutations";
import { getCategoriesQuery } from "@midday/supabase/queries";
import { z } from "zod";

export const transactionCategoriesRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx: { supabase, teamId } }) => {
    const { data } = await getCategoriesQuery(supabase, {
      teamId,
    });

    return data;
  }),

  createMany: protectedProcedure
    .input(
      z.array(
        z.object({
          name: z.string(),
          description: z.string().optional(),
          color: z.string().optional(),
          vat: z.number().optional(),
        }),
      ),
    )
    .mutation(async ({ input, ctx: { supabase, teamId } }) => {
      return createTransactionCategories(supabase, {
        teamId,
        categories: input,
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        color: z.string().nullable(),
        description: z.string().nullable(),
        vat: z.number().nullable(),
      }),
    )
    .mutation(async ({ input, ctx: { supabase } }) => {
      return updateTransactionCategory(supabase, input);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx: { supabase } }) => {
      return deleteTransactionCategory(supabase, input.id);
    }),
});
