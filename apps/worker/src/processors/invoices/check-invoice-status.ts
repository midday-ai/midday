import { TZDate } from "@date-fns/tz";
import {
  createAttachments,
  getInvoiceForStatusCheck,
  getMatchingTransactionsForInvoice,
  updateInvoiceStatusOnly,
} from "@midday/db/queries";
import { triggerJob } from "@midday/job-client";
import type { Job } from "bullmq";
import { subDays } from "date-fns";
import {
  checkInvoiceStatusSchema,
  type CheckInvoiceStatusPayload,
} from "../../schemas/invoices";
import { getDb } from "../../utils/db";
import { BaseProcessor } from "../base";

/**
 * Checks if an invoice has been paid by matching with recent transactions.
 * If a matching transaction is found:
 * - Attaches the invoice file to the transaction
 * - Updates invoice status to "paid"
 * - Triggers notification
 *
 * If no match and invoice is overdue:
 * - Updates invoice status to "overdue"
 * - Triggers notification
 */
export class CheckInvoiceStatusProcessor extends BaseProcessor<CheckInvoiceStatusPayload> {
  protected getPayloadSchema() {
    return checkInvoiceStatusSchema;
  }

  async process(job: Job<CheckInvoiceStatusPayload>): Promise<void> {
    const { invoiceId } = job.data;
    const db = getDb();

    // Get invoice data
    const invoice = await getInvoiceForStatusCheck(db, { invoiceId });

    if (!invoice) {
      this.logger.error("Invoice not found", { invoiceId });
      return;
    }

    if (!invoice.amount || !invoice.currency || !invoice.dueDate) {
      this.logger.error("Invoice data is missing required fields", {
        invoiceId,
        hasAmount: !!invoice.amount,
        hasCurrency: !!invoice.currency,
        hasDueDate: !!invoice.dueDate,
      });
      return;
    }

    // Get timezone from template or default to UTC
    const template = invoice.template as { timezone?: string } | null;
    const timezone = template?.timezone || "UTC";

    // Find recent transactions matching invoice amount, currency, and team_id
    const sinceDate = subDays(new TZDate(new Date(), timezone), 3).toISOString();

    const transactions = await getMatchingTransactionsForInvoice(db, {
      teamId: invoice.teamId,
      amount: Number(invoice.amount),
      currency: invoice.currency,
      sinceDate,
    });

    // We have exactly one match - mark as paid
    if (transactions.length === 1) {
      const transactionId = transactions[0]?.id;

      if (transactionId && invoice.filePath) {
        const filename = `${invoice.invoiceNumber}.pdf`;

        // Attach the invoice file to the transaction
        await createAttachments(db, {
          attachments: [
            {
              type: "application/pdf",
              path: invoice.filePath,
              transactionId,
              name: filename,
              size: invoice.fileSize ?? 0,
            },
          ],
          teamId: invoice.teamId,
        });

        this.logger.info("Attached invoice to transaction", {
          invoiceId,
          transactionId,
        });
      }

      // Update invoice status to paid
      const updatedInvoice = await updateInvoiceStatusOnly(db, {
        invoiceId,
        teamId: invoice.teamId,
        status: "paid",
        paidAt: new Date().toISOString(),
      });

      this.logger.info("Invoice marked as paid", { invoiceId });

      // Trigger notification
      if (updatedInvoice) {
        await triggerJob(
          "notification",
          {
            type: "invoice_paid",
            teamId: invoice.teamId,
            invoiceId,
            invoiceNumber: updatedInvoice.invoiceNumber,
            source: "system",
            sendEmail: true,
          },
          "notifications",
        );
      }
    } else {
      // Check if the invoice is overdue
      const isOverdue =
        new TZDate(invoice.dueDate, timezone) < new TZDate(new Date(), timezone);

      // Update invoice status to overdue if it's past due date and currently unpaid
      if (isOverdue && invoice.status === "unpaid") {
        const updatedInvoice = await updateInvoiceStatusOnly(db, {
          invoiceId,
          teamId: invoice.teamId,
          status: "overdue",
        });

        this.logger.info("Invoice marked as overdue", { invoiceId });

        // Trigger notification
        if (updatedInvoice) {
          await triggerJob(
            "notification",
            {
              type: "invoice_overdue",
              teamId: invoice.teamId,
              invoiceId,
              invoiceNumber: updatedInvoice.invoiceNumber,
              customerName: updatedInvoice.customerName,
              source: "system",
              sendEmail: true,
            },
            "notifications",
          );
        }
      }
    }
  }
}
