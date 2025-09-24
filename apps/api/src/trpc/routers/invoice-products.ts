import {
  createInvoiceProductSchema,
  deleteInvoiceProductSchema,
  getInvoiceProductSchema,
  saveLineItemAsProductSchema,
  searchInvoiceProductsSchema,
  updateInvoiceProductSchema,
  upsertInvoiceProductSchema,
} from "@api/schemas/invoice";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import {
  createInvoiceProduct,
  deleteInvoiceProduct,
  getInvoiceProductById,
  getPopularInvoiceProducts,
  getRecentInvoiceProducts,
  incrementProductUsage,
  saveLineItemAsProduct,
  searchInvoiceProducts,
  updateInvoiceProduct,
  upsertInvoiceProduct,
} from "@midday/db/queries";

export const invoiceProductsRouter = createTRPCRouter({
  search: protectedProcedure
    .input(searchInvoiceProductsSchema)
    .query(async ({ input, ctx: { db, teamId } }) => {
      return searchInvoiceProducts(db, {
        teamId: teamId!,
        query: input.query,
        limit: input.limit,
      });
    }),

  getById: protectedProcedure
    .input(getInvoiceProductSchema)
    .query(async ({ input, ctx: { db, teamId } }) => {
      return getInvoiceProductById(db, input.id, teamId!);
    }),

  getPopular: protectedProcedure.query(async ({ ctx: { db, teamId } }) => {
    return getPopularInvoiceProducts(db, teamId!, 20);
  }),

  getRecent: protectedProcedure.query(async ({ ctx: { db, teamId } }) => {
    return getRecentInvoiceProducts(db, teamId!, 10);
  }),

  create: protectedProcedure
    .input(createInvoiceProductSchema)
    .mutation(async ({ input, ctx: { db, teamId, session } }) => {
      return createInvoiceProduct(db, {
        ...input,
        teamId: teamId!,
        createdBy: session.user.id,
      });
    }),

  upsert: protectedProcedure
    .input(upsertInvoiceProductSchema)
    .mutation(async ({ input, ctx: { db, teamId, session } }) => {
      return upsertInvoiceProduct(db, {
        ...input,
        teamId: teamId!,
        createdBy: session.user.id,
      });
    }),

  updateProduct: protectedProcedure
    .input(updateInvoiceProductSchema)
    .mutation(async ({ input, ctx: { db, teamId } }) => {
      return updateInvoiceProduct(db, {
        ...input,
        teamId: teamId!,
      });
    }),

  delete: protectedProcedure
    .input(deleteInvoiceProductSchema)
    .mutation(async ({ input, ctx: { db, teamId } }) => {
      return deleteInvoiceProduct(db, input.id, teamId!);
    }),

  incrementUsage: protectedProcedure
    .input(getInvoiceProductSchema)
    .mutation(async ({ input, ctx: { db, teamId } }) => {
      await incrementProductUsage(db, input.id, teamId!);
      return { success: true };
    }),

  saveLineItemAsProduct: protectedProcedure
    .input(saveLineItemAsProductSchema)
    .mutation(async ({ input, ctx: { db, teamId, session } }) => {
      // Convert input to LineItem format
      const lineItem = {
        name: input.name,
        price: input.price || undefined,
        unit: input.unit || undefined,
        productId: input.productId,
      };

      const result = await saveLineItemAsProduct(
        db,
        teamId!,
        session.user.id,
        lineItem,
        input.currency || undefined,
      );

      return {
        product: result.product,
        shouldClearProductId: result.shouldClearProductId,
      };
    }),
});
