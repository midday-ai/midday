import type { Context } from "@api/rest/types";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
  getEInvoiceRegistration,
  getInvoiceById,
  updateEInvoiceRegistration,
  updateInvoice,
} from "@midday/db/queries";
import { parseInvoiceKey } from "@midday/e-invoice/gobl";
import {
  extractPeppolIdFromEntry,
  parsePartyKey,
} from "@midday/e-invoice/registration";
import type {
  InvopopFault,
  InvopopWebhookPayload,
} from "@midday/e-invoice/types";
import { logger } from "@midday/logger";
import { HTTPException } from "hono/http-exception";

/**
 * Convert Invopop fault objects to the typed format stored in our DB.
 */
function toFaultMessages(faults?: InvopopFault[]): { message: string }[] {
  if (!faults || faults.length === 0) return [];
  return faults.map((f) => ({
    message: f.message || f.code || "Unknown error",
  }));
}

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
        await handlePartyWebhook(db, teamId, payload);
      } else if (invoiceId) {
        await handleInvoiceWebhook(db, invoiceId, payload);
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
    }

    return c.json({ received: true });
  },
);

// ---------------------------------------------------------------------------
// Party registration callback
// ---------------------------------------------------------------------------

async function handlePartyWebhook(
  db: Parameters<typeof getEInvoiceRegistration>[0],
  teamId: string,
  payload: InvopopWebhookPayload,
) {
  const registration = await getEInvoiceRegistration(db, {
    teamId,
    provider: "peppol",
  });

  if (!registration) {
    logger.warn("Invopop webhook: registration not found", { teamId });
    return;
  }

  const isError =
    payload.event === "failed" || (payload.faults && payload.faults.length > 0);

  if (isError) {
    logger.warn("Peppol registration failed", {
      teamId,
      faults: payload.faults,
    });

    await updateEInvoiceRegistration(db, {
      id: registration.id,
      status: "error",
      faults: toFaultMessages(payload.faults),
    });
    return;
  }

  logger.info("Peppol registration succeeded", { teamId });

  let peppolId: string | null = null;
  let peppolScheme: string | null = null;

  if (payload.silo_entry_id) {
    const apiKey = process.env.INVOPOP_API_KEY;
    if (apiKey) {
      try {
        const result = await extractPeppolIdFromEntry(
          apiKey,
          payload.silo_entry_id,
        );
        peppolId = result.peppolId;
        peppolScheme = result.peppolScheme;
      } catch (err) {
        logger.warn("Failed to fetch Peppol ID from silo entry", {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }

  await updateEInvoiceRegistration(db, {
    id: registration.id,
    status: "registered",
    faults: null,
    peppolId,
    peppolScheme,
  });
}

// ---------------------------------------------------------------------------
// Invoice e-invoice callback
// ---------------------------------------------------------------------------

async function handleInvoiceWebhook(
  db: Parameters<typeof getInvoiceById>[0],
  invoiceId: string,
  payload: InvopopWebhookPayload,
) {
  const invoice = await getInvoiceById(db, { id: invoiceId });

  if (!invoice) {
    logger.warn("Invopop webhook: invoice not found", { invoiceId });
    return;
  }

  const isError =
    payload.event === "failed" || (payload.faults && payload.faults.length > 0);

  if (isError) {
    logger.warn("E-invoice submission failed", {
      invoiceId,
      faults: payload.faults,
    });

    await updateInvoice(db, {
      id: invoiceId,
      teamId: invoice.teamId,
      eInvoiceStatus: "error",
      eInvoiceFaults: toFaultMessages(payload.faults),
    });
    return;
  }

  logger.info("E-invoice submission succeeded", {
    invoiceId,
    siloEntryId: payload.silo_entry_id,
  });

  await updateInvoice(db, {
    id: invoiceId,
    teamId: invoice.teamId,
    eInvoiceStatus: "sent",
    eInvoiceFaults: null,
  });
}

export { app as invopopWebhookRouter };
