import type { Context } from "@api/rest/types";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { getInvoiceById, updateInvoice } from "@midday/db/queries";
import { eInvoiceRegistrations } from "@midday/db/schema";
import { fetchEntry } from "@midday/e-invoice/client";
import { parseInvoiceKey } from "@midday/e-invoice/gobl";
import { parsePartyKey } from "@midday/e-invoice/registration";
import type { InvopopWebhookPayload } from "@midday/e-invoice/types";
import { logger } from "@midday/logger";
import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";

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
      // Determine if this is an invoice or party registration callback
      const invoiceId = payload.key ? parseInvoiceKey(payload.key) : null;
      const teamId = payload.key ? parsePartyKey(payload.key) : null;

      if (teamId) {
        // --- Party registration callback ---
        const isError =
          payload.event === "error" ||
          (payload.faults && payload.faults.length > 0);

        if (isError) {
          logger.warn("Peppol registration failed", {
            teamId,
            faults: payload.faults,
          });

          await db
            .update(eInvoiceRegistrations)
            .set({
              status: "error",
              faults: payload.faults || [],
              updatedAt: new Date().toISOString(),
            })
            .where(
              and(
                eq(eInvoiceRegistrations.teamId, teamId),
                eq(eInvoiceRegistrations.provider, "peppol"),
              ),
            );
        } else {
          logger.info("Peppol registration succeeded", { teamId });

          // Fetch the silo entry to get the assigned Peppol participant ID
          let peppolId: string | null = null;
          let peppolScheme: string | null = null;

          if (payload.silo_entry_id) {
            try {
              const apiKey = process.env.INVOPOP_API_KEY;
              if (apiKey) {
                const entry = await fetchEntry(apiKey, payload.silo_entry_id);
                // The Peppol ID is in the org.party inboxes after registration
                const partyData = entry.data as
                  | Record<string, unknown>
                  | undefined;
                const doc = (partyData?.doc ?? partyData) as
                  | Record<string, unknown>
                  | undefined;
                const inboxes = doc?.inboxes as
                  | Array<{ key?: string; scheme?: string; code?: string }>
                  | undefined;
                const peppolInbox = inboxes?.find((i) => i.key === "peppol");
                if (peppolInbox) {
                  peppolId = peppolInbox.code ?? null;
                  peppolScheme = peppolInbox.scheme ?? null;
                }
              }
            } catch (err) {
              logger.warn("Failed to fetch Peppol ID from silo entry", {
                error: err instanceof Error ? err.message : String(err),
              });
            }
          }

          await db
            .update(eInvoiceRegistrations)
            .set({
              status: "registered",
              faults: null,
              ...(peppolId && { peppolId }),
              ...(peppolScheme && { peppolScheme }),
              updatedAt: new Date().toISOString(),
            })
            .where(
              and(
                eq(eInvoiceRegistrations.teamId, teamId),
                eq(eInvoiceRegistrations.provider, "peppol"),
              ),
            );
        }
      } else if (invoiceId) {
        // --- Invoice e-invoice callback ---
        const invoice = await getInvoiceById(db, { id: invoiceId });

        if (!invoice) {
          logger.warn("Invopop webhook: invoice not found", { invoiceId });
          return c.json({ received: true });
        }

        const isError =
          payload.event === "error" ||
          (payload.faults && payload.faults.length > 0);

        if (isError) {
          logger.warn("E-invoice submission failed", {
            invoiceId,
            faults: payload.faults,
          });

          await updateInvoice(db, {
            id: invoiceId,
            teamId: invoice.teamId,
            eInvoiceStatus: "error",
            eInvoiceFaults: payload.faults || [],
          });
        } else {
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
      // Return 200 to avoid retries for events we partially processed
    }

    return c.json({ received: true });
  },
);

export { app as invopopWebhookRouter };
