import { getUnpaidInvoices } from "@midday/db/queries";
import { triggerJob } from "@midday/job-client";
import type { Job } from "bullmq";
import {
  type InvoiceStatusSchedulerPayload,
  invoiceStatusSchedulerSchema,
} from "../../schemas/invoices";
import { getDb } from "../../utils/db";
import { BaseProcessor } from "../base";

/**
 * Scheduled job that runs twice daily to check status of unpaid/overdue invoices.
 * Triggers check-invoice-status jobs for each invoice.
 */
export class InvoiceStatusSchedulerProcessor extends BaseProcessor<InvoiceStatusSchedulerPayload> {
  protected getPayloadSchema() {
    return invoiceStatusSchedulerSchema;
  }

  async process(job: Job<InvoiceStatusSchedulerPayload>): Promise<void> {
    // Only run in production
    if (process.env.NODE_ENV !== "production") {
      this.logger.info("Skipping invoice status scheduler in non-production");
      return;
    }

    const db = getDb();

    // Get all unpaid and overdue invoices
    const invoices = await getUnpaidInvoices(db, {
      statuses: ["unpaid", "overdue"],
    });

    if (!invoices || invoices.length === 0) {
      this.logger.info("No unpaid invoices to check");
      return;
    }

    this.logger.info("Checking invoice statuses", {
      count: invoices.length,
    });

    // Trigger check-invoice-status for each invoice
    const promises = invoices.map((invoice) =>
      triggerJob("check-invoice-status", { invoiceId: invoice.id }, "invoices"),
    );

    await Promise.all(promises);

    this.logger.info("Invoice status check jobs triggered", {
      count: invoices.length,
    });
  }
}
