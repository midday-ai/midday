import { Notifications } from "@midday/notifications";
import type { Job } from "bullmq";
import {
  type NotificationPayload,
  notificationPayloadSchema,
} from "../../schemas/notifications";
import { getDb } from "../../utils/db";
import { sendToProviders } from "../../utils/provider-notifications";
import { BaseProcessor } from "../base";

/**
 * Unified Notification Processor
 *
 * Handles most notification types through a single processor.
 * Uses Zod discriminated union for type-safe payload handling.
 *
 * Notification types handled here:
 * - insight_ready: Weekly/monthly AI insights are ready
 * - inbox_new: New items in inbox from email/sync/slack/upload
 * - document_uploaded: Document uploaded to vault
 * - document_processed: Document processed and classified
 * - invoice_paid, invoice_overdue, invoice_cancelled, etc.: Invoice events
 * - recurring_series_completed, recurring_series_paused: Recurring invoice events
 *
 * Notification types handled by dedicated processors (invoices queue):
 * - invoice_sent: Handled by SendInvoiceEmailProcessor (needs PDF, token, status update)
 * - invoice_reminder_sent: Handled by SendInvoiceReminderProcessor (needs token, BCC logic)
 */
export class NotificationProcessor extends BaseProcessor<NotificationPayload> {
  async process(job: Job<NotificationPayload>): Promise<void> {
    // Validate payload using Zod schema - fail fast on invalid data
    const parseResult = notificationPayloadSchema.safeParse(job.data);
    if (!parseResult.success) {
      this.logger.error("Invalid notification payload", {
        jobId: job.id,
        errors: parseResult.error.issues,
        data: job.data,
      });
      throw new Error(
        `Invalid notification payload: ${parseResult.error.message}`,
      );
    }

    const payload = parseResult.data;
    const db = getDb();
    const notifications = new Notifications(db);

    this.logger.info("Processing notification", {
      jobId: job.id,
      type: payload.type,
      teamId: payload.teamId,
    });

    // TypeScript automatically narrows the type based on the discriminant
    switch (payload.type) {
      // ========================================
      // Insight Notifications
      // ========================================
      case "insight_ready": {
        await notifications.create(
          "insight_ready",
          payload.teamId,
          {
            insightId: payload.insightId,
            periodType: payload.periodType,
            periodLabel: payload.periodLabel,
            periodNumber: payload.periodNumber,
            periodYear: payload.periodYear,
            title: payload.title,
            audioUrl: payload.audioUrl,
          },
          { sendEmail: true },
        );

        this.logger.info("Insight ready notification sent", {
          insightId: payload.insightId,
          teamId: payload.teamId,
          periodLabel: payload.periodLabel,
        });
        break;
      }

      // ========================================
      // Inbox Notifications
      // ========================================
      case "inbox_new": {
        await notifications.create(
          "inbox_new",
          payload.teamId,
          {
            totalCount: payload.totalCount,
            inboxType: payload.inboxType,
            source: payload.source,
            provider: payload.provider,
          },
          { sendEmail: false },
        );

        this.logger.info("Inbox new notification sent", {
          teamId: payload.teamId,
          totalCount: payload.totalCount,
          inboxType: payload.inboxType,
        });
        break;
      }

      // ========================================
      // Document Notifications
      // ========================================
      case "document_uploaded": {
        // Document uploaded is logged but typically doesn't need a notification
        this.logger.info("Document uploaded", {
          teamId: payload.teamId,
          fileName: payload.fileName,
        });
        break;
      }

      case "document_processed": {
        await notifications.create(
          "document_processed",
          payload.teamId,
          {
            fileName: payload.fileName,
            filePath: payload.filePath,
            mimeType: payload.mimeType,
          },
          { sendEmail: false },
        );

        this.logger.info("Document processed notification sent", {
          teamId: payload.teamId,
          fileName: payload.fileName,
        });
        break;
      }

      // ========================================
      // Invoice Notifications
      // ========================================
      case "invoice_paid": {
        await notifications.create(
          "invoice_paid",
          payload.teamId,
          {
            invoiceId: payload.invoiceId,
            invoiceNumber: payload.invoiceNumber,
            customerName: payload.customerName,
            paidAt: payload.paidAt,
            source: "system",
          },
          { sendEmail: true },
        );

        // Send to external providers (Slack, WhatsApp)
        await sendToProviders(db, payload.teamId, "invoice_paid", {
          invoiceId: payload.invoiceId,
          invoiceNumber: payload.invoiceNumber,
          customerName: payload.customerName,
          paidAt: payload.paidAt,
        });

        this.logger.info("Invoice paid notification sent", {
          invoiceId: payload.invoiceId,
          invoiceNumber: payload.invoiceNumber,
          teamId: payload.teamId,
        });
        break;
      }

      case "invoice_overdue": {
        await notifications.create(
          "invoice_overdue",
          payload.teamId,
          {
            invoiceId: payload.invoiceId,
            invoiceNumber: payload.invoiceNumber,
            customerName: payload.customerName || "Unknown",
            source: "system",
          },
          { sendEmail: true },
        );

        await sendToProviders(db, payload.teamId, "invoice_overdue", {
          invoiceId: payload.invoiceId,
          invoiceNumber: payload.invoiceNumber,
          customerName: payload.customerName || "Unknown",
        });

        this.logger.info("Invoice overdue notification sent", {
          invoiceId: payload.invoiceId,
          invoiceNumber: payload.invoiceNumber,
          teamId: payload.teamId,
        });
        break;
      }

      case "invoice_sent": {
        // Invoice sent emails are handled by SendInvoiceEmailProcessor in the invoices queue.
        // That processor fetches the full invoice (including token for payment link),
        // downloads PDF attachments, handles BCC logic, and updates invoice status.
        // If this case is triggered, it indicates a routing mistake.
        this.logger.warn(
          "invoice_sent should be routed to invoices queue (send-invoice-email job)",
          {
            invoiceId: payload.invoiceId,
            invoiceNumber: payload.invoiceNumber,
            teamId: payload.teamId,
          },
        );
        break;
      }

      case "invoice_cancelled": {
        await notifications.create(
          "invoice_cancelled",
          payload.teamId,
          {
            invoiceId: payload.invoiceId,
            invoiceNumber: payload.invoiceNumber,
            customerName: payload.customerName,
          },
          { sendEmail: false },
        );

        this.logger.info("Invoice cancelled notification created", {
          invoiceId: payload.invoiceId,
          invoiceNumber: payload.invoiceNumber,
          teamId: payload.teamId,
        });
        break;
      }

      case "invoice_scheduled": {
        await notifications.create(
          "invoice_scheduled",
          payload.teamId,
          {
            invoiceId: payload.invoiceId,
            invoiceNumber: payload.invoiceNumber,
            scheduledAt: payload.scheduledAt,
            customerName: payload.customerName,
          },
          { sendEmail: false },
        );

        this.logger.info("Invoice scheduled notification created", {
          invoiceId: payload.invoiceId,
          invoiceNumber: payload.invoiceNumber,
          teamId: payload.teamId,
          scheduledAt: payload.scheduledAt,
        });
        break;
      }

      case "invoice_reminder_sent": {
        // Invoice reminder emails are handled by SendInvoiceReminderProcessor in the invoices queue.
        // That processor fetches the full invoice (including token for payment link)
        // and handles BCC logic for billing emails.
        // If this case is triggered, it indicates a routing mistake.
        this.logger.warn(
          "invoice_reminder_sent should be routed to invoices queue (send-invoice-reminder job)",
          {
            invoiceId: payload.invoiceId,
            invoiceNumber: payload.invoiceNumber,
            teamId: payload.teamId,
          },
        );
        break;
      }

      case "invoice_refunded": {
        await notifications.create(
          "invoice_refunded",
          payload.teamId,
          {
            invoiceId: payload.invoiceId,
            invoiceNumber: payload.invoiceNumber,
            customerName: payload.customerName,
            refundedAt: payload.refundedAt,
          },
          { sendEmail: false },
        );

        this.logger.info("Invoice refunded notification created", {
          invoiceId: payload.invoiceId,
          invoiceNumber: payload.invoiceNumber,
          teamId: payload.teamId,
        });
        break;
      }

      case "invoice_recurring_generated": {
        // Create in-app notification for recurring invoice generation
        // Note: The email is sent via the generate-invoice task, so we only do in-app here
        await notifications.create(
          "invoice_created",
          payload.teamId,
          {
            invoiceId: payload.invoiceId,
            invoiceNumber: payload.invoiceNumber,
            customerName: payload.customerName,
          },
          { sendEmail: false },
        );

        this.logger.info("Recurring invoice generated notification created", {
          invoiceId: payload.invoiceId,
          invoiceNumber: payload.invoiceNumber,
          teamId: payload.teamId,
          sequence: payload.recurringSequence,
          totalCount: payload.recurringTotalCount,
        });
        break;
      }

      case "recurring_series_completed": {
        await notifications.create(
          "recurring_series_completed",
          payload.teamId,
          {
            invoiceId: payload.invoiceId,
            invoiceNumber: payload.invoiceNumber,
            customerName: payload.customerName,
            recurringId: payload.recurringId,
            totalGenerated: payload.totalGenerated,
          },
          { sendEmail: false },
        );

        this.logger.info("Recurring invoice series completed", {
          recurringId: payload.recurringId,
          teamId: payload.teamId,
          invoiceNumber: payload.invoiceNumber,
          customerName: payload.customerName,
          totalGenerated: payload.totalGenerated,
        });
        break;
      }

      case "recurring_series_paused": {
        await notifications.create(
          "recurring_series_paused",
          payload.teamId,
          {
            recurringId: payload.recurringId,
            customerName: payload.customerName,
            reason: "auto_failure",
            failureCount: 3,
          },
          { sendEmail: false },
        );

        this.logger.warn("Recurring invoice series paused due to errors", {
          recurringId: payload.recurringId,
          teamId: payload.teamId,
        });
        break;
      }

      default: {
        this.logger.warn("Unknown notification type", {
          type: (payload as { type: string }).type,
          teamId: (payload as { teamId: string }).teamId,
        });
      }
    }
  }
}
