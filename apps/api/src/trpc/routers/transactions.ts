import {
  createTransaction,
  deleteTransactions,
  getSimilarTransactions,
  getTransactionById,
  getTransactions,
  getTransactionsAmountFullRangeData,
  searchTransactionMatch,
  updateSimilarTransactionsCategory,
  updateSimilarTransactionsRecurring,
  updateTransaction,
  updateTransactions,
} from "@api/db/queries/transactions";
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
} from "@api/schemas/transactions";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";

export const transactionsRouter = createTRPCRouter({
  get: protectedProcedure
    .input(getTransactionsSchema.camel)
    .query(async ({ input, ctx: { db, teamId } }) => {
      return getTransactions(db, {
        ...input,
        teamId: teamId!,
      });
    }),

  getById: protectedProcedure
    .input(getTransactionByIdSchema.camel)
    .query(async ({ input, ctx: { db } }) => {
      return getTransactionById(db, input.id);
    }),

  deleteMany: protectedProcedure
    .input(deleteTransactionsSchema.camel)
    .mutation(async ({ input, ctx: { db } }) => {
      return deleteTransactions(db, { ids: input.ids });
    }),

  getAmountRange: protectedProcedure.query(async ({ ctx: { db, teamId } }) => {
    return getTransactionsAmountFullRangeData(db, teamId!);
  }),

  update: protectedProcedure
    .input(updateTransactionSchema.camel)
    .mutation(async ({ input, ctx: { db } }) => {
      return updateTransaction(db, input);
    }),

  updateMany: protectedProcedure
    .input(updateTransactionsSchema.camel)
    .mutation(async ({ input, ctx: { db, teamId } }) => {
      return updateTransactions(db, {
        ...input,
        teamId: teamId!,
      });
    }),

  getSimilarTransactions: protectedProcedure
    .input(getSimilarTransactionsSchema.camel)
    .query(async ({ input, ctx: { db, teamId } }) => {
      return getSimilarTransactions(db, {
        name: input.name,
        categorySlug: input.categorySlug,
        frequency: input.frequency,
        teamId: teamId!,
      });
    }),

  updateSimilarTransactionsCategory: protectedProcedure
    .input(updateSimilarTransactionsCategorySchema.camel)
    .mutation(async ({ input, ctx: { db, teamId } }) => {
      return updateSimilarTransactionsCategory(db, {
        ...input,
        teamId: teamId!,
      });
    }),

  updateSimilarTransactionsRecurring: protectedProcedure
    .input(updateSimilarTransactionsRecurringSchema.camel)
    .mutation(async ({ input, ctx: { db, teamId } }) => {
      return updateSimilarTransactionsRecurring(db, {
        ...input,
        team_id: teamId!,
      });
    }),

  searchTransactionMatch: protectedProcedure
    .input(searchTransactionMatchSchema.camel)
    .query(async ({ input, ctx: { db, teamId } }) => {
      return searchTransactionMatch(db, {
        query: input.query,
        teamId: teamId!,
        inboxId: input.inboxId,
        maxResults: input.maxResults,
        minConfidenceScore: input.minConfidenceScore,
      });
    }),

  create: protectedProcedure
    .input(createTransactionSchema.camel)
    .mutation(async ({ input, ctx: { db, teamId } }) => {
      return createTransaction(db, {
        ...input,
        teamId: teamId!,
      });
    }),
});
