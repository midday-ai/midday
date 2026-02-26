import type { Context } from "@api/rest/types";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import {
  getDealById,
  getDealByPaymentIntentId,
  getTeamByStripeAccountId,
  getTeamByStripeCustomerId,
  updateDeal,
  updateTeamById,
} from "@midday/db/queries";
import { getPlanByStripePriceId } from "@midday/plans";
import { triggerJob } from "@midday/job-client";
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
      "Handles Stripe webhook events for subscription billing and deal payments. Verifies webhook signature and processes payment and subscription events.",
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

    // Try subscription webhook secret first, fall back to connect webhook secret
    const webhookSecret =
      process.env.STRIPE_WEBHOOK_SECRET ||
      process.env.STRIPE_CONNECT_WEBHOOK_SECRET;

    if (!webhookSecret) {
      logger.error("STRIPE_WEBHOOK_SECRET not configured");
      throw new HTTPException(500, {
        message: "Webhook secret not configured",
      });
    }

    let event: Stripe.Event;

    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
      const rawBody = await c.req.text();

      event = await stripe.webhooks.constructEventAsync(
        rawBody,
        signature,
        webhookSecret,
      );
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
        // ==========================================
        // SUBSCRIPTION BILLING EVENTS
        // ==========================================

        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;

          // Only handle subscription checkouts
          if (session.mode !== "subscription") {
            logger.debug("Ignoring non-subscription checkout session", {
              sessionId: session.id,
              mode: session.mode,
            });
            break;
          }

          const teamId = session.metadata?.teamId;
          const customerId = session.customer as string;
          const subscriptionId = session.subscription as string;

          if (!teamId) {
            logger.warn("Checkout session missing teamId metadata", {
              sessionId: session.id,
            });
            break;
          }

          // Fetch subscription to get price details
          const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const priceId = subscription.items.data[0]?.price.id;
          const plan = priceId ? getPlanByStripePriceId(priceId) : null;

          if (!plan) {
            logger.warn("Could not determine plan from subscription", {
              subscriptionId,
              priceId,
            });
            break;
          }

          // Update team with subscription details and plan
          await updateTeamById(db, {
            id: teamId,
            data: {
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId,
              stripePriceId: priceId,
              plan: plan,
              subscriptionStatus: "active",
              canceledAt: null,
            },
          });

          logger.info("Team subscription activated via checkout", {
            teamId,
            plan,
            subscriptionId,
          });

          break;
        }

        case "customer.subscription.updated": {
          const subscription = event.data.object as Stripe.Subscription;
          const customerId = subscription.customer as string;
          const priceId = subscription.items.data[0]?.price.id;

          // Find team by Stripe customer ID
          const team = await getTeamByStripeCustomerId(db, customerId);

          if (!team) {
            logger.warn("No team found for Stripe customer", {
              customerId,
              subscriptionId: subscription.id,
            });
            break;
          }

          const plan = priceId ? getPlanByStripePriceId(priceId) : null;

          // Determine subscription status
          let subscriptionStatus: "active" | "past_due" | null = null;
          if (subscription.status === "active" || subscription.status === "trialing") {
            subscriptionStatus = "active";
          } else if (subscription.status === "past_due") {
            subscriptionStatus = "past_due";
          }

          // Check if subscription is canceled
          const isCanceled = subscription.cancel_at_period_end ||
            subscription.status === "canceled";

          await updateTeamById(db, {
            id: team.id,
            data: {
              stripeSubscriptionId: subscription.id,
              stripePriceId: priceId,
              plan: plan ?? team.plan,
              subscriptionStatus,
              canceledAt: isCanceled ? new Date().toISOString() : null,
            },
          });

          logger.info("Team subscription updated", {
            teamId: team.id,
            plan,
            status: subscription.status,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          });

          break;
        }

        case "customer.subscription.deleted": {
          const subscription = event.data.object as Stripe.Subscription;
          const customerId = subscription.customer as string;

          // Find team by Stripe customer ID
          const team = await getTeamByStripeCustomerId(db, customerId);

          if (!team) {
            logger.warn("No team found for Stripe customer on deletion", {
              customerId,
              subscriptionId: subscription.id,
            });
            break;
          }

          // Downgrade team to trial when subscription is deleted
          await updateTeamById(db, {
            id: team.id,
            data: {
              stripeSubscriptionId: null,
              stripePriceId: null,
              plan: "trial",
              subscriptionStatus: null,
              canceledAt: new Date().toISOString(),
            },
          });

          logger.info("Team subscription deleted, downgraded to trial", {
            teamId: team.id,
            subscriptionId: subscription.id,
          });

          break;
        }

        case "invoice.payment_failed": {
          const invoice = event.data.object as Stripe.Invoice;
          const customerId = invoice.customer as string;
          const subscriptionId = invoice.subscription as string;

          // Find team by Stripe customer ID
          const team = await getTeamByStripeCustomerId(db, customerId);

          if (!team) {
            logger.warn("No team found for failed invoice payment", {
              customerId,
              invoiceId: invoice.id,
            });
            break;
          }

          // Mark subscription as past_due but don't revoke access yet
          // Stripe will continue to retry payments
          await updateTeamById(db, {
            id: team.id,
            data: {
              subscriptionStatus: "past_due",
            },
          });

          logger.info("Team subscription marked as past_due due to failed payment", {
            teamId: team.id,
            invoiceId: invoice.id,
            subscriptionId,
          });

          // TODO: Optionally trigger notification to team about failed payment

          break;
        }

        case "invoice.paid": {
          const invoice = event.data.object as Stripe.Invoice;
          const customerId = invoice.customer as string;

          // Find team by Stripe customer ID
          const team = await getTeamByStripeCustomerId(db, customerId);

          if (!team) {
            // This might be a non-subscription invoice or a new customer
            logger.debug("No team found for paid invoice", {
              customerId,
              invoiceId: invoice.id,
            });
            break;
          }

          // Ensure subscription is marked as active after successful payment
          if (team.subscriptionStatus === "past_due") {
            await updateTeamById(db, {
              id: team.id,
              data: {
                subscriptionStatus: "active",
              },
            });

            logger.info("Team subscription restored to active after payment", {
              teamId: team.id,
              invoiceId: invoice.id,
            });
          }

          break;
        }

        // ==========================================
        // DEAL PAYMENT EVENTS (Stripe Connect)
        // ==========================================

        case "payment_intent.succeeded": {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          const dealId = paymentIntent.metadata?.invoice_id;
          const teamId = paymentIntent.metadata?.team_id;

          if (!dealId || !teamId) {
            logger.warn("Payment intent missing deal metadata", {
              paymentIntentId: paymentIntent.id,
            });
            break;
          }

          const paidAt = new Date().toISOString();

          // Update deal to paid status
          const updatedDeal = await updateDeal(db, {
            id: dealId,
            teamId,
            status: "paid",
            paidAt,
            paymentIntentId: paymentIntent.id,
          });

          if (updatedDeal) {
            logger.info("Deal marked as paid", {
              dealId,
              paymentIntentId: paymentIntent.id,
              amount: paymentIntent.amount,
            });

            // Fetch full deal details for notification
            const deal = await getDealById(db, { id: dealId });

            if (deal) {
              // Trigger notification job
              await triggerJob(
                "deal-notification",
                {
                  type: "paid",
                  dealId,
                  dealNumber: deal.dealNumber || "",
                  teamId,
                  merchantName: deal.merchantName || "",
                  paidAt,
                },
                "deals",
              );

              logger.info("Deal paid notification triggered", {
                dealId,
                dealNumber: deal.dealNumber,
              });
            }
          } else {
            logger.warn(
              "Failed to update deal - not found or unauthorized",
              {
                dealId,
                teamId,
              },
            );
          }

          break;
        }

        case "payment_intent.payment_failed": {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          const dealId = paymentIntent.metadata?.invoice_id;

          logger.info("Payment failed for deal", {
            dealId,
            paymentIntentId: paymentIntent.id,
            error: paymentIntent.last_payment_error?.message,
          });

          // Optionally: Send notification to team about failed payment
          // await tasks.trigger("notification", { ... });

          break;
        }

        case "charge.refunded": {
          const charge = event.data.object as Stripe.Charge;
          const paymentIntentId = charge.payment_intent as string;

          if (!paymentIntentId) {
            logger.warn("Refunded charge missing payment_intent", {
              chargeId: charge.id,
            });
            break;
          }

          // Find the deal by payment intent ID
          const deal = await getDealByPaymentIntentId(
            db,
            paymentIntentId,
          );

          if (!deal) {
            logger.warn("No deal found for refunded payment intent", {
              paymentIntentId,
              chargeId: charge.id,
            });
            break;
          }

          const refundedAt = new Date().toISOString();

          // Update deal: set status to refunded, keep payment history, set refundedAt
          const updatedDeal = await updateDeal(db, {
            id: deal.id,
            teamId: deal.teamId,
            status: "refunded",
            refundedAt,
          });

          if (updatedDeal) {
            logger.info("Deal marked as refunded", {
              dealId: deal.id,
              dealNumber: deal.dealNumber,
              paymentIntentId,
            });

            // Trigger refund notification job
            await triggerJob(
              "deal-notification",
              {
                type: "refunded",
                dealId: deal.id,
                dealNumber: deal.dealNumber || "",
                teamId: deal.teamId,
                merchantName: deal.merchantName || "",
                refundedAt,
              },
              "deals",
            );

            logger.info("Deal refund notification triggered", {
              dealId: deal.id,
              dealNumber: deal.dealNumber,
            });
          }

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

          // Find the team associated with this Stripe account
          const team = await getTeamByStripeAccountId(db, account.id);

          if (team) {
            // Determine new status based on account capabilities
            let newStatus: string;
            if (account.charges_enabled && account.payouts_enabled) {
              newStatus = "connected";
            } else if (account.charges_enabled) {
              // Can accept charges but payouts restricted
              newStatus = "restricted";
            } else {
              // Cannot accept charges - payments will fail
              newStatus = "disabled";
            }

            // Only update if status changed
            if (team.stripeConnectStatus !== newStatus) {
              await updateTeamById(db, {
                id: team.id,
                data: {
                  stripeConnectStatus: newStatus,
                },
              });

              logger.info("Team Stripe status updated", {
                teamId: team.id,
                previousStatus: team.stripeConnectStatus,
                newStatus,
                accountId: account.id,
              });
            }
          } else {
            logger.warn("No team found for Stripe account", {
              accountId: account.id,
            });
          }

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
