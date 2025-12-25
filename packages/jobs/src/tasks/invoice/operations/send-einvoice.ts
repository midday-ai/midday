/**
 * Send E-Invoice Task
 *
 * Sends an invoice via the Peppol network using the configured provider (e.g., Storecove).
 * This task is triggered after invoice generation when:
 * - The team has e-invoicing enabled
 * - The customer has a Peppol ID
 */

import { sendEInvoiceSchema } from "@jobs/schema";
import {
  type EInvoiceParty,
  StorecoveProvider,
  invoiceToEInvoiceDocument,
  parsePeppolId,
} from "@midday/e-invoicing";
import { createClient } from "@midday/supabase/job";
import { logger, schemaTask } from "@trigger.dev/sdk";

interface TeamEInvoiceSettings {
  apiKey?: string;
  legalEntityId?: string;
  environment?: "production" | "sandbox";
}

/**
 * Extract text content from an EditorDoc JSON structure
 */
function extractTextFromEditorDoc(doc: unknown): string {
  if (!doc || typeof doc !== "object") return "";

  const editorDoc = doc as {
    content?: Array<{ content?: Array<{ text?: string }> }>;
  };
  if (!editorDoc.content) return "";

  return editorDoc.content
    .flatMap((node) => node.content?.map((inline) => inline.text || "") || [])
    .join(" ")
    .trim();
}

/**
 * Parse address from EditorDoc format
 * Assumes format: "Company Name\nStreet Address\nCity, Postal Code\nCountry"
 */
function parseAddressFromEditorDoc(doc: unknown): {
  name: string;
  streetAddress?: string;
  city?: string;
  postalCode?: string;
  countryCode?: string;
} {
  const text = extractTextFromEditorDoc(doc);
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const result: ReturnType<typeof parseAddressFromEditorDoc> = {
    name: lines[0] || "",
  };

  if (lines.length > 1) {
    result.streetAddress = lines[1];
  }

  if (lines.length > 2) {
    // Try to parse "City, Postal Code" or "Postal Code City"
    const cityLine = lines[2];
    if (cityLine) {
      const parts = cityLine.split(",").map((p) => p.trim());
      if (parts.length >= 2) {
        result.city = parts[0];
        result.postalCode = parts[1];
      } else {
        result.city = cityLine;
      }
    }
  }

  // Default country code - should be overridden by actual data
  result.countryCode = "SE";

  return result;
}

