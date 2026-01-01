import type { Context } from "@api/rest/types";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { updateInvoice } from "@midday/db/queries";
import { logger } from "@midday/logger";
import { HTTPException } from "hono/http-exception";
import Stripe from "stripe";

const app = new OpenAPIHono<Context>();

const webhookResponseSchema = z.object({
  received: z.boolean(),
});

app.openapi(
  createRoute({
    method: "post",
    path: "/",
    summary: "Stripe webhook handler",
    operationId: "stripeWebhook",
    description:
      "Handles Stripe webhook events for invoice payments. Verifies webhook signature and processes payment events.",
    tags: ["Webhooks"],
    responses: {
      200: {
        description: "Webhook processed successfully",
        content: {
          "application/json": {
            schema: webhookResponseSchema,
          },
        },
      },
      400: {
        description: "Invalid webhook signature or payload",
      },
    },
  }),
  async (c) => {
    const db = c.get("db");
    const signature = c.req.header("stripe-signature");

    if (!signature) {
      throw new HTTPException(400, {
        message: "Missing stripe-signature header",
      });
    }

    const webhookSecret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET;
    if (!webhookSecret) {
      logger.error("STRIPE_CONNECT_WEBHOOK_SECRET not configured");
      throw new HTTPException(500, {
        message: "Webhook secret not configured",
      });
    }

    let event: Stripe.Event;

    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
      const rawBody = await c.req.text();

      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
      logger.error("Stripe webhook signature verification failed", {
        error: err instanceof Error ? err.message : String(err),
      });
      throw new HTTPException(400, { message: "Invalid webhook signature" });
    }

    logger.info("Stripe webhook received", {
      type: event.type,
      id: event.id,
    });

    try {
      switch (event.type) {
        case "payment_intent.succeeded": {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          const invoiceId = paymentIntent.metadata?.invoice_id;
          const teamId = paymentIntent.metadata?.team_id;

          if (!invoiceId || !teamId) {
            logger.warn("Payment intent missing invoice metadata", {
              paymentIntentId: paymentIntent.id,
            });
            break;
          }

          // Update invoice to paid status
          const updatedInvoice = await updateInvoice(db, {
            id: invoiceId,
            teamId,
            status: "paid",
            paidAt: new Date().toISOString(),
          });

          if (updatedInvoice) {
            logger.info("Invoice marked as paid", {
              invoiceId,
              paymentIntentId: paymentIntent.id,
              amount: paymentIntent.amount,
            });
          } else {
            logger.warn(
              "Failed to update invoice - not found or unauthorized",
              {
                invoiceId,
                teamId,
              },
            );
          }

          break;
        }

        case "payment_intent.payment_failed": {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          const invoiceId = paymentIntent.metadata?.invoice_id;

          logger.info("Payment failed for invoice", {
            invoiceId,
            paymentIntentId: paymentIntent.id,
            error: paymentIntent.last_payment_error?.message,
          });

          // Optionally: Send notification to team about failed payment
          // await tasks.trigger("notification", { ... });

          break;
        }

        case "account.updated": {
          // Handle connected account status changes
          const account = event.data.object as Stripe.Account;

          logger.info("Connected account updated", {
            accountId: account.id,
            chargesEnabled: account.charges_enabled,
            payoutsEnabled: account.payouts_enabled,
          });

          // If account capabilities changed, we could update the team's stripeConnectStatus
          // This would require finding the team by stripeAccountId
          // For now, we'll just log it

          break;
        }

        default:
          logger.debug("Unhandled Stripe webhook event type", {
            type: event.type,
          });
      }
    } catch (err) {
      logger.error("Error processing Stripe webhook", {
        error: err instanceof Error ? err.message : String(err),
        eventType: event.type,
        eventId: event.id,
      });
      // Don't throw - we want to return 200 to Stripe to prevent retries
      // for events we partially processed
    }

    return c.json({ received: true });
  },
);

export { app as stripeWebhookRouter };
