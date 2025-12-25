/**
 * E-Invoicing Database Queries
 *
 * Queries for managing e-invoice status and lookups.
 */

import type { Database } from "@db/client";
import { eq } from "drizzle-orm";
import { invoices } from "../schema";

/**
 * E-invoice status type
 */
export type EInvoiceStatus = "pending" | "sent" | "delivered" | "failed";

/**
 * Get an invoice by its e-invoice document ID (e.g., Storecove GUID)
 */
export async function getInvoiceByEInvoiceDocumentId(
  db: Database,
  documentId: string,
) {
  return db.query.invoices.findFirst({
    where: eq(invoices.einvoiceDocumentId, documentId),
    columns: {
      id: true,
      invoiceNumber: true,
      teamId: true,
      einvoiceStatus: true,
    },
  });
}

/**
 * Update e-invoice status on an invoice
 */
export async function updateInvoiceEInvoiceStatus(
  db: Database,
  params: {
    invoiceId: string;
    status: EInvoiceStatus;
    documentId?: string;
    sentAt?: string;
    deliveredAt?: string;
    error?: string | null;
  },
) {
  const updateData: Record<string, unknown> = {
    einvoiceStatus: params.status,
  };

  if (params.documentId !== undefined) {
    updateData.einvoiceDocumentId = params.documentId;
  }

  if (params.sentAt !== undefined) {
    updateData.einvoiceSentAt = params.sentAt;
  }

  if (params.deliveredAt !== undefined) {
    updateData.einvoiceDeliveredAt = params.deliveredAt;
  }

  if (params.error !== undefined) {
    updateData.einvoiceError = params.error;
  }

  return db
    .update(invoices)
    .set(updateData)
    .where(eq(invoices.id, params.invoiceId))
    .returning({
      id: invoices.id,
      einvoiceStatus: invoices.einvoiceStatus,
    });
}
