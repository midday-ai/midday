import { PdfTemplate, renderToBuffer } from "@midday/invoice";
import { createClient } from "@midday/supabase/job";
import type { Job } from "bullmq";
import camelcaseKeys from "camelcase-keys";
import { documentsQueue } from "../../queues/documents";
import { invoicesQueue } from "../../queues/invoices";
import type { GenerateInvoicePayload } from "../../schemas/invoices";
import { BaseProcessor } from "../base";

/**
 * Generate Invoice Processor
 * Handles PDF generation and storage upload for invoices
 * Optionally triggers email sending via send-invoice-email job
 */
export class GenerateInvoiceProcessor extends BaseProcessor<GenerateInvoicePayload> {
  async process(job: Job<GenerateInvoicePayload>): Promise<void> {
    const { invoiceId, deliveryType } = job.data;
    const supabase = createClient();

    this.logger.info("Starting invoice generation", {
      jobId: job.id,
      invoiceId,
      deliveryType,
    });

    // Fetch invoice data
    const { data: invoiceData, error } = await supabase
      .from("invoices")
      .select(
        "*, team_id, customer:customer_id(name), user:user_id(timezone, locale)",
      )
      .eq("id", invoiceId)
      .single();

    if (error || !invoiceData) {
      this.logger.error("Failed to fetch invoice", {
        invoiceId,
        error: error?.message,
      });
      throw new Error(`Invoice not found: ${invoiceId}`);
    }

    const { user, ...invoice } = invoiceData;

    // Convert snake_case to camelCase for PdfTemplate
    const camelCaseInvoice = camelcaseKeys(invoice, { deep: true });

    this.logger.debug("Generating PDF", { invoiceId });

    // Generate PDF buffer
    // @ts-expect-error - Template JSONB while EditorDoc in components
    const buffer = await renderToBuffer(await PdfTemplate(camelCaseInvoice));

    const filename = `${invoiceData.invoice_number}.pdf`;
    const fullPath = `${invoiceData.team_id}/invoices/${filename}`;

    this.logger.debug("Uploading PDF to storage", {
      invoiceId,
      fullPath,
      fileSize: buffer.length,
    });

    // Upload to Supabase storage
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

    // Update invoice with file path and size
    const { error: updateError } = await supabase
      .from("invoices")
      .update({
        file_path: [invoiceData.team_id, "invoices", filename],
        file_size: buffer.length,
      })
      .eq("id", invoiceId);

    if (updateError) {
      this.logger.error("Failed to update invoice with file info", {
        invoiceId,
        error: updateError.message,
      });
      throw new Error(`Failed to update invoice: ${updateError.message}`);
    }

    // Queue email sending if delivery type is create_and_send
    if (deliveryType === "create_and_send") {
      await invoicesQueue.add(
        "send-invoice-email",
        {
          invoiceId,
          filename,
          fullPath,
        },
        {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 1000,
          },
        },
      );

      this.logger.debug("Queued send-invoice-email job", { invoiceId });
    }

    // Queue document processing for classification
    await documentsQueue.add(
      "process-document",
      {
        filePath: [invoiceData.team_id, "invoices", filename],
        mimetype: "application/pdf",
        teamId: invoiceData.team_id,
      },
      {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
      },
    );

    this.logger.info("Invoice generation completed", {
      invoiceId,
      filename,
      fullPath,
      deliveryType,
    });
  }
}
