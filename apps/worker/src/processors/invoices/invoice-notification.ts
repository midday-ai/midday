import { Notifications } from "@midday/notifications";
import type { Job } from "bullmq";
import type { InvoiceNotificationPayload } from "../../schemas/invoices";
import { getDb } from "../../utils/db";
import { sendToProviders } from "../../utils/provider-notifications";
import { BaseProcessor } from "../base";

/**
 * Invoice Notification Processor
 * Handles all invoice notification types (paid, overdue, sent, cancelled, scheduled, reminder_sent)
 * Sends email, in-app notifications via @midday/notifications
 * Sends Slack/WhatsApp notifications via sendToProviders
 */
export class InvoiceNotificationProcessor extends BaseProcessor<InvoiceNotificationPayload> {
  async process(job: Job<InvoiceNotificationPayload>): Promise<void> {
    const {
      type,
      invoiceId,
      invoiceNumber,
      teamId,
      customerName,
      paidAt,
      scheduledAt,
    } = job.data;

    this.logger.info("Processing invoice notification", {
      jobId: job.id,
      type,
      invoiceId,
      invoiceNumber,
      teamId,
    });

    const db = getDb();
    const notifications = new Notifications(db);

    switch (type) {
      case "paid": {
        // Create email and in-app notification
        await notifications.create(
          "invoice_paid",
          teamId,
          {
            invoiceId,
            invoiceNumber,
            customerName,
            paidAt,
            source: "system",
          },
          {
            sendEmail: true,
          },
        );

        // Send to external providers (Slack, WhatsApp)
        await sendToProviders(db, teamId, "invoice_paid", {
          invoiceId,
          invoiceNumber,
          customerName,
          paidAt,
        });

        this.logger.info("Invoice paid notification sent", {
          invoiceId,
          invoiceNumber,
          teamId,
        });
        break;
      }

      case "overdue": {
        await notifications.create(
          "invoice_overdue",
          teamId,
          {
            invoiceId,
            invoiceNumber,
            customerName: customerName || "Unknown",
            source: "system",
          },
          {
            sendEmail: true,
          },
        );

        await sendToProviders(db, teamId, "invoice_overdue", {
          invoiceId,
          invoiceNumber,
          customerName: customerName || "Unknown",
        });

        this.logger.info("Invoice overdue notification sent", {
          invoiceId,
          invoiceNumber,
          teamId,
        });
        break;
      }

      case "sent": {
        // Invoice sent notifications require token - these are typically triggered
        // elsewhere with full invoice data. Log warning if triggered without token.
        this.logger.warn(
          "Invoice sent notification should be triggered with token",
          {
            invoiceId,
            invoiceNumber,
            teamId,
          },
        );
        break;
      }

      case "cancelled": {
        await notifications.create(
          "invoice_cancelled",
          teamId,
          {
            invoiceId,
            invoiceNumber,
            customerName,
          },
          {
            sendEmail: false,
          },
        );

        this.logger.info("Invoice cancelled notification created", {
          invoiceId,
          invoiceNumber,
          teamId,
        });
        break;
      }

      case "scheduled": {
        await notifications.create(
          "invoice_scheduled",
          teamId,
          {
            invoiceId,
            invoiceNumber,
            scheduledAt: scheduledAt || new Date().toISOString(),
            customerName,
          },
          {
            sendEmail: false,
          },
        );

        this.logger.info("Invoice scheduled notification created", {
          invoiceId,
          invoiceNumber,
          teamId,
          scheduledAt,
        });
        break;
      }

      case "reminder_sent": {
        // Invoice reminder sent notifications require token - these are typically triggered
        // elsewhere with full invoice data. Log warning if triggered without token.
        this.logger.warn(
          "Invoice reminder sent notification should be triggered with token",
          {
            invoiceId,
            invoiceNumber,
            teamId,
          },
        );
        break;
      }

      case "refunded": {
        const { refundedAt } = job.data;

        // Create in-app notification for refund
        await notifications.create(
          "invoice_refunded",
          teamId,
          {
            invoiceId,
            invoiceNumber,
            customerName,
            refundedAt,
          },
          {
            sendEmail: false,
          },
        );

        this.logger.info("Invoice refunded notification created", {
          invoiceId,
          invoiceNumber,
          teamId,
        });
        break;
      }

      case "recurring_generated": {
        const { recurringSequence, recurringTotalCount } = job.data;

        // Create in-app notification for recurring invoice generation
        // Note: The email is sent via the generate-invoice task, so we only do in-app here
        this.logger.info("Recurring invoice generated", {
          invoiceId,
          invoiceNumber,
          teamId,
          sequence: recurringSequence,
          totalCount: recurringTotalCount,
        });
        break;
      }

      case "recurring_series_completed": {
        const { recurringId, recurringTotalCount } = job.data;

        // Log series completion (no dedicated notification type yet)
        this.logger.info("Recurring invoice series completed", {
          recurringId,
          teamId,
          invoiceNumber,
          customerName,
          totalCount: recurringTotalCount,
        });
        break;
      }

      case "recurring_series_paused": {
        const { recurringId } = job.data;

        // Log series paused (no dedicated notification type yet)
        // TODO: Add recurring_invoice_paused notification type to @midday/notifications
        this.logger.warn("Recurring invoice series paused due to errors", {
          recurringId,
          teamId,
        });
        break;
      }

      default: {
        this.logger.warn("Unknown invoice notification type", {
          type,
          invoiceId,
          teamId,
        });
      }
    }
  }
}
