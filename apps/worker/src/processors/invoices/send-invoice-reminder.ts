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

    const customerEmail = invoice.customer?.email;

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

    // Send reminder notification (email)
    try {
      await notifications.create(
        "invoice_reminder_sent",
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
      customerEmail,
    });
  }
}
