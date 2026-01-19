import {
  createCheckoutSchema,
  getBillingOrdersSchema,
} from "@api/schemas/billing";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { getTeamById, updateTeamById } from "@midday/db/queries";
import { getStripePriceId, STRIPE_PRICES } from "@midday/plans";
import { z } from "zod";
import Stripe from "stripe";

// Initialize Stripe client
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const billingRouter = createTRPCRouter({
  createCheckout: protectedProcedure
    .input(createCheckoutSchema)
    .mutation(async ({ input, ctx: { db, session, teamId } }) => {
      const { plan } = input;

      // Get team data
      const team = await getTeamById(db, teamId!);

      if (!team) {
        throw new Error("Team not found");
      }

      // Get Stripe price ID for the selected plan
      const priceId = getStripePriceId(plan);

      if (!priceId) {
        throw new Error("Invalid plan");
      }

      // Get or create Stripe customer
      let customerId = team.stripeCustomerId;

      if (!customerId) {
        // Create a new Stripe customer
        const customer = await stripe.customers.create({
          email: session.user.email ?? undefined,
          name: team.name ?? undefined,
          metadata: {
            teamId: team.id,
          },
        });

        customerId = customer.id;

        // Save the customer ID to the team
        await updateTeamById(db, {
          id: team.id,
          data: {
            stripeCustomerId: customerId,
          },
        });
      }

      // Determine success and cancel URLs
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.abacus.com";
      const successUrl = `${baseUrl}/settings/billing?success=true`;
      const cancelUrl = `${baseUrl}/settings/billing?canceled=true`;

      // Create Stripe Checkout Session
      const checkoutSession = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: "subscription",
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        subscription_data: {
          metadata: {
            teamId: team.id,
          },
        },
        metadata: {
          teamId: team.id,
          plan,
        },
        // Allow promotion codes for discounts
        allow_promotion_codes: true,
        // Collect billing address for tax purposes
        billing_address_collection: "auto",
        // Configure automatic tax if enabled
        automatic_tax: { enabled: false },
      });

      if (!checkoutSession.url) {
        throw new Error("Failed to create checkout session");
      }

      return { url: checkoutSession.url };
    }),

  orders: protectedProcedure
    .input(getBillingOrdersSchema)
    .query(async ({ input, ctx: { db, teamId } }) => {
      try {
        // Get team data to find Stripe customer ID
        const team = await getTeamById(db, teamId!);

        if (!team?.stripeCustomerId) {
          return {
            data: [],
            meta: {
              hasNextPage: false,
              cursor: undefined,
            },
          };
        }

        // Fetch invoices from Stripe
        const invoices = await stripe.invoices.list({
          customer: team.stripeCustomerId,
          limit: input.pageSize,
          starting_after: input.cursor || undefined,
        });

        return {
          data: invoices.data.map((invoice) => ({
            id: invoice.id,
            createdAt: new Date(invoice.created * 1000).toISOString(),
            amount: {
              amount: invoice.amount_paid,
              currency: invoice.currency.toUpperCase(),
            },
            status: invoice.status,
            product: {
              name: invoice.lines.data[0]?.description || "Subscription",
            },
            invoiceId: invoice.id,
          })),
          meta: {
            hasNextPage: invoices.has_more,
            cursor: invoices.data.length > 0
              ? invoices.data[invoices.data.length - 1]?.id
              : undefined,
          },
        };
      } catch {
        return {
          data: [],
          meta: {
            hasNextPage: false,
            cursor: undefined,
          },
        };
      }
    }),

  getInvoice: protectedProcedure
    .input(z.string())
    .mutation(async ({ input: invoiceId, ctx: { db, teamId } }) => {
      try {
        // Get team data to verify ownership
        const team = await getTeamById(db, teamId!);

        if (!team?.stripeCustomerId) {
          throw new Error("No billing account found");
        }

        // Fetch the invoice from Stripe
        const invoice = await stripe.invoices.retrieve(invoiceId);

        // Verify the invoice belongs to the team's customer
        if (invoice.customer !== team.stripeCustomerId) {
          throw new Error("Invoice not found or not authorized");
        }

        if (invoice.invoice_pdf) {
          return {
            status: "ready",
            downloadUrl: invoice.invoice_pdf,
          };
        }

        return {
          status: "generating",
        };
      } catch (error) {
        console.error("Failed to get invoice download URL:", error);
        throw new Error(
          error instanceof Error ? error.message : "Failed to download invoice",
        );
      }
    }),

  checkInvoiceStatus: protectedProcedure
    .input(z.string())
    .query(async ({ input: invoiceId, ctx: { db, teamId } }) => {
      try {
        // Get team data to verify ownership
        const team = await getTeamById(db, teamId!);

        if (!team?.stripeCustomerId) {
          return {
            status: "not_generated",
          };
        }

        // Fetch the invoice from Stripe
        const invoice = await stripe.invoices.retrieve(invoiceId);

        // Verify the invoice belongs to the team's customer
        if (invoice.customer !== team.stripeCustomerId) {
          return {
            status: "not_generated",
          };
        }

        if (invoice.invoice_pdf) {
          return {
            status: "ready",
            downloadUrl: invoice.invoice_pdf,
          };
        }

        return {
          status: "generating",
        };
      } catch (error) {
        console.error("Failed to check invoice status:", error);
        throw new Error(
          error instanceof Error
            ? error.message
            : "Failed to check invoice status",
        );
      }
    }),

  getPortalUrl: protectedProcedure.mutation(async ({ ctx: { db, teamId } }) => {
    // Get team data
    const team = await getTeamById(db, teamId!);

    if (!team) {
      throw new Error("Team not found");
    }

    if (!team.stripeCustomerId) {
      throw new Error("No billing account found. Please subscribe to a plan first.");
    }

    // Determine return URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.abacus.com";
    const returnUrl = `${baseUrl}/settings/billing`;

    // Create Stripe Customer Portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: team.stripeCustomerId,
      return_url: returnUrl,
    });

    return { url: portalSession.url };
  }),

  // Get current subscription details
  getSubscription: protectedProcedure.query(async ({ ctx: { db, teamId } }) => {
    const team = await getTeamById(db, teamId!);

    if (!team?.stripeSubscriptionId) {
      return null;
    }

    try {
      const subscription = await stripe.subscriptions.retrieve(
        team.stripeSubscriptionId,
      );

      const priceId = subscription.items.data[0]?.price.id;
      const planConfig = Object.values(STRIPE_PRICES).find(
        (p) => p.priceId === priceId,
      );

      return {
        id: subscription.id,
        status: subscription.status,
        plan: planConfig?.key ?? null,
        currentPeriodEnd: new Date(
          subscription.current_period_end * 1000,
        ).toISOString(),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      };
    } catch {
      return null;
    }
  }),
});
