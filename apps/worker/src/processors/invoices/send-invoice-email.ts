import { getInvoiceById, updateInvoice } from "@midday/db/queries";
import { Notifications } from "@midday/notifications";
import { createClient } from "@midday/supabase/job";
import type { Job } from "bullmq";
import type { SendInvoiceEmailPayload } from "../../schemas/invoices";
import { getDb } from "../../utils/db";
import { BaseProcessor } from "../base";

/**
 * Send Invoice Email Processor
 * Handles sending the invoice email with optional PDF attachment
 */
export class SendInvoiceEmailProcessor extends BaseProcessor<SendInvoiceEmailPayload> {
  async process(job: Job<SendInvoiceEmailPayload>): Promise<void> {
    const { invoiceId, filename, fullPath } = job.data;
    const db = getDb();
    // Supabase client is needed for storage operations only
    const supabase = createClient();
    const notifications = new Notifications(db);

    this.logger.info("Starting send invoice email", {
      jobId: job.id,
      invoiceId,
      filename,
    });

    // Fetch invoice with related data
    const invoice = await getInvoiceById(db, { id: invoiceId });

    if (!invoice) {
      this.logger.error("Invoice not found", { invoiceId });
      throw new Error(`Invoice not found: ${invoiceId}`);
    }

    let attachments: { content: string; filename: string }[] | undefined;

    // Download PDF attachment if template includes PDF
    const template = invoice.template as Record<string, unknown> | null;
    if (template?.includePdf) {
      const { data: attachmentData } = await supabase.storage
        .from("vault")
        .download(fullPath);

      if (attachmentData) {
        attachments = [
          {
            content: Buffer.from(await attachmentData.arrayBuffer()).toString(
              "base64",
            ),
            filename,
          },
        ];
        this.logger.debug("PDF attachment prepared", { invoiceId });
      }
    }

    const customerEmail = invoice.customer?.email;
    const userEmail = invoice.user?.email;
    const shouldSendCopy = template?.sendCopy;

    // Parse billing emails (supports comma-separated list)
    const billingEmails = invoice.customer?.billingEmail
      ? invoice.customer.billingEmail
          .split(",")
          .map((e) => e.trim())
          .filter(Boolean)
      : [];

    // Build BCC list
    const bcc = [
      ...billingEmails,
      ...(shouldSendCopy && userEmail ? [userEmail] : []),
    ];

    if (!customerEmail) {
      this.logger.error("Invoice customer email not found", { invoiceId });
      throw new Error(`Invoice customer email not found: ${invoiceId}`);
    }

    if (!invoice.invoiceNumber || !invoice.customer?.name) {
      this.logger.error("Invoice missing required fields", {
        invoiceId,
        hasInvoiceNumber: !!invoice.invoiceNumber,
        hasCustomerName: !!invoice.customer?.name,
      });
      throw new Error(`Invoice missing required fields: ${invoiceId}`);
    }

    // Send notification (email)
    try {
      await notifications.create(
        "invoice_sent",
        invoice.teamId,
        {
          invoiceId,
          invoiceNumber: invoice.invoiceNumber,
          customerName: invoice.customer.name,
          customerEmail,
          token: invoice.token,
          // Gmail structured data fields
          amount: invoice.amount ?? undefined,
          currency: invoice.currency ?? undefined,
          dueDate: invoice.dueDate ?? undefined,
          // Custom email content from template
          emailSubject: (template?.emailSubject as string) ?? undefined,
          emailHeading: (template?.emailHeading as string) ?? undefined,
          emailBody: (template?.emailBody as string) ?? undefined,
          emailButtonText: (template?.emailButtonText as string) ?? undefined,
          // Template labels and logo
          logoUrl: (template?.logoUrl as string) ?? undefined,
          dueDateLabel: (template?.dueDateLabel as string) ?? undefined,
          invoiceNoLabel: (template?.invoiceNoLabel as string) ?? undefined,
          // Formatting
          locale: (template?.locale as string) ?? undefined,
          dateFormat: (template?.dateFormat as string) ?? undefined,
        },
        {
          sendEmail: true,
          bcc,
          attachments,
          replyTo: invoice.team?.email ?? undefined,
        },
      );
    } catch (error) {
      this.logger.error("Failed to send invoice email", {
        invoiceId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw new Error("Invoice email failed to send");
    }

    this.logger.debug("Invoice email sent", { invoiceId, customerEmail });

    // Update invoice status using Drizzle
    const updated = await updateInvoice(db, {
      id: invoiceId,
      teamId: invoice.teamId,
      status: "unpaid",
      sentTo: customerEmail,
      sentAt: new Date().toISOString(),
    });

    if (!updated) {
      this.logger.error("Failed to update invoice status after email", {
        invoiceId,
      });
      // Don't throw here - email was sent successfully
    }

    this.logger.info("Send invoice email completed", {
      invoiceId,
      customerEmail,
    });
  }
}
