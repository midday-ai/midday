import {
  deleteMerchantSchema,
  enrichMerchantSchema,
  getMerchantByIdSchema,
  getMerchantByPortalIdSchema,
  getMerchantDealSummarySchema,
  getMerchantsSchema,
  getPortalDealsSchema,
  toggleMerchantPortalSchema,
  upsertMerchantSchema,
} from "@api/schemas/merchants";
import {
  createTRPCRouter,
  memberProcedure,
  protectedProcedure,
  publicProcedure,
} from "@api/trpc/init";
import {
  clearMerchantEnrichment,
  deleteMerchant,
  getMerchantById,
  getMerchantByPortalId,
  getMerchantDealSummary,
  getMerchantPortalDeals,
  getMerchants,
  getMcaDealStats,
  getMcaDealsByMerchant,
  getMcaPaymentStats,
  getMcaPaymentsByDeal,
  toggleMerchantPortal,
  updateMerchantEnrichmentStatus,
  upsertMerchant,
} from "@midday/db/queries";
import { triggerJob } from "@midday/job-client";
import { TRPCError } from "@trpc/server";
import { z } from "@hono/zod-openapi";

export const merchantsRouter = createTRPCRouter({
  get: protectedProcedure
    .input(getMerchantsSchema.optional())
    .query(async ({ ctx: { teamId, db }, input }) => {
      return getMerchants(db, {
        teamId: teamId!,
        ...input,
      });
    }),

  getById: protectedProcedure
    .input(getMerchantByIdSchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      return getMerchantById(db, {
        id: input.id,
        teamId: teamId!,
      });
    }),

  delete: memberProcedure
    .input(deleteMerchantSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      return deleteMerchant(db, {
        id: input.id,
        teamId: teamId!,
      });
    }),

  upsert: memberProcedure
    .input(upsertMerchantSchema)
    .mutation(async ({ ctx: { db, teamId, session }, input }) => {
      const isNewMerchant = !input.id;

      const merchant = await upsertMerchant(db, {
        ...input,
        teamId: teamId!,
        userId: session.user.id,
      });

      // Auto-trigger enrichment for new merchants with a website
      if (isNewMerchant && merchant?.website && merchant?.id) {
        try {
          // Set status to pending first, then trigger job
          await updateMerchantEnrichmentStatus(db, {
            merchantId: merchant.id,
            status: "pending",
          });

          await triggerJob(
            "enrich-merchant",
            {
              merchantId: merchant.id,
              teamId: teamId!,
            },
            "merchants",
          );
        } catch (error) {
          // Log but don't fail the merchant creation
          console.error("Failed to trigger merchant enrichment:", error);
          // Reset status since job wasn't queued
          await updateMerchantEnrichmentStatus(db, {
            merchantId: merchant.id,
            status: null,
          }).catch(() => {}); // Ignore errors on cleanup
        }
      }

      return merchant;
    }),

  getDealSummary: protectedProcedure
    .input(getMerchantDealSummarySchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      return getMerchantDealSummary(db, {
        merchantId: input.id,
        teamId: teamId!,
      });
    }),

  enrich: memberProcedure
    .input(enrichMerchantSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      const merchant = await getMerchantById(db, {
        id: input.id,
        teamId: teamId!,
      });

      if (!merchant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Merchant not found",
        });
      }

      if (!merchant.website) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Merchant has no website - enrichment requires a website",
        });
      }

      // Set status to pending first, then trigger job
      await updateMerchantEnrichmentStatus(db, {
        merchantId: merchant.id,
        status: "pending",
      });

      await triggerJob(
        "enrich-merchant",
        {
          merchantId: merchant.id,
          teamId: teamId!,
        },
        "merchants",
      );

      return { queued: true };
    }),

  cancelEnrichment: memberProcedure
    .input(enrichMerchantSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      const merchant = await getMerchantById(db, {
        id: input.id,
        teamId: teamId!,
      });

      if (!merchant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Merchant not found",
        });
      }

      // Reset status to null (no enrichment in progress)
      // The job may still complete in background but UI won't show as processing
      await updateMerchantEnrichmentStatus(db, {
        merchantId: merchant.id,
        status: null,
      });

      return { cancelled: true };
    }),

  clearEnrichment: memberProcedure
    .input(enrichMerchantSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      const merchant = await getMerchantById(db, {
        id: input.id,
        teamId: teamId!,
      });

      if (!merchant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Merchant not found",
        });
      }

      await clearMerchantEnrichment(db, {
        merchantId: merchant.id,
        teamId: teamId!,
      });

      return { cleared: true };
    }),

  togglePortal: memberProcedure
    .input(toggleMerchantPortalSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      return toggleMerchantPortal(db, {
        merchantId: input.merchantId,
        teamId: teamId!,
        enabled: input.enabled,
      });
    }),

  getByPortalId: publicProcedure
    .input(getMerchantByPortalIdSchema)
    .query(async ({ ctx: { db }, input }) => {
      const merchant = await getMerchantByPortalId(db, {
        portalId: input.portalId,
      });

      if (!merchant) {
        return null;
      }

      // Get deal summary
      const summary = await getMerchantDealSummary(db, {
        merchantId: merchant.id,
        teamId: merchant.teamId,
      });

      return {
        merchant,
        summary,
      };
    }),

  getPortalDeals: publicProcedure
    .input(getPortalDealsSchema)
    .query(async ({ ctx: { db }, input }) => {
      const merchant = await getMerchantByPortalId(db, {
        portalId: input.portalId,
      });

      if (!merchant) {
        return { data: [], meta: { cursor: null } };
      }

      const result = await getMerchantPortalDeals(db, {
        merchantId: merchant.id,
        teamId: merchant.teamId,
        cursor: input.cursor,
        pageSize: input.pageSize,
      });

      return {
        data: result.data,
        meta: {
          cursor: result.nextCursor,
        },
      };
    }),

  getMcaDeals: protectedProcedure
    .input(z.object({ merchantId: z.string() }))
    .query(async ({ ctx: { db, teamId }, input }) => {
      return getMcaDealsByMerchant(db, {
        merchantId: input.merchantId,
        teamId: teamId!,
      });
    }),

  getMcaDealStats: protectedProcedure
    .input(z.object({ merchantId: z.string() }))
    .query(async ({ ctx: { db, teamId }, input }) => {
      return getMcaDealStats(db, {
        teamId: teamId!,
        merchantId: input.merchantId,
      });
    }),

  getMcaPayments: protectedProcedure
    .input(z.object({ dealId: z.string() }))
    .query(async ({ ctx: { db, teamId }, input }) => {
      return getMcaPaymentsByDeal(db, {
        dealId: input.dealId,
        teamId: teamId!,
      });
    }),

  getMcaPaymentStats: protectedProcedure
    .input(z.object({ dealId: z.string() }))
    .query(async ({ ctx: { db, teamId }, input }) => {
      return getMcaPaymentStats(db, {
        teamId: teamId!,
        dealId: input.dealId,
      });
    }),
});
