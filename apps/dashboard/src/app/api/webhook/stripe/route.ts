import Stripe from "stripe";

import {
  deletePriceRecord,
  deleteProductRecord,
  manageSubscriptionStatusChange,
  stripe,
  upsertPriceRecord,
  upsertProductRecord,
} from "@midday/stripe";
import { createClient } from "@midday/supabase/client";

/**
 * Set of Stripe webhook event types that this handler processes.
 * @type {Set<string>}
 */
const relevantEvents = new Set([
  "product.created",
  "product.updated",
  "product.deleted",
  "price.created",
  "price.updated",
  "price.deleted",
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "billing_portal.session.created",
  "invoice.upcoming",
  "customer.created",
  "invoice.created"
]);


/**
 * Handles POST requests for Stripe webhook events.
 *
 * This function processes various Stripe events related to products, prices,
 * checkout sessions, and customer subscriptions. It verifies the webhook
 * signature, determines the event type, and performs the appropriate action
 * based on the event.
 *
 * @param {Request} req - The incoming HTTP request object.
 * @returns {Promise<Response>} A promise that resolves to an HTTP response.
 *
 * @throws {Error} If there's an issue with webhook signature verification or event processing.
 *
 * @example
 * // Example usage in a Next.js API route
 * export { POST } from './path/to/this/file';
 */
export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("Stripe-Signature") as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event: Stripe.Event;
  const client = createClient();

  try {
    if (!sig || !webhookSecret)
      return new Response("Webhook secret not found.", { status: 400 });
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.log(`❌ Error message: ${err.message}`);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (relevantEvents.has(event.type)) {
    try {
      switch (event.type) {
        case "product.created":
        case "product.updated":
          await upsertProductRecord(
            event.data.object as Stripe.Product,
            client,
          );
          break;
        case "price.created":
        case "price.updated":
          await upsertPriceRecord(event.data.object as Stripe.Price, client);
          break;
        case "price.deleted":
          await deletePriceRecord(event.data.object as Stripe.Price, client);
          break;
        case "product.deleted":
          await deleteProductRecord(
            event.data.object as Stripe.Product,
            client,
          );
          break;
        case "customer.subscription.created":
        case "customer.subscription.updated":
        case "customer.subscription.deleted":
          const subscription = event.data.object as Stripe.Subscription;
          await manageSubscriptionStatusChange({
            subscriptionId: subscription.id,
            customerId: subscription.customer as string,
            createAction: event.type === "customer.subscription.created",
            client,
          });
          break;
        case "checkout.session.completed":
          const checkoutSession = event.data.object as Stripe.Checkout.Session;
          if (checkoutSession.mode === "subscription") {
            const subscriptionId = checkoutSession.subscription;
            await manageSubscriptionStatusChange({
              subscriptionId: subscriptionId as string,
              customerId: checkoutSession.customer as string,
              createAction: true,
              client,
            });
          }
          break;
        default:
          throw new Error("Unhandled relevant event!");
      }
    } catch (error) {
      console.log(error);
      return new Response(
        "Webhook handler failed. View your Next.js function logs.",
        {
          status: 400,
        },
      );
    }
  } else {
    return new Response(`Unsupported event type: ${event.type}`, {
      status: 400,
    });
  }
  return new Response(JSON.stringify({ received: true }));
}
