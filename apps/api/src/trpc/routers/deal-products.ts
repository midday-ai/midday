import {
  createDealProductSchema,
  deleteDealProductSchema,
  getDealProductSchema,
  getDealProductsSchema,
  saveLineItemAsProductSchema,
  updateDealProductSchema,
  upsertDealProductSchema,
} from "@api/schemas/deal";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import {
  createDealProduct,
  deleteDealProduct,
  getDealProductById,
  getDealProducts,
  incrementProductUsage,
  saveLineItemAsProduct,
  updateDealProduct,
  upsertDealProduct,
} from "@midday/db/queries";
import { TRPCError } from "@trpc/server";

export const dealProductsRouter = createTRPCRouter({
  get: protectedProcedure
    .input(getDealProductsSchema)
    .query(async ({ input, ctx: { db, teamId } }) => {
      const {
        sortBy = "popular",
        limit = 50,
        includeInactive = false,
        currency,
      } = input || {};

      return getDealProducts(db, teamId!, {
        sortBy,
        limit,
        includeInactive,
        currency,
      });
    }),

  getById: protectedProcedure
    .input(getDealProductSchema)
    .query(async ({ input, ctx: { db, teamId } }) => {
      return getDealProductById(db, input.id, teamId!);
    }),

  create: protectedProcedure
    .input(createDealProductSchema)
    .mutation(async ({ input, ctx: { db, teamId, session } }) => {
      try {
        return await createDealProduct(db, {
          ...input,
          teamId: teamId!,
          createdBy: session.user.id,
        });
      } catch (error) {
        throw new TRPCError({
          code: "CONFLICT",
        });
      }
    }),

  upsert: protectedProcedure
    .input(upsertDealProductSchema)
    .mutation(async ({ input, ctx: { db, teamId, session } }) => {
      return upsertDealProduct(db, {
        ...input,
        teamId: teamId!,
        createdBy: session.user.id,
      });
    }),

  updateProduct: protectedProcedure
    .input(updateDealProductSchema)
    .mutation(async ({ input, ctx: { db, teamId } }) => {
      try {
        return await updateDealProduct(db, {
          ...input,
          teamId: teamId!,
        });
      } catch (error: any) {
        throw new TRPCError({
          code: "CONFLICT",
        });
      }
    }),

  delete: protectedProcedure
    .input(deleteDealProductSchema)
    .mutation(async ({ input, ctx: { db, teamId } }) => {
      return deleteDealProduct(db, input.id, teamId!);
    }),

  incrementUsage: protectedProcedure
    .input(getDealProductSchema)
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
