import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import {
  createTransaction,
  deleteTransactions,
  updateSimilarTransactionsCategory,
  updateSimilarTransactionsRecurring,
  updateTransaction,
  updateTransactions,
} from "@midday/supabase/mutations";
import {
  getSimilarTransactions,
  getTransactionQuery,
  getTransactionsQuery,
  searchTransactionMatchQuery,
} from "@midday/supabase/queries";
import { z } from "zod";

export const transactionsRouter = createTRPCRouter({
  get: protectedProcedure
    .input(
      z.object({
        cursor: z.string().nullable().optional(),
        sort: z.array(z.string(), z.string()).nullable().optional(),
        pageSize: z.number().optional(),
        filter: z
          .object({
            q: z.string().nullable().optional(),
            categories: z.array(z.string()).nullable().optional(),
            tags: z.array(z.string()).nullable().optional(),
            start: z.string().nullable().optional(),
            end: z.string().nullable().optional(),
            accounts: z.array(z.string()).nullable().optional(),
            assignees: z.array(z.string()).nullable().optional(),
            statuses: z.array(z.string()).nullable().optional(),
            recurring: z.array(z.string()).nullable().optional(),
            attachments: z.enum(["include", "exclude"]).nullable().optional(),
            amount_range: z.array(z.number()).nullable().optional(),
            amount: z.array(z.string()).nullable().optional(),
            type: z.enum(["income", "expense"]).nullable().optional(),
          })
          .optional(),
      }),
    )
    .query(async ({ input, ctx: { supabase, teamId } }) => {
      return getTransactionsQuery(supabase, {
        ...input,
        teamId: teamId!,
      });
    }),

  deleteMany: protectedProcedure
    .input(z.object({ ids: z.array(z.string()) }))
    .mutation(async ({ input, ctx: { supabase } }) => {
      return deleteTransactions(supabase, { ids: input.ids });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx: { supabase } }) => {
      const { data } = await getTransactionQuery(supabase, input.id);

      return data;
    }),

  getAmountRange: protectedProcedure.query(
    async ({ ctx: { supabase, teamId } }) => {
      const { data } = await supabase.rpc(
        "get_transactions_amount_full_range_data",
        {
          team_id: teamId!,
        },
      );

      return data;
    },
  ),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        category_slug: z.string().nullable().optional(),
        status: z
          .enum(["pending", "archived", "completed", "posted", "excluded"])
          .nullable()
          .optional(),
        internal: z.boolean().optional(),
        recurring: z.boolean().optional(),
        frequency: z.string().nullable().optional(),
        note: z.string().nullable().optional(),
        assigned_id: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ input, ctx: { supabase } }) => {
      const { data } = await updateTransaction(supabase, input);

      return data;
    }),

  updateMany: protectedProcedure
    .input(
      z.object({
        ids: z.array(z.string()),
        category_slug: z.string().nullable().optional(),
        status: z
          .enum(["pending", "archived", "completed", "posted", "excluded"])
          .nullable()
          .optional(),
        frequency: z
          .enum(["weekly", "monthly", "annually", "irregular"])
          .nullable()
          .optional(),
        internal: z.boolean().optional(),
        note: z.string().nullable().optional(),
        assigned_id: z.string().nullable().optional(),
        recurring: z.boolean().optional(),
        tag_id: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ input, ctx: { supabase, teamId } }) => {
      const { data } = await updateTransactions(supabase, {
        ...input,
        team_id: teamId!,
      });

      return data;
    }),

  getSimilarTransactions: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        categorySlug: z.string().optional(),
        frequency: z
          .enum(["weekly", "monthly", "annually", "irregular"])
          .optional(),
      }),
    )
    .query(async ({ input, ctx: { supabase, teamId } }) => {
      const { data } = await getSimilarTransactions(supabase, {
        name: input.name,
        categorySlug: input.categorySlug,
        frequency: input.frequency,
        teamId: teamId!,
      });

      return data;
    }),

  updateSimilarTransactionsCategory: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        categorySlug: z.string().optional(),
        frequency: z
          .enum(["weekly", "monthly", "annually", "irregular"])
          .optional(),
        recurring: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input, ctx: { supabase, teamId } }) => {
      const { data } = await updateSimilarTransactionsCategory(supabase, {
        ...input,
        team_id: teamId!,
      });

      return data;
    }),

  updateSimilarTransactionsRecurring: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx: { supabase, teamId } }) => {
      const { data } = await updateSimilarTransactionsRecurring(supabase, {
        id: input.id,
        team_id: teamId!,
      });

      return data;
    }),

  searchTransactionMatch: protectedProcedure
    .input(
      z.object({
        query: z.string().optional(),
        inboxId: z.string().uuid().optional(),
        maxResults: z.number().optional(),
        minConfidenceScore: z.number().optional(),
      }),
    )
    .query(async ({ input, ctx: { supabase, teamId } }) => {
      const { data } = await searchTransactionMatchQuery(supabase, {
        query: input.query,
        teamId: teamId!,
        inboxId: input.inboxId,
        maxResults: input.maxResults,
        minConfidenceScore: input.minConfidenceScore,
      });

      return data;
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        amount: z.number(),
        currency: z.string(),
        date: z.string(),
        bank_account_id: z.string(),
        assigned_id: z.string().optional(),
        category_slug: z.string().optional(),
        note: z.string().optional(),
        internal: z.boolean().optional(),
        attachments: z
          .array(
            z.object({
              path: z.array(z.string()),
              name: z.string(),
              size: z.number(),
              type: z.string(),
            }),
          )
          .optional(),
      }),
    )
    .mutation(async ({ input, ctx: { supabase, teamId } }) => {
      const { data } = await createTransaction(supabase, {
        ...input,
        teamId: teamId!,
      });

      return data;
    }),
});
