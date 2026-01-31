import {
  getCustomerById,
  getInvoiceById,
  getInvoiceTemplateById,
  updateInvoice,
} from "@midday/db/queries";
import { PdfTemplate, renderToBuffer } from "@midday/invoice";
import { createClient } from "@midday/supabase/job";
import type { Job } from "bullmq";
import {
  DEFAULT_JOB_OPTIONS,
  EINVOICE_JOB_OPTIONS,
} from "../../config/job-options";
import { documentsQueue } from "../../queues/documents";
import { invoicesQueue } from "../../queues/invoices";
import type { GenerateInvoicePayload } from "../../schemas/invoices";
import { getDb } from "../../utils/db";
import { BaseProcessor } from "../base";

/**
 * Generate Invoice Processor
 * Handles PDF generation and storage upload for invoices
 * Routes to either email or e-invoice (Peppol) based on template settings and customer data
 */
export class GenerateInvoiceProcessor extends BaseProcessor<GenerateInvoicePayload> {
  async process(job: Job<GenerateInvoicePayload>): Promise<void> {
    const { invoiceId, deliveryType } = job.data;
    const db = getDb();
    // Supabase client is needed for storage operations only
    const supabase = createClient();

    this.logger.info("Starting invoice generation", {
      jobId: job.id,
      invoiceId,
      deliveryType,
    });

    // Fetch invoice data
    const invoiceData = await getInvoiceById(db, { id: invoiceId });

    if (!invoiceData) {
      this.logger.error("Failed to fetch invoice", { invoiceId });
      throw new Error(`Invoice not found: ${invoiceId}`);
    }

    const { user, ...invoice } = invoiceData;

    this.logger.debug("Generating PDF", { invoiceId });

    // Generate PDF buffer
    // @ts-ignore - Template JSONB type differs from EditorDoc in components
    const buffer = await renderToBuffer(await PdfTemplate(invoice));

    const filename = `${invoiceData.invoiceNumber}.pdf`;
    const fullPath = `${invoiceData.teamId}/invoices/${filename}`;

    this.logger.debug("Uploading PDF to storage", {
      invoiceId,
      fullPath,
      fileSize: buffer.length,
    });

    // Upload to Supabase storage (storage SDK is still needed)
    const { error: uploadError } = await supabase.storage
      .from("vault")
      .upload(fullPath, buffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      this.logger.error("Failed to upload PDF", {
        invoiceId,
        error: uploadError.message,
      });
      throw new Error(`Failed to upload PDF: ${uploadError.message}`);
    }

    this.logger.debug("PDF uploaded to storage", { invoiceId, fullPath });

    // Update invoice with file path and size using Drizzle
    const updated = await updateInvoice(db, {
      id: invoiceId,
      teamId: invoiceData.teamId,
      filePath: [invoiceData.teamId, "invoices", filename],
      fileSize: buffer.length,
    });

    if (!updated) {
      this.logger.error("Failed to update invoice with file info", {
        invoiceId,
      });
      throw new Error("Failed to update invoice with file info");
    }

    // Determine delivery method if create_and_send
    if (deliveryType === "create_and_send") {
      const useEInvoice = await this.shouldUseEInvoice(invoiceData);

      if (useEInvoice.enabled) {
        // Route to e-invoice (Peppol) delivery with extended retries
        await invoicesQueue.add(
          "send-e-invoice",
          {
            invoiceId,
            sendNotificationEmail: useEInvoice.sendNotificationEmail,
          },
          EINVOICE_JOB_OPTIONS,
        );

        this.logger.debug("Queued send-e-invoice job", {
          invoiceId,
          sendNotificationEmail: useEInvoice.sendNotificationEmail,
        });
      } else {
        // Route to traditional email delivery
        await invoicesQueue.add(
          "send-invoice-email",
          {
            invoiceId,
            filename,
            fullPath,
          },
          DEFAULT_JOB_OPTIONS,
        );

        this.logger.debug("Queued send-invoice-email job", { invoiceId });
      }
    }

    // Queue document processing for classification
    await documentsQueue.add(
      "process-document",
      {
        filePath: [invoiceData.teamId, "invoices", filename],
        mimetype: "application/pdf",
        teamId: invoiceData.teamId,
      },
      DEFAULT_JOB_OPTIONS,
    );

    this.logger.info("Invoice generation completed", {
      invoiceId,
      filename,
      fullPath,
      deliveryType,
    });
  }

  /**
   * Determine if e-invoice (Peppol) should be used for this invoice
   *
   * Conditions:
   * 1. Platform has DDD_INVOICES_API_KEY configured
   * 2. Template has eInvoiceEnabled = true
   * 3. Customer has peppolId set
   */
  private async shouldUseEInvoice(invoiceData: {
    templateId: string | null;
    customerId: string | null;
    teamId: string;
  }): Promise<{ enabled: boolean; sendNotificationEmail: boolean }> {
    const db = getDb();

    // Default: don't use e-invoice
    const result = { enabled: false, sendNotificationEmail: true };

    // Check platform has e-invoice API key configured
    if (!process.env.DDD_INVOICES_API_KEY) {
      return result;
    }

    // Check template settings
    if (!invoiceData.templateId) {
      return result;
    }

    const template = await getInvoiceTemplateById(db, {
      id: invoiceData.templateId,
      teamId: invoiceData.teamId,
    });
    if (!template) {
      return result;
    }

    const eInvoiceEnabled = template.eInvoiceEnabled;
    if (!eInvoiceEnabled) {
      return result;
    }

    result.sendNotificationEmail = template.eInvoiceNotifyEmail ?? true;

    // Check customer has Peppol ID
    if (!invoiceData.customerId) {
      return result;
    }

    const customer = await getCustomerById(db, {
      id: invoiceData.customerId,
      teamId: invoiceData.teamId,
    });
    if (!customer) {
      return result;
    }

    const peppolId = customer.peppolId;
    if (!peppolId) {
      return result;
    }

    // All conditions met - use e-invoice
    result.enabled = true;
    return result;
  }
}