export const sendEInvoice = schemaTask({
  id: "send-einvoice",
  schema: sendEInvoiceSchema,
  maxDuration: 60,
  queue: {
    concurrencyLimit: 5,
  },
  run: async (payload) => {
    const supabase = createClient();
    const { invoiceId, teamId } = payload;

    logger.info("Starting e-invoice send", { invoiceId, teamId });

    // Fetch invoice with customer and team data
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select(`
        *,
        customer:customer_id(
          id, name, email, peppol_id, vat_number, country_code,
          address_line_1, city, zip
        ),
        team:team_id(
          id, name, peppol_id, einvoicing_enabled, einvoicing_settings,
          country_code, email
        )
      `)
      .eq("id", invoiceId)
      .single();

    if (invoiceError || !invoice) {
      logger.error("Failed to fetch invoice", {
        invoiceId,
        error: invoiceError,
      });
      throw new Error(`Invoice not found: ${invoiceId}`);
    }

    // Validate e-invoicing is enabled
    if (!invoice.team?.einvoicing_enabled) {
      logger.warn("E-invoicing not enabled for team", { teamId });
      return { success: false, reason: "E-invoicing not enabled" };
    }

    // Validate Peppol IDs exist
    const sellerPeppolId = parsePeppolId(invoice.team?.peppol_id || "");
    const buyerPeppolId = parsePeppolId(invoice.customer?.peppol_id || "");

    if (!sellerPeppolId) {
      logger.warn("Team does not have a Peppol ID configured", { teamId });
      await updateInvoiceEInvoiceStatus(
        supabase,
        invoiceId,
        "failed",
        "Team Peppol ID not configured",
      );
      return { success: false, reason: "Team Peppol ID not configured" };
    }

    if (!buyerPeppolId) {
      logger.warn("Customer does not have a Peppol ID", {
        customerId: invoice.customer?.id,
      });
      // Don't mark as failed - customer just doesn't use e-invoicing
      return { success: false, reason: "Customer does not have Peppol ID" };
    }

    // Get e-invoicing settings
    const settings = invoice.team
      ?.einvoicing_settings as TeamEInvoiceSettings | null;
    if (!settings?.apiKey) {
      logger.error("E-invoicing API key not configured", { teamId });
      await updateInvoiceEInvoiceStatus(
        supabase,
        invoiceId,
        "failed",
        "API key not configured",
      );
      return { success: false, reason: "API key not configured" };
    }

    // Build seller party
    const sellerAddress = parseAddressFromEditorDoc(invoice.from_details);
    const seller: EInvoiceParty = {
      peppolId: sellerPeppolId,
      name: sellerAddress.name || invoice.team?.name || "",
      streetAddress: sellerAddress.streetAddress,
      city: sellerAddress.city,
      postalCode: sellerAddress.postalCode,
      countryCode:
        invoice.team?.country_code || sellerAddress.countryCode || "SE",
      contactEmail: invoice.team?.email || undefined,
    };

    // Build buyer party
    const buyer: EInvoiceParty = {
      peppolId: buyerPeppolId,
      name: invoice.customer?.name || "",
      streetAddress: invoice.customer?.address_line_1 || undefined,
      city: invoice.customer?.city || undefined,
      postalCode: invoice.customer?.zip || undefined,
      countryCode: invoice.customer?.country_code || "SE",
      vatNumber: invoice.customer?.vat_number || undefined,
      contactEmail: invoice.customer?.email || undefined,
    };

    // Convert invoice to e-invoice document
    const lineItems =
      (invoice.line_items as Array<{
        name: string;
        quantity?: number;
        price?: number;
        unit?: string;
      }>) || [];
    const taxRate =
      Number(invoice.vat || invoice.tax || 0) > 0
        ? (Number(invoice.vat || invoice.tax || 0) /
            Number(invoice.subtotal || invoice.amount || 1)) *
          100
        : 0;

    const eInvoiceDoc = invoiceToEInvoiceDocument(
      {
        id: invoice.id,
        invoiceNumber: invoice.invoice_number,
        createdAt: invoice.created_at,
        issueDate: invoice.issue_date,
        dueDate: invoice.due_date,
        amount: Number(invoice.amount),
        currency: invoice.currency,
        lineItems: lineItems.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          unit: item.unit,
        })),
        vat: Number(invoice.vat || 0),
        tax: Number(invoice.tax || 0),
        discount: Number(invoice.discount || 0),
        note: invoice.note,
        // Required fields from Invoice type with defaults
        paymentDetails: null,
        customerDetails: null,
        reminderSentAt: null,
        updatedAt: null,
        internalNote: null,
        paidAt: null,
        filePath: null,
        status: invoice.status,
        viewedAt: null,
        fromDetails: null,
        sentAt: null,
        template: {} as any,
        noteDetails: null,
        customerName: null,
        token: "",
        sentTo: null,
        topBlock: null,
        bottomBlock: null,
        customer: null,
        customerId: null,
        team: null,
      },
      seller,
      buyer,
      taxRate,
    );

    // Mark as pending
    await updateInvoiceEInvoiceStatus(supabase, invoiceId, "pending");

    // Initialize provider and send
    const provider = new StorecoveProvider({
      apiKey: settings.apiKey,
      environment: settings.environment || "production",
      legalEntityId: settings.legalEntityId,
    });

    logger.info("Sending e-invoice via Storecove", {
      invoiceId,
      invoiceNumber: invoice.invoice_number,
      buyerPeppolId: invoice.customer?.peppol_id,
    });

    const result = await provider.sendInvoice(eInvoiceDoc);

    if (result.success) {
      logger.info("E-invoice sent successfully", {
        invoiceId,
        documentId: result.documentId,
      });

      await supabase
        .from("invoices")
        .update({
          einvoice_status: "sent",
          einvoice_document_id: result.documentId,
          einvoice_sent_at: new Date().toISOString(),
          einvoice_error: null,
        })
        .eq("id", invoiceId);

      return { success: true, documentId: result.documentId };
    }

    logger.error("E-invoice send failed", {
      invoiceId,
      error: result.error,
      errorCode: result.errorCode,
    });

    await updateInvoiceEInvoiceStatus(
      supabase,
      invoiceId,
      "failed",
      result.error,
    );

    return { success: false, error: result.error };
  },
});

/**
 * Helper to update e-invoice status on the invoice
 */
async function updateInvoiceEInvoiceStatus(
  supabase: ReturnType<typeof createClient>,
  invoiceId: string,
  status: "pending" | "sent" | "delivered" | "failed",
  error?: string,
) {
  await supabase
    .from("invoices")
    .update({
      einvoice_status: status,
      einvoice_error: error || null,
    })
    .eq("id", invoiceId);
}
