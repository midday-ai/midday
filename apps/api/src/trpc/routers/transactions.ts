import { openai } from "@ai-sdk/openai";
import {
  createTransactionSchema,
  deleteTransactionsSchema,
  explainTransactionSchema,
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
import {
  createTRPCRouter,
  memberProcedure,
  protectedProcedure,
} from "@api/trpc/init";
import {
  createTransaction,
  deleteTransactions,
  getSimilarTransactions,
  getTransactionById,
  getTransactions,
  getTransactionsAmountFullRangeData,
  getTransactionsReadyForExportCount,
  moveTransactionToReview,
  searchTransactionMatch,
  updateBankAccount,
  updateTransaction,
  updateTransactions,
} from "@midday/db/queries";
import { formatAmountValue } from "@midday/import";
import { triggerJob } from "@midday/job-client";
import { generateText } from "ai";

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

  deleteMany: memberProcedure
    .input(deleteTransactionsSchema)
    .mutation(async ({ input, ctx: { db, teamId } }) => {
      return deleteTransactions(db, { ids: input, teamId: teamId! });
    }),

  getAmountRange: protectedProcedure.query(async ({ ctx: { db, teamId } }) => {
    return getTransactionsAmountFullRangeData(db, teamId!);
  }),

  getReviewCount: protectedProcedure.query(async ({ ctx: { db, teamId } }) => {
    return getTransactionsReadyForExportCount(db, teamId!);
  }),

  update: memberProcedure
    .input(updateTransactionSchema)
    .mutation(async ({ input, ctx: { db, teamId, session } }) => {
      return updateTransaction(db, {
        ...input,
        userId: session.user.id,
        teamId: teamId!,
      });
    }),

  updateMany: memberProcedure
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

  create: memberProcedure
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

  export: memberProcedure
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

  import: memberProcedure
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

  moveToReview: memberProcedure
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

  explain: protectedProcedure
    .input(explainTransactionSchema)
    .query(async ({ input, ctx: { db, teamId } }) => {
      const transaction = await getTransactionById(db, {
        id: input.id,
        teamId: teamId!,
      });

      if (!transaction) {
        throw new Error("Transaction not found");
      }

      const source = transaction.manual
        ? "manually created"
        : transaction.account
          ? `synced from ${transaction.account.name ?? "bank account"}`
          : "imported via CSV";

      const details = [
        `Name: ${transaction.name}`,
        `Amount: ${transaction.amount} ${transaction.currency}`,
        `Date: ${transaction.date}`,
        transaction.category?.name && `Category: ${transaction.category.name}`,
        transaction.account?.name && `Account: ${transaction.account.name}`,
        transaction.method && `Method: ${transaction.method}`,
        transaction.description && `Description: ${transaction.description}`,
        transaction.counterpartyName &&
          `Counterparty: ${transaction.counterpartyName}`,
        transaction.merchantName &&
          `Merchant: ${transaction.merchantName}`,
        `Source: ${source}`,
        transaction.recurring && `Recurring: ${transaction.frequency ?? "yes"}`,
      ]
        .filter(Boolean)
        .join("\n");

      const { text } = await generateText({
        model: openai("gpt-4o-mini"),
        prompt: `You are a financial assistant for a Merchant Cash Advance (MCA) business. Explain the following transaction in 2-3 concise sentences. Help the user understand what this charge is, why it might have occurred, and any relevant context. Be helpful and specific.\n\nTransaction details:\n${details}`,
        temperature: 0.3,
      });

      return { explanation: text };
    }),
});
