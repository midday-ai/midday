import { timingSafeEqual } from "node:crypto";
import type { Context } from "@api/rest/types";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { parseInvoiceKey } from "@midday/e-invoice/gobl";
import { parsePartyKey } from "@midday/e-invoice/registration";
import type { InvopopWebhookPayload } from "@midday/e-invoice/types";
import { invopopWebhookPayloadSchema } from "@midday/e-invoice/types";
import { triggerJob } from "@midday/job-client";
import { logger } from "@midday/logger";
import { HTTPException } from "hono/http-exception";
import {
  handleInvoiceCallback,
  handlePartyError,
  handlePartyProcessing,
  handlePartyRegistered,
} from "./handlers";

// ---------------------------------------------------------------------------
// Webhook type resolution
// ---------------------------------------------------------------------------

type WebhookType =
  | { type: "party"; teamId: string }
  | { type: "invoice"; invoiceId: string }
  | { type: "incoming"; siloEntryId: string }
  | { type: "unknown" };

/**
 * Resolve the webhook type from the payload key.
 *
 * Routing rules:
 *  - `midday-party-{teamId}`   → party registration callback
 *  - `midday-invoice-{id}`     → outbound invoice status callback
 *  - anything else with a silo_entry_id → incoming Peppol document
 *  - otherwise                 → unknown
 */
function resolveWebhookType(payload: InvopopWebhookPayload): WebhookType {
  const { key, silo_entry_id } = payload;

  if (key) {
    const teamId = parsePartyKey(key);
    if (teamId) return { type: "party", teamId };

    const invoiceId = parseInvoiceKey(key);
    if (invoiceId) return { type: "invoice", invoiceId };
  }

  // No midday-* prefix — treat as incoming document if we have a silo entry
  if (silo_entry_id) return { type: "incoming", siloEntryId: silo_entry_id };

  return { type: "unknown" };
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

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
    if (
      !authHeader ||
      authHeader.length !== expectedAuth.length ||
      !timingSafeEqual(Buffer.from(authHeader), Buffer.from(expectedAuth))
    ) {
      logger.warn("Invopop webhook: invalid authorization");
      throw new HTTPException(401, { message: "Unauthorized" });
    }

    const rawBody = await c.req.json().catch(() => null);

    if (!rawBody) {
      throw new HTTPException(400, { message: "Invalid JSON payload" });
    }

    const parsed = invopopWebhookPayloadSchema.safeParse(rawBody);

    if (!parsed.success) {
      logger.warn("Invopop webhook: payload validation failed", {
        errors: parsed.error.flatten().fieldErrors,
      });
      throw new HTTPException(400, {
        message: `Invalid webhook payload: ${parsed.error.issues.map((i) => i.message).join(", ")}`,
      });
    }

    const payload = parsed.data;
    const resolved = resolveWebhookType(payload);

    logger.info("Invopop webhook received", {
      id: payload.id,
      event: payload.event,
      key: payload.key,
      resolvedType: resolved.type,
      siloEntryId: payload.silo_entry_id,
      jobId: payload.transform_job_id,
      hasFaults: (payload.faults?.length ?? 0) > 0,
    });

    try {
      switch (resolved.type) {
        case "party": {
          const isError =
            payload.event === "error" ||
            (payload.faults && payload.faults.length > 0);
          const isProcessing = payload.event === "processing";

          if (isError) {
            await handlePartyError(db, resolved.teamId, payload);
          } else if (isProcessing) {
            await handlePartyProcessing(db, resolved.teamId, payload);
          } else {
            await handlePartyRegistered(db, resolved.teamId, payload);
          }
          break;
        }

        case "invoice": {
          await handleInvoiceCallback(db, resolved.invoiceId, payload);
          break;
        }

        case "incoming": {
          logger.info("Queueing incoming Peppol document for processing", {
            siloEntryId: resolved.siloEntryId,
            key: payload.key,
          });

          await triggerJob(
            "peppol-incoming",
            {
              siloEntryId: resolved.siloEntryId,
              key: payload.key,
            },
            "inbox",
          );
          break;
        }

        case "unknown": {
          logger.warn("Invopop webhook: could not determine webhook type", {
            key: payload.key,
            siloEntryId: payload.silo_entry_id,
          });
          break;
        }
      }
    } catch (err) {
      logger.error("Error processing Invopop webhook", {
        error: err instanceof Error ? err.message : String(err),
        webhookId: payload.id,
        key: payload.key,
        resolvedType: resolved.type,
      });

      throw new HTTPException(500, {
        message: "Failed to process webhook",
      });
    }

    return c.json({ received: true });
  },
);

export { app as invopopWebhookRouter };
