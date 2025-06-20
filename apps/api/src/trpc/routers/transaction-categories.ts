import {
  createManyTransactionCategorySchema,
  createTransactionCategorySchema,
  deleteTransactionCategorySchema,
  getCategoriesSchema,
  updateTransactionCategorySchema,
} from "@api/schemas/transaction-categories";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import {
  createTransactionCategories,
  createTransactionCategory,
  deleteTransactionCategory,
  getCategories,
  updateTransactionCategory,
} from "@midday/db/queries";

export const transactionCategoriesRouter = createTRPCRouter({
  get: protectedProcedure
    .input(getCategoriesSchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      const data = await getCategories(db, {
        teamId: teamId!,
        limit: input?.limit,
      });

      return [
        ...(data ?? []),
        {
          id: "uncategorized",
          name: "Uncategorized",
          color: "#606060",
          slug: "uncategorized",
          description: null,
          system: true,
          taxRate: 0,
          taxType: "unknown",
          parentId: null,
        },
      ];
    }),

  create: protectedProcedure
    .input(createTransactionCategorySchema)
    .mutation(async ({ input, ctx: { db, teamId } }) => {
      return createTransactionCategory(db, {
        teamId: teamId!,
        ...input,
      });
    }),

  createMany: protectedProcedure
    .input(createManyTransactionCategorySchema)
    .mutation(async ({ input, ctx: { db, teamId } }) => {
      return createTransactionCategories(db, {
        teamId: teamId!,
        categories: input,
      });
    }),

  update: protectedProcedure
    .input(updateTransactionCategorySchema)
    .mutation(async ({ input, ctx: { db, teamId } }) => {
      return updateTransactionCategory(db, {
        ...input,
        teamId: teamId!,
      });
    }),

  delete: protectedProcedure
    .input(deleteTransactionCategorySchema)
    .mutation(async ({ input, ctx: { db, teamId } }) => {
      return deleteTransactionCategory(db, {
        id: input.id,
        teamId: teamId!,
      });
    }),
});
