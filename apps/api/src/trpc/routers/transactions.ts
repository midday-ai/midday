import {
  createTransactionSchema,
  deleteTransactionsSchema,
  exportTransactionsSchema,
  getSimilarTransactionsSchema,
  getTransactionByIdSchema,
  getTransactionsSchema,
  importTransactionsSchema,
  moveToReviewSchema,
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
  getTransactionsReadyForExportCount,
  moveTransactionToReview,
  searchTransactionMatch,
  updateBankAccount,
  updateTransaction,
  updateTransactions,
} from "@midday/db/queries";
import { formatAmountValue } from "@midday/import";
import { triggerJob } from "@midday/job-client";

export const transactionsRouter = createTRPCRouter({
  get: protectedProcedure
    .input(getTransactionsSchema)
    .query(async ({ input, ctx: { db, teamId } }) => {
      return getTransactions(db, {
        ...input,
        exported: input.exported ?? undefined,
        fulfilled: input.fulfilled ?? undefined,
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

  getReviewCount: protectedProcedure.query(async ({ ctx: { db, teamId } }) => {
    return getTransactionsReadyForExportCount(db, teamId!);
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
        await triggerJob(
          "embed-transaction",
          {
            transactionIds: [transaction.id],
            teamId: teamId!,
          },
          "transactions",
        );
      }

      return transaction;
    }),

  export: protectedProcedure
    .input(exportTransactionsSchema)
    .mutation(async ({ input, ctx: { teamId, session } }) => {
      if (!teamId) {
        throw new Error("Team not found");
      }

      return triggerJob(
        "export-transactions",
        {
          teamId,
          userId: session.user.id,
          locale: input.locale,
          transactionIds: input.transactionIds,
          dateFormat: input.dateFormat,
          exportSettings: input.exportSettings,
        },
        "transactions",
      );
    }),

  import: protectedProcedure
    .input(importTransactionsSchema)
    .mutation(async ({ input, ctx: { db, teamId } }) => {
      if (!teamId) {
        throw new Error("Team not found");
      }

      // Update currency for account
      const balance = input.currentBalance
        ? formatAmountValue({ amount: input.currentBalance })
        : null;

      await updateBankAccount(db, {
        id: input.bankAccountId,
        teamId,
        currency: input.currency,
        balance: balance ?? undefined,
      });

      return triggerJob(
        "import-transactions",
        {
          filePath: input.filePath,
          bankAccountId: input.bankAccountId,
          currency: input.currency,
          mappings: input.mappings,
          teamId,
          inverted: input.inverted,
        },
        "transactions",
      );
    }),

  moveToReview: protectedProcedure
    .input(moveToReviewSchema)
    .mutation(async ({ input, ctx: { db, teamId } }) => {
      if (!teamId) {
        throw new Error("Team not found");
      }

      await moveTransactionToReview(db, {
        transactionId: input.transactionId,
        teamId,
      });

      return { success: true };
    }),
});
