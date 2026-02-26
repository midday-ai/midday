import { getInvoiceById } from "@midday/db/queries";
import { Notifications } from "@midday/notifications";
import type { Job } from "bullmq";
import type { SendInvoiceReminderPayload } from "../../schemas/invoices";
import { getDb } from "../../utils/db";
import { BaseProcessor } from "../base";

/**
 * Send Invoice Reminder Processor
 * Handles sending reminder emails for unpaid/overdue invoices
 */
export class SendInvoiceReminderProcessor extends BaseProcessor<SendInvoiceReminderPayload> {
  async process(job: Job<SendInvoiceReminderPayload>): Promise<void> {
    const { invoiceId } = job.data;
    const db = getDb();
    const notifications = new Notifications(db);

    this.logger.info("Starting send invoice reminder", {
      jobId: job.id,
      invoiceId,
    });

    // Fetch invoice with related data
    const invoice = await getInvoiceById(db, { id: invoiceId });

    if (!invoice) {
      this.logger.error("Invoice not found", { invoiceId });
      throw new Error(`Invoice not found: ${invoiceId}`);
    }

    const merchantEmail = invoice.merchant?.email;

    if (!merchantEmail) {
      this.logger.error("Invoice merchant email not found", { invoiceId });
      throw new Error(`Invoice merchant email not found: ${invoiceId}`);
    }

    if (!invoice.invoiceNumber || !invoice.merchant?.name) {
      this.logger.error("Invoice missing required fields", {
        invoiceId,
        hasInvoiceNumber: !!invoice.invoiceNumber,
        hasMerchantName: !!invoice.merchant?.name,
      });
      throw new Error(`Invoice missing required fields: ${invoiceId}`);
    }

    // Send reminder notification (email)
    try {
      await notifications.create(
        "invoice_reminder_sent",
        invoice.teamId,
        {
          invoiceId,
          invoiceNumber: invoice.invoiceNumber,
          merchantName: invoice.merchant.name,
          merchantEmail,
          token: invoice.token,
        },
        {
          sendEmail: true,
          replyTo: invoice.team?.email ?? undefined,
        },
      );
    } catch (error) {
      this.logger.error("Failed to send invoice reminder email", {
        invoiceId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw new Error("Invoice reminder email failed to send");
    }

    this.logger.info("Invoice reminder email sent", {
      invoiceId,
      merchantEmail,
    });
  }
}
