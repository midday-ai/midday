import { getInvoiceById, updateInvoice } from "@midday/db/queries";
import { PdfTemplate, renderToBuffer } from "@midday/invoice";
import { createClient } from "@midday/supabase/job";
import { job } from "@worker/core/job";
import { processDocumentJob } from "@worker/jobs/documents/process-document";
import { invoicesQueue } from "@worker/queues/queues";
import { generateInvoiceSchema } from "@worker/schemas/jobs";
import { sendInvoiceEmailJob } from "./send-email";

export const generateInvoiceJob = job(
  "generate-invoice",
  generateInvoiceSchema,
  {
    queue: invoicesQueue,
    attempts: 3,
    priority: 1,
    removeOnComplete: 50,
  },
  async ({ invoiceId, deliveryType }, ctx) => {
    ctx.logger.info("Generating invoice PDF", { invoiceId, deliveryType });

    const invoice = await getInvoiceById(ctx.db, { id: invoiceId });

    if (!invoice) {
      ctx.logger.error("Invoice not found", { invoiceId });
      throw new Error("Invoice not found");
    }

    const supabase = createClient();

    ctx.logger.info("Rendering PDF template", { invoiceId });

    const buffer = await renderToBuffer(await PdfTemplate(invoice));

    const filename = `${invoice.invoiceNumber}.pdf`;
    const teamId = invoice.team?.id;

    if (!teamId) {
      ctx.logger.error("Team ID not found on invoice", { invoiceId });
      throw new Error("Team ID not found on invoice");
    }

    const fullPath = `${teamId}/invoices/${filename}`;

    ctx.logger.info("Uploading PDF to storage", {
      invoiceId,
      filename,
      fullPath,
      bufferSize: buffer.length,
    });

    // Upload PDF to storage
    const { error: uploadError } = await supabase.storage
      .from("vault")
      .upload(fullPath, buffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      ctx.logger.error("Failed to upload PDF to storage", {
        invoiceId,
        error: uploadError,
      });
      throw new Error("Failed to upload PDF to storage");
    }

    ctx.logger.info("PDF uploaded successfully", { invoiceId, fullPath });

    // Update invoice with file path and size using Drizzle
    try {
      await updateInvoice(ctx.db, {
        id: invoiceId,
        teamId: teamId,
        filePath: [teamId, "invoices", filename],
        fileSize: buffer.length,
      });

      ctx.logger.info("Invoice updated with file information", { invoiceId });
    } catch (error) {
      ctx.logger.error("Failed to update invoice with file information", {
        invoiceId,
        error,
      });
      throw new Error("Failed to update invoice with file information");
    }

    // If delivery type is create_and_send, trigger email job
    if (deliveryType === "create_and_send") {
      ctx.logger.info("Triggering email job", { invoiceId });

      await sendInvoiceEmailJob.trigger({
        invoiceId,
        filename,
        fullPath,
      });
    }

    // Trigger document processing for the generated PDF
    ctx.logger.info("Triggering document processing", { invoiceId });

    await processDocumentJob.trigger({
      filePath: [teamId, "invoices", filename],
      mimetype: "application/pdf",
      teamId: teamId,
    });

    ctx.logger.info("Invoice generation completed", {
      invoiceId,
      filename,
      deliveryType,
      emailTriggered: deliveryType === "create_and_send",
    });

    return {
      type: "invoice-generated",
      invoiceId,
      filename,
      fullPath,
      deliveryType,
      emailTriggered: deliveryType === "create_and_send",
      generatedAt: new Date(),
    };
  },
);
