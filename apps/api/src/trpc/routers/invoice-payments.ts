import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { getTeamById } from "@midday/db/queries";
import { teams } from "@midday/db/schema";
import { logger } from "@midday/logger";
import { eq } from "drizzle-orm";
import Stripe from "stripe";
import { z } from "zod";

export const invoicePaymentsRouter = createTRPCRouter({
  // Get Stripe Connect status for the current team
  stripeStatus: protectedProcedure.query(async ({ ctx: { db, teamId } }) => {
    const team = await getTeamById(db, teamId!);

    return {
      connected: !!team?.stripeAccountId,
      status: team?.stripeConnectStatus || null,
      stripeAccountId: team?.stripeAccountId || null,
    };
  }),

  // Get Stripe Connect URL for OAuth flow
  getConnectUrl: protectedProcedure.query(
    async ({ ctx: { teamId, session } }) => {
      const clientId = process.env.STRIPE_CONNECT_CLIENT_ID;
      if (!clientId) {
        throw new Error("Stripe Connect is not configured");
      }

      // Return the REST endpoint URL that handles the OAuth flow
      const apiUrl = process.env.MIDDAY_API_URL || "https://api.midday.ai";
      return `${apiUrl}/invoice-payments/connect-stripe`;
    },
  ),

  // Disconnect Stripe account
  disconnectStripe: protectedProcedure.mutation(
    async ({ ctx: { db, teamId } }) => {
      const team = await getTeamById(db, teamId!);

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
      await db
        .update(teams)
        .set({
          stripeAccountId: null,
          stripeConnectStatus: null,
        })
        .where(eq(teams.id, teamId!));

      return { success: true };
    },
  ),
});
