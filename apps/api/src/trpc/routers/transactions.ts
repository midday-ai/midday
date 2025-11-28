import {
  createTransactionSchema,
  deleteTransactionsSchema,
  exportTransactionsSchema,
  getSimilarTransactionsSchema,
  getTransactionByIdSchema,
  getTransactionsSchema,
  searchTransactionMatchSchema,
  updateTransactionSchema,
  updateTransactionsSchema,
} from "@api/schemas/transactions";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import {
  createTransaction,
  deleteTransactions,
  getSimilarTransactions,
  getTransactionById,
  getTransactions,
  getTransactionsAmountFullRangeData,
  searchTransactionMatch,
  updateTransaction,
  updateTransactions,
} from "@midday/db/queries";
import { jobs } from "@midday/job-client";
import type { EmbedTransactionPayload } from "@midday/jobs/schema";
import { tasks } from "@trigger.dev/sdk";

export const transactionsRouter = createTRPCRouter({
  get: protectedProcedure
    .input(getTransactionsSchema)
    .query(async ({ input, ctx: { db, teamId } }) => {
      return getTransactions(db, {
        ...input,
        teamId: teamId!,
      });
    }),

  getById: protectedProcedure
    .input(getTransactionByIdSchema)
    .query(async ({ input, ctx: { db, teamId } }) => {
      return getTransactionById(db, {
        id: input.id,
        teamId: teamId!,
      });
    }),

  deleteMany: protectedProcedure
    .input(deleteTransactionsSchema)
    .mutation(async ({ input, ctx: { db, teamId } }) => {
      return deleteTransactions(db, { ids: input, teamId: teamId! });
    }),

  getAmountRange: protectedProcedure.query(async ({ ctx: { db, teamId } }) => {
    return getTransactionsAmountFullRangeData(db, teamId!);
  }),

  update: protectedProcedure
    .input(updateTransactionSchema)
    .mutation(async ({ input, ctx: { db, teamId, session } }) => {
      return updateTransaction(db, {
        ...input,
        userId: session.user.id,
        teamId: teamId!,
      });
    }),

  updateMany: protectedProcedure
    .input(updateTransactionsSchema)
    .mutation(async ({ input, ctx: { db, teamId, session } }) => {
      return updateTransactions(db, {
        ...input,
        userId: session.user.id,
        teamId: teamId!,
      });
    }),

  getSimilarTransactions: protectedProcedure
    .input(getSimilarTransactionsSchema)
    .query(async ({ input, ctx: { db, teamId } }) => {
      return getSimilarTransactions(db, {
        name: input.name,
        categorySlug: input.categorySlug,
        frequency: input.frequency,
        teamId: teamId!,
        transactionId: input.transactionId,
      });
    }),

  searchTransactionMatch: protectedProcedure
    .input(searchTransactionMatchSchema)
    .query(async ({ input, ctx: { db, teamId } }) => {
      return searchTransactionMatch(db, {
        query: input.query,
        teamId: teamId!,
        inboxId: input.inboxId,
        maxResults: input.maxResults,
        minConfidenceScore: input.minConfidenceScore,
        includeAlreadyMatched: input.includeAlreadyMatched,
      });
    }),

  create: protectedProcedure
    .input(createTransactionSchema)
    .mutation(async ({ input, ctx: { db, teamId } }) => {
      const transaction = await createTransaction(db, {
        ...input,
        teamId: teamId!,
      });

      // Trigger embedding for the newly created manual transaction
      if (transaction?.id) {
        tasks.trigger("embed-transaction", {
          transactionIds: [transaction.id],
          teamId: teamId!,
        } satisfies EmbedTransactionPayload);
      }

      return transaction;
    }),

  export: protectedProcedure
    .input(exportTransactionsSchema)
    .mutation(async ({ input, ctx: { teamId, session } }) => {
      if (!teamId) {
        throw new Error("Team not found");
      }

      const result = await jobs.trigger("export-transactions", {
        teamId,
        userId: session.user.id,
        locale: input.locale,
        transactionIds: input.transactionIds,
        dateFormat: input.dateFormat,
        exportSettings: input.exportSettings,
      });

      return result;
    }),
});
