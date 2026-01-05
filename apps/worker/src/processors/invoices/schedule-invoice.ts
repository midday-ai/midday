import { getInvoiceById, updateInvoice } from "@midday/db/queries";
import type { Job } from "bullmq";
import { DEFAULT_JOB_OPTIONS } from "../../config/job-options";
import { invoicesQueue } from "../../queues/invoices";
import type { ScheduleInvoicePayload } from "../../schemas/invoices";
import { getDb } from "../../utils/db";
import { BaseProcessor } from "../base";

/**
 * Schedule Invoice Processor
 * Handles executing scheduled invoices when their scheduled time arrives.
 * This processor is triggered by a delayed job when the scheduled time is reached.
 */
export class ScheduleInvoiceProcessor extends BaseProcessor<ScheduleInvoicePayload> {
  async process(job: Job<ScheduleInvoicePayload>): Promise<void> {
    const { invoiceId } = job.data;
    const db = getDb();

    this.logger.info("Processing scheduled invoice", {
      jobId: job.id,
      invoiceId,
    });

    // Get the invoice to verify it's still scheduled (teamId optional)
    const invoice = await getInvoiceById(db, { id: invoiceId });

    if (!invoice) {
      this.logger.error("Invoice not found", { invoiceId });
      // Don't throw - invoice may have been deleted
      return;
    }

    if (invoice.status !== "scheduled") {
      this.logger.info("Invoice is no longer scheduled, skipping", {
        invoiceId,
        status: invoice.status,
      });
      // Don't throw - this is expected if invoice was cancelled or already sent
      return;
    }

    // Verify this job is the currently scheduled one for this invoice
    // This prevents stale jobs from processing if a reschedule failed to remove the old job
    if (invoice.scheduledJobId !== job.id) {
      this.logger.info("Stale scheduled job detected, skipping", {
        invoiceId,
        currentJobId: job.id,
        expectedJobId: invoice.scheduledJobId,
      });
      // Don't throw - this is expected if invoice was rescheduled
      return;
    }

    // Update invoice status to unpaid before generating
    const updated = await updateInvoice(db, {
      id: invoiceId,
      teamId: invoice.teamId,
      status: "unpaid",
      // Clear the scheduled job id since it has now executed
      scheduledJobId: null,
    });

    if (!updated) {
      this.logger.error("Failed to update invoice status", { invoiceId });
      throw new Error("Failed to update invoice status");
    }

    // Queue the generate-invoice job to create PDF and send email
    await invoicesQueue.add(
      "generate-invoice",
      {
        invoiceId,
        deliveryType: "create_and_send",
      },
      DEFAULT_JOB_OPTIONS,
    );

    this.logger.info("Scheduled invoice queued for generation", {
      invoiceId,
    });
  }
}
