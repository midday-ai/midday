import { getTransactions } from "@api/db/queries/transactions";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import {
  createTransactionSchema,
  deleteTransactionsSchema,
  getSimilarTransactionsSchema,
  getTransactionByIdSchema,
  getTransactionsSchema,
  searchTransactionMatchSchema,
  updateSimilarTransactionsCategorySchema,
  updateSimilarTransactionsRecurringSchema,
  updateTransactionSchema,
  updateTransactionsSchema,
} from "./schema";

export const transactionsRouter = createTRPCRouter({
  get: protectedProcedure
    .input(getTransactionsSchema)
    .query(async ({ input, ctx: { db, teamId } }) => {
      return getTransactions(db, {
        ...input,
        teamId: teamId!,
      });
    }),

  deleteMany: protectedProcedure
    .input(deleteTransactionsSchema)
    .mutation(async ({ input, ctx: { supabase } }) => {
      // return deleteTransactions(supabase, { ids: input.ids });

      return null;
    }),

  getById: protectedProcedure
    .input(getTransactionByIdSchema)
    .query(async ({ input, ctx: { supabase } }) => {
      // const { data } = await getTransactionQuery(supabase, input.id);

      // return data;

      return null;
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
    .input(updateTransactionSchema)
    .mutation(async ({ input, ctx: { supabase } }) => {
      // const { data } = await updateTransaction(supabase, input);

      // return data;

      return null;
    }),

  updateMany: protectedProcedure
    .input(updateTransactionsSchema)
    .mutation(async ({ input, ctx: { supabase, teamId } }) => {
      // const { data } = await updateTransactions(supabase, {
      //   ...input,
      //   team_id: teamId!,
      // });

      // return data;

      return null;
    }),

  getSimilarTransactions: protectedProcedure
    .input(getSimilarTransactionsSchema)
    .query(async ({ input, ctx: { supabase, teamId } }) => {
      // const { data } = await getSimilarTransactions(supabase, {
      //   name: input.name,
      //   categorySlug: input.categorySlug,
      //   frequency: input.frequency,
      //   teamId: teamId!,
      // });

      // return data;

      return null;
    }),

  updateSimilarTransactionsCategory: protectedProcedure
    .input(updateSimilarTransactionsCategorySchema)
    .mutation(async ({ input, ctx: { supabase, teamId } }) => {
      // const { data } = await updateSimilarTransactionsCategory(supabase, {
      //   ...input,
      //   team_id: teamId!,
      // });

      // return data;

      return null;
    }),

  updateSimilarTransactionsRecurring: protectedProcedure
    .input(updateSimilarTransactionsRecurringSchema)
    .mutation(async ({ input, ctx: { supabase, teamId } }) => {
      // const { data } = await updateSimilarTransactionsRecurring(supabase, {
      //   ...input,
      //   team_id: teamId!,
      // });

      // return data;

      return null;
    }),

  searchTransactionMatch: protectedProcedure
    .input(searchTransactionMatchSchema)
    .query(async ({ input, ctx: { supabase, teamId } }) => {
      // const { data } = await searchTransactionMatchQuery(supabase, {
      //   query: input.query,
      //   teamId: teamId!,
      //   inboxId: input.inboxId,
      //   maxResults: input.maxResults,
      //   minConfidenceScore: input.minConfidenceScore,
      // });

      // return data;

      return null;
    }),

  create: protectedProcedure
    .input(createTransactionSchema)
    .mutation(async ({ input, ctx: { supabase, teamId } }) => {
      // const { data } = await createTransaction(supabase, {
      //   ...input,
      //   teamId: teamId!,
      // });

      // return data;

      return null;
    }),
});
