import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import {
  getInvoiceById,
  getTeamById,
  updateInvoice,
  updateTeamById,
} from "@midday/db/queries";
import { logger } from "@midday/logger";
import { TRPCError } from "@trpc/server";
import Stripe from "stripe";
import { z } from "zod";

export const invoicePaymentsRouter = createTRPCRouter({
  // Get Stripe Connect status for the current team
  stripeStatus: protectedProcedure.query(async ({ ctx: { db, teamId } }) => {
    if (!teamId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Team not found",
      });
    }

    const team = await getTeamById(db, teamId);

    return {
      connected: !!team?.stripeAccountId,
      status: team?.stripeConnectStatus || null,
      stripeAccountId: team?.stripeAccountId || null,
    };
  }),

  // Get Stripe Connect URL for OAuth flow
  getConnectUrl: protectedProcedure.query(async ({ ctx: { teamId } }) => {
    if (!teamId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Team not found",
      });
    }

    const clientId = process.env.STRIPE_CONNECT_CLIENT_ID;
    if (!clientId) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Stripe Connect is not configured",
      });
    }

    // Return the REST endpoint URL that handles the OAuth flow
    const apiUrl = process.env.MIDDAY_API_URL || "https://api.midday.ai";
    return `${apiUrl}/invoice-payments/connect-stripe`;
  }),

  // Disconnect Stripe account
  disconnectStripe: protectedProcedure.mutation(
    async ({ ctx: { db, teamId } }) => {
      if (!teamId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Team not found",
        });
      }

      const team = await getTeamById(db, teamId);

      if (team?.stripeAccountId) {
        try {
          const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

          // Deauthorize the connected account
          await stripe.oauth.deauthorize({
            client_id: process.env.STRIPE_CONNECT_CLIENT_ID!,
            stripe_user_id: team.stripeAccountId,
          });
        } catch (err) {
          // Log but don't fail
          logger.warn("Failed to deauthorize Stripe account", {
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }

      // Clear Stripe fields from team
      await updateTeamById(db, {
        id: teamId,
        data: {
          stripeAccountId: null,
          stripeConnectStatus: null,
        },
      });

      return { success: true };
    },
  ),

  // Refund a Stripe payment for an invoice
  refundPayment: protectedProcedure
    .input(z.object({ invoiceId: z.string().uuid() }))
    .mutation(async ({ input, ctx: { db, teamId } }) => {
      if (!teamId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Team not found",
        });
      }

      // Get the invoice
      const invoice = await getInvoiceById(db, {
        id: input.invoiceId,
        teamId,
      });

      if (!invoice) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invoice not found",
        });
      }

      // Verify invoice is paid and has a payment intent
      if (invoice.status !== "paid") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invoice is not paid",
        });
      }

      if (!invoice.paymentIntentId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invoice was not paid via Stripe",
        });
      }

      // Get team's Stripe account
      const team = await getTeamById(db, teamId);

      if (!team?.stripeAccountId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Stripe is not connected",
        });
      }

      try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

        // Create refund on the connected account
        const refund = await stripe.refunds.create(
          { payment_intent: invoice.paymentIntentId },
          { stripeAccount: team.stripeAccountId },
        );

        // Update invoice status immediately after Stripe confirms refund
        // The webhook will also fire but will find invoice already updated
        await updateInvoice(db, {
          id: input.invoiceId,
          teamId,
          status: "refunded",
          refundedAt: new Date().toISOString(),
        });

        logger.info("Refund created and invoice updated", {
          invoiceId: input.invoiceId,
          paymentIntentId: invoice.paymentIntentId,
          refundId: refund.id,
          teamId,
        });

        return { success: true };
      } catch (err) {
        logger.error("Failed to create refund", {
          error: err instanceof Error ? err.message : String(err),
          invoiceId: input.invoiceId,
        });

        // Handle specific Stripe errors
        if (err instanceof Stripe.errors.StripeError) {
          if (err.code === "charge_already_refunded") {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "This payment has already been refunded",
            });
          }
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to process refund",
        });
      }
    }),
});
