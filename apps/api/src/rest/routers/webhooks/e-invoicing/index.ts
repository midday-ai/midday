/**
 * E-Invoicing Webhook Handler
 *
 * Receives delivery status updates from Storecove (or other e-invoice providers).
 * Updates the invoice's e-invoice status based on delivery confirmations.
 */

import type { Context } from "@api/rest/types";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import {
  getInvoiceByEInvoiceDocumentId,
  updateInvoiceEInvoiceStatus,
} from "@midday/db/queries";
import { logger } from "@midday/logger";
import { HTTPException } from "hono/http-exception";

const app = new OpenAPIHono<Context>();

/**
 * Storecove webhook payload schema
 * See: https://www.storecove.com/docs/#_webhooks
 */
const storecoveWebhookSchema = z.object({
  // Document submission ID (GUID)
  guid: z.string(),
  // Event type
  event: z.enum([
    "document.submitted",
    "document.sent",
    "document.delivered",
    "document.acknowledged",
    "document.rejected",
    "document.sendError",
  ]),
  // Timestamp
  timestamp: z.string().optional(),
  // Error message (for rejected/sendError)
  error_message: z.string().optional(),
  // Additional metadata
  legal_entity_id: z.number().optional(),
});

const successResponseSchema = z.object({
  success: z.boolean(),
});

/**
 * Map Storecove event to our e-invoice status
 */
function mapStorecoveEventToStatus(
  event: z.infer<typeof storecoveWebhookSchema>["event"],
): "pending" | "sent" | "delivered" | "failed" {
  switch (event) {
    case "document.submitted":
      return "pending";
    case "document.sent":
      return "sent";
    case "document.delivered":
    case "document.acknowledged":
      return "delivered";
    case "document.rejected":
    case "document.sendError":
      return "failed";
    default:
      return "pending";
  }
}

app.openapi(
  createRoute({
    method: "post",
    path: "/storecove",
    summary: "Storecove webhook handler",
    operationId: "storecoveWebhook",
    description:
      "Handles incoming webhook events from Storecove for e-invoice delivery status updates.",
    tags: ["E-Invoicing", "Webhooks"],
    request: {
      body: {
        content: {
          "application/json": {
            schema: storecoveWebhookSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Webhook processed successfully",
        content: {
          "application/json": {
            schema: successResponseSchema,
          },
        },
      },
      400: {
        description: "Invalid request payload",
      },
      500: {
        description: "Internal server error",
      },
    },
  }),
  async (c) => {
    const db = c.get("db");

    try {
      const body = await c.req.json();
      const parsedBody = storecoveWebhookSchema.safeParse(body);

      if (!parsedBody.success) {
        logger.error("E-invoicing webhook validation failed", {
          errors: parsedBody.error.format(),
        });
        throw new HTTPException(400, {
          message: "Invalid webhook payload",
        });
      }

      const { guid, event, error_message, timestamp } = parsedBody.data;

      logger.info("E-invoicing webhook received", {
        documentId: guid,
        event,
        timestamp,
      });

      // Map event to status
      const status = mapStorecoveEventToStatus(event);

      // Find invoice by e-invoice document ID
      const invoice = await getInvoiceByEInvoiceDocumentId(db, guid);

      if (!invoice) {
        logger.warn("Invoice not found for e-invoice document ID", {
          documentId: guid,
          event,
        });
        // Return 200 to acknowledge receipt (Storecove expects 2xx)
        // The document might belong to a different system
        return c.json({ success: true });
      }

      // Update invoice status
      await updateInvoiceEInvoiceStatus(db, {
        invoiceId: invoice.id,
        status,
        deliveredAt:
          status === "delivered"
            ? timestamp || new Date().toISOString()
            : undefined,
        error: status === "failed" ? error_message || "Delivery failed" : null,
      });

      logger.info("E-invoice status updated", {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        documentId: guid,
        event,
        status,
      });

      return c.json({ success: true });
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }

      logger.error("E-invoicing webhook processing failed", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      throw new HTTPException(500, {
        message: "Failed to process webhook",
      });
    }
  },
);

export { app as eInvoicingWebhookRouter };
