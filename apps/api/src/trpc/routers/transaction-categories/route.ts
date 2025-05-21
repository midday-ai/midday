import {
  createTransactionCategories,
  createTransactionCategory,
  deleteTransactionCategory,
  getCategories,
  updateTransactionCategory,
} from "@api/db/queries/transaction-categories";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import {
  createManyTransactionCategorySchema,
  createTransactionCategorySchema,
  deleteTransactionCategorySchema,
  getCategoriesSchema,
  updateTransactionCategorySchema,
} from "./schema";

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
          vat: null,
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
    .mutation(async ({ input, ctx: { db } }) => {
      return updateTransactionCategory(db, input);
    }),

  delete: protectedProcedure
    .input(deleteTransactionCategorySchema)
    .mutation(async ({ input, ctx: { db } }) => {
      return deleteTransactionCategory(db, input.id);
    }),
});
