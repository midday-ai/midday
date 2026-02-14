import type { Context } from "@api/rest/types";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { parseInvoiceKey } from "@midday/e-invoice/gobl";
import { parsePartyKey } from "@midday/e-invoice/registration";
import type { InvopopWebhookPayload } from "@midday/e-invoice/types";
import { logger } from "@midday/logger";
import { HTTPException } from "hono/http-exception";
import {
  handleInvoiceCallback,
  handlePartyError,
  handlePartyProcessing,
  handlePartyRegistered,
} from "./handlers";

const app = new OpenAPIHono<Context>();

const webhookResponseSchema = z.object({
  received: z.boolean(),
});

app.openapi(
  createRoute({
    method: "post",
    path: "/",
    summary: "Invopop webhook handler",
    operationId: "invopopWebhook",
    description:
      "Handles Invopop webhook events for e-invoice processing. Verifies Bearer token and processes job completion/error events.",
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
      401: {
        description: "Invalid or missing authorization",
      },
      500: {
        description: "Webhook processing failed (provider should retry)",
      },
    },
  }),
  async (c) => {
    const db = c.get("db");

    // Verify Bearer token
    const authHeader = c.req.header("authorization");
    const webhookSecret = process.env.INVOPOP_WEBHOOK_SECRET;

    if (!webhookSecret) {
      logger.error("INVOPOP_WEBHOOK_SECRET not configured");
      throw new HTTPException(500, {
        message: "Webhook secret not configured",
      });
    }

    const expectedAuth = `Bearer ${webhookSecret}`;
    if (!authHeader || authHeader !== expectedAuth) {
      logger.warn("Invopop webhook: invalid authorization");
      throw new HTTPException(401, { message: "Unauthorized" });
    }

    let payload: InvopopWebhookPayload;

    try {
      payload = await c.req.json();
    } catch {
      throw new HTTPException(400, { message: "Invalid JSON payload" });
    }

    logger.info("Invopop webhook received", {
      id: payload.id,
      event: payload.event,
      key: payload.key,
      siloEntryId: payload.silo_entry_id,
      jobId: payload.transform_job_id,
      hasFaults: (payload.faults?.length ?? 0) > 0,
    });

    try {
      const invoiceId = payload.key ? parseInvoiceKey(payload.key) : null;
      const teamId = payload.key ? parsePartyKey(payload.key) : null;

      if (teamId) {
        const isError =
          payload.event === "error" ||
          (payload.faults && payload.faults.length > 0);
        const isProcessing = payload.event === "processing";

        if (isError) {
          await handlePartyError(db, teamId, payload);
        } else if (isProcessing) {
          await handlePartyProcessing(db, teamId, payload);
        } else {
          await handlePartyRegistered(db, teamId, payload);
        }
      } else if (invoiceId) {
        await handleInvoiceCallback(db, invoiceId, payload);
      } else {
        logger.warn("Invopop webhook: unrecognized key format", {
          key: payload.key,
        });
      }
    } catch (err) {
      logger.error("Error processing Invopop webhook", {
        error: err instanceof Error ? err.message : String(err),
        webhookId: payload.id,
        key: payload.key,
      });

      throw new HTTPException(500, {
        message: "Failed to process webhook",
      });
    }

    return c.json({ received: true });
  },
);

export { app as invopopWebhookRouter };
