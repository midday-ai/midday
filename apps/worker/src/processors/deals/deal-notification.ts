import { Notifications } from "@midday/notifications";
import type { Job } from "bullmq";
import type { DealNotificationPayload } from "../../schemas/deals";
import { getDb } from "../../utils/db";
import { sendToProviders } from "../../utils/provider-notifications";
import { BaseProcessor } from "../base";

/**
 * Deal Notification Processor
 * Handles all deal notification types (paid, overdue, sent, cancelled, scheduled, reminder_sent)
 * Sends email, in-app notifications via @midday/notifications
 * Sends WhatsApp notifications via sendToProviders
 */
export class DealNotificationProcessor extends BaseProcessor<DealNotificationPayload> {
  async process(job: Job<DealNotificationPayload>): Promise<void> {
    const {
      type,
      dealId,
      dealNumber,
      teamId,
      merchantName,
      paidAt,
      scheduledAt,
    } = job.data;

    this.logger.info("Processing deal notification", {
      jobId: job.id,
      type,
      dealId,
      dealNumber,
      teamId,
    });

    const db = getDb();
    const notifications = new Notifications(db);

    switch (type) {
      case "paid": {
        // Create email and in-app notification
        await notifications.create(
          "deal_paid",
          teamId,
          {
            dealId,
            dealNumber,
            merchantName,
            paidAt,
            source: "system",
          },
          {
            sendEmail: true,
          },
        );

        // Send to external providers (WhatsApp, etc.)
        await sendToProviders(db, teamId, "deal_paid", {
          dealId,
          dealNumber,
          merchantName,
          paidAt,
        });

        this.logger.info("Deal paid notification sent", {
          dealId,
          dealNumber,
          teamId,
        });
        break;
      }

      case "overdue": {
        await notifications.create(
          "deal_overdue",
          teamId,
          {
            dealId,
            dealNumber,
            merchantName: merchantName || "Unknown",
            source: "system",
          },
          {
            sendEmail: true,
          },
        );

        await sendToProviders(db, teamId, "deal_overdue", {
          dealId,
          dealNumber,
          merchantName: merchantName || "Unknown",
        });

        this.logger.info("Deal overdue notification sent", {
          dealId,
          dealNumber,
          teamId,
        });
        break;
      }

      case "sent": {
        // Deal sent notifications require token - these are typically triggered
        // elsewhere with full deal data. Log warning if triggered without token.
        this.logger.warn(
          "Deal sent notification should be triggered with token",
          {
            dealId,
            dealNumber,
            teamId,
          },
        );
        break;
      }

      case "cancelled": {
        await notifications.create(
          "deal_cancelled",
          teamId,
          {
            dealId,
            dealNumber,
            merchantName,
          },
          {
            sendEmail: false,
          },
        );

        this.logger.info("Deal cancelled notification created", {
          dealId,
          dealNumber,
          teamId,
        });
        break;
      }

      case "scheduled": {
        await notifications.create(
          "deal_scheduled",
          teamId,
          {
            dealId,
            dealNumber,
            scheduledAt: scheduledAt || new Date().toISOString(),
            merchantName,
          },
          {
            sendEmail: false,
          },
        );

        this.logger.info("Deal scheduled notification created", {
          dealId,
          dealNumber,
          teamId,
          scheduledAt,
        });
        break;
      }

      case "reminder_sent": {
        // Deal reminder sent notifications require token - these are typically triggered
        // elsewhere with full deal data. Log warning if triggered without token.
        this.logger.warn(
          "Deal reminder sent notification should be triggered with token",
          {
            dealId,
            dealNumber,
            teamId,
          },
        );
        break;
      }

      case "refunded": {
        const { refundedAt } = job.data;

        // Create in-app notification for refund
        await notifications.create(
          "deal_refunded",
          teamId,
          {
            dealId,
            dealNumber,
            merchantName,
            refundedAt,
          },
          {
            sendEmail: false,
          },
        );

        this.logger.info("Deal refunded notification created", {
          dealId,
          dealNumber,
          teamId,
        });
        break;
      }

      case "recurring_generated": {
        const { recurringSequence, recurringTotalCount } = job.data;

        // Create in-app notification for recurring deal generation
        // Note: The email is sent via the generate-deal task, so we only do in-app here
        await notifications.create(
          "deal_created",
          teamId,
          {
            dealId,
            dealNumber,
            merchantName,
          },
          {
            sendEmail: false, // Email is handled by generate-deal task
          },
        );

        this.logger.info("Recurring deal generated notification created", {
          dealId,
          dealNumber,
          teamId,
          sequence: recurringSequence,
          totalCount: recurringTotalCount,
        });
        break;
      }

      case "recurring_series_completed": {
        const { recurringId, recurringTotalCount, recurringSequence } =
          job.data;

        // Create in-app notification for series completion
        await notifications.create(
          "recurring_series_completed",
          teamId,
          {
            dealId,
            dealNumber,
            merchantName,
            recurringId: recurringId ?? dealId,
            totalGenerated: recurringTotalCount ?? recurringSequence ?? 0,
          },
          {
            sendEmail: false,
          },
        );

        this.logger.info("Recurring deal series completed", {
          recurringId,
          teamId,
          dealNumber,
          merchantName,
          totalGenerated: recurringTotalCount ?? recurringSequence,
        });
        break;
      }

      case "recurring_series_paused": {
        const { recurringId } = job.data;

        // Create in-app notification for series paused
        await notifications.create(
          "recurring_series_paused",
          teamId,
          {
            recurringId: recurringId ?? dealId,
            merchantName,
            reason: "auto_failure",
            failureCount: 3,
          },
          {
            sendEmail: false,
          },
        );

        this.logger.warn("Recurring deal series paused due to errors", {
          recurringId,
          teamId,
        });
        break;
      }

      default: {
        this.logger.warn("Unknown deal notification type", {
          type,
          dealId,
          teamId,
        });
      }
    }
  }
}
