import {
  createInvoiceProductSchema,
  deleteInvoiceProductSchema,
  getInvoiceProductSchema,
  getInvoiceProductsSchema,
  saveLineItemAsProductSchema,
  updateInvoiceProductSchema,
  upsertInvoiceProductSchema,
} from "@api/schemas/invoice";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import {
  createInvoiceProduct,
  deleteInvoiceProduct,
  getInvoiceProductById,
  getInvoiceProducts,
  incrementProductUsage,
  saveLineItemAsProduct,
  updateInvoiceProduct,
  upsertInvoiceProduct,
} from "@midday/db/queries";
import { TRPCError } from "@trpc/server";

export const invoiceProductsRouter = createTRPCRouter({
  get: protectedProcedure
    .input(getInvoiceProductsSchema)
    .query(async ({ input, ctx: { db, teamId } }) => {
      const {
        sortBy = "popular",
        limit = 50,
        includeInactive = false,
        currency,
      } = input || {};

      return getInvoiceProducts(db, teamId!, {
        sortBy,
        limit,
        includeInactive,
        currency,
      });
    }),

  getById: protectedProcedure
    .input(getInvoiceProductSchema)
    .query(async ({ input, ctx: { db, teamId } }) => {
      return getInvoiceProductById(db, input.id, teamId!);
    }),

  create: protectedProcedure
    .input(createInvoiceProductSchema)
    .mutation(async ({ input, ctx: { db, teamId, session } }) => {
      try {
        return await createInvoiceProduct(db, {
          ...input,
          teamId: teamId!,
          createdBy: session.user.id,
        });
      } catch (_error) {
        throw new TRPCError({
          code: "CONFLICT",
        });
      }
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
      try {
        return await updateInvoiceProduct(db, {
          ...input,
          teamId: teamId!,
        });
      } catch (_error: any) {
        throw new TRPCError({
          code: "CONFLICT",
        });
      }
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
