import type { Context } from "@api/rest/types";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { updateTeamById } from "@midday/db/queries";
import { logger } from "@midday/logger";
import { getPlanByProductId } from "@midday/plans";
import {
  validateEvent,
  WebhookVerificationError,
} from "@polar-sh/sdk/webhooks";
import { HTTPException } from "hono/http-exception";

const app = new OpenAPIHono<Context>();

const webhookResponseSchema = z.object({
  received: z.boolean(),
});

app.openapi(
  createRoute({
    method: "post",
    path: "/",
    summary: "Polar webhook handler",
    operationId: "polarWebhook",
    description:
      "Handles Polar webhook events for subscription changes. Verifies webhook signature and processes subscription events.",
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
      500: {
        description: "Failed to process webhook event (will trigger retry)",
      },
    },
  }),
  async (c) => {
    const db = c.get("db");
    const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;

    if (!webhookSecret) {
      logger.error("POLAR_WEBHOOK_SECRET not configured");
      throw new HTTPException(500, {
        message: "Webhook secret not configured",
      });
    }

    let event: ReturnType<typeof validateEvent>;

    try {
      const rawBody = await c.req.text();
      const webhookHeaders = {
        "webhook-id": c.req.header("webhook-id") ?? "",
        "webhook-timestamp": c.req.header("webhook-timestamp") ?? "",
        "webhook-signature": c.req.header("webhook-signature") ?? "",
      };

      event = validateEvent(rawBody, webhookHeaders, webhookSecret);
    } catch (err) {
      if (err instanceof WebhookVerificationError) {
        logger.error("Polar webhook signature verification failed", {
          error: err.message,
        });
        throw new HTTPException(400, { message: "Invalid webhook signature" });
      }
      throw err;
    }

    logger.info("Polar webhook received", {
      type: event.type,
    });

    try {
      switch (event.type) {
        case "subscription.active": {
          const teamId = event.data.metadata?.teamId as string | undefined;

          if (!teamId) {
            logger.warn("Subscription active event missing teamId metadata");
            break;
          }

          await updateTeamById(db, {
            id: teamId,
            data: {
              email: event.data.customer.email ?? undefined,
              plan: getPlanByProductId(event.data.productId),
              canceledAt: null,
              subscriptionStatus: "active",
            },
          });

          logger.info("Team plan activated", {
            teamId,
            plan: getPlanByProductId(event.data.productId),
          });

          break;
        }

        case "subscription.canceled": {
          const teamId = event.data.metadata?.teamId as string | undefined;

          if (!teamId) {
            logger.warn("Subscription canceled event missing teamId metadata");
            break;
          }

          await updateTeamById(db, {
            id: teamId,
            data: {
              email: event.data.customer.email ?? undefined,
              canceledAt: new Date().toISOString(),
            },
          });

          logger.info("Team subscription canceled", { teamId });

          break;
        }

        // @ts-expect-error - subscription.past_due is a new Polar event not yet in SDK types
        // See: https://polar.sh/docs/api-reference/webhooks/subscription.past_due
        case "subscription.past_due": {
          // @ts-expect-error - data is not typed
          const teamId = event.data.metadata?.teamId as string | undefined;

          if (!teamId) {
            logger.warn("Subscription past_due event missing teamId metadata");
            break;
          }

          // Payment failed but recoverable - mark as past_due
          await updateTeamById(db, {
            id: teamId,
            data: {
              subscriptionStatus: "past_due",
            },
          });

          logger.info("Team subscription past due", { teamId });
          break;
        }

        case "subscription.revoked": {
          const teamId = event.data.metadata?.teamId as string | undefined;

          if (!teamId) {
            logger.warn("Subscription revoked event missing teamId metadata");
            break;
          }

          // Check if this is a past_due status (payment pending) vs actual revocation
          // Polar may send subscription.revoked events with status === "past_due" for
          // backward compatibility, even though there's now a dedicated subscription.past_due event
          if (event.data.status === "past_due") {
            // Keep the plan active but mark subscription as past_due
            // User keeps access while they fix their payment method
            await updateTeamById(db, {
              id: teamId,
              data: {
                subscriptionStatus: "past_due",
              },
            });

            logger.info("Team subscription past due (via revoked event)", {
              teamId,
            });
          } else {
            // Payment retries exhausted - downgrade to trial
            await updateTeamById(db, {
              id: teamId,
              data: {
                plan: "trial",
                canceledAt: new Date().toISOString(),
                subscriptionStatus: null,
              },
            });

            logger.info("Team subscription revoked, downgraded to trial", {
              teamId,
            });
          }
          break;
        }

        default:
          logger.debug("Unhandled Polar webhook event type", {
            type: event.type,
          });
      }
    } catch (err) {
      logger.error("Error processing Polar webhook", {
        error: err instanceof Error ? err.message : String(err),
        eventType: event.type,
      });
      // Re-throw to return 5xx, allowing Polar to retry on transient failures
      throw new HTTPException(500, {
        message: "Failed to process webhook event",
      });
    }

    return c.json({ received: true });
  },
);

export { app as polarWebhookRouter };
