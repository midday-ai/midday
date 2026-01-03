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
    const supabase = createClient();
    const db = getDb();
    const notifications = new Notifications(db);

    this.logger.info("Starting send invoice email", {
      jobId: job.id,
      invoiceId,
      filename,
    });

    // Fetch invoice with related data
    const { data: invoice, error } = await supabase
      .from("invoices")
      .select(
        "id, token, template, invoice_number, team_id, customer:customer_id(name, website, email, billing_email), team:team_id(name, email), user:user_id(email)",
      )
      .eq("id", invoiceId)
      .single();

    if (error || !invoice) {
      this.logger.error("Invoice not found", {
        invoiceId,
        error: error?.message,
      });
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

    const customer = invoice.customer as {
      name: string;
      website: string | null;
      email: string;
      billing_email: string | null;
    } | null;

    const team = invoice.team as {
      name: string;
      email: string | null;
    } | null;

    const user = invoice.user as {
      email: string;
    } | null;

    const customerEmail = customer?.email;
    const userEmail = user?.email;
    const shouldSendCopy = template?.sendCopy;

    // Build BCC list
    const bcc = [
      ...(customer?.billing_email ? [customer.billing_email] : []),
      ...(shouldSendCopy && userEmail ? [userEmail] : []),
    ];

    if (!customerEmail) {
      this.logger.error("Invoice customer email not found", { invoiceId });
      throw new Error(`Invoice customer email not found: ${invoiceId}`);
    }

    if (!invoice.invoice_number || !customer?.name) {
      this.logger.error("Invoice missing required fields", {
        invoiceId,
        hasInvoiceNumber: !!invoice.invoice_number,
        hasCustomerName: !!customer?.name,
      });
      throw new Error(`Invoice missing required fields: ${invoiceId}`);
    }

    // Send notification (email)
    try {
      await notifications.create(
        "invoice_sent",
        invoice.team_id,
        {
          invoiceId,
          invoiceNumber: invoice.invoice_number,
          customerName: customer.name,
          customerEmail,
          token: invoice.token,
        },
        {
          sendEmail: true,
          bcc,
          attachments,
          replyTo: team?.email ?? undefined,
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

    // Update invoice status
    const { error: updateError } = await supabase
      .from("invoices")
      .update({
        status: "unpaid",
        sent_to: customerEmail,
        sent_at: new Date().toISOString(),
      })
      .eq("id", invoiceId);

    if (updateError) {
      this.logger.error("Failed to update invoice status after email", {
        invoiceId,
        error: updateError.message,
      });
      // Don't throw here - email was sent successfully
    }

    this.logger.info("Send invoice email completed", {
      invoiceId,
      customerEmail,
    });
  }
}
