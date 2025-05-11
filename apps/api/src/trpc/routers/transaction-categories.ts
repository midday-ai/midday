import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import {
  createTransactionCategories,
  createTransactionCategory,
  deleteTransactionCategory,
  updateTransactionCategory,
} from "@midday/supabase/mutations";
import { getCategoriesQuery } from "@midday/supabase/queries";
import { z } from "zod";

export const transactionCategoriesRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx: { supabase, teamId } }) => {
    const { data } = await getCategoriesQuery(supabase, {
      teamId: teamId!,
    });

    return [
      ...(data ?? []),
      {
        id: "uncategorized",
        name: "Uncategorized",
        color: "#606060",
        slug: "uncategorized",
      },
    ];
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        color: z.string().optional(),
        description: z.string().optional(),
        vat: z.number().optional(),
      }),
    )
    .mutation(async ({ input, ctx: { supabase, teamId } }) => {
      const { data } = await createTransactionCategory(supabase, {
        teamId: teamId!,
        ...input,
      });

      return data;
    }),

  createMany: protectedProcedure
    .input(
      z.array(
        z.object({
          name: z.string(),
          color: z.string().optional(),
          description: z.string().optional(),
          vat: z.number().optional(),
        }),
      ),
    )
    .mutation(async ({ input, ctx: { supabase, teamId } }) => {
      const { data } = await createTransactionCategories(supabase, {
        teamId: teamId!,
        categories: input,
      });

      return data;
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
      const { data } = await updateTransactionCategory(supabase, input);

      return data;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx: { supabase } }) => {
      const { data } = await deleteTransactionCategory(supabase, input.id);

      return data;
    }),
});
