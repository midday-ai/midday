import {
  getUpcomingDueRecurring,
  markUpcomingNotificationSent,
} from "@midday/db/queries";
import { Notifications } from "@midday/notifications";
import type { Job } from "bullmq";
import type { InvoiceUpcomingNotificationPayload } from "../../schemas/invoices";
import { getDb } from "../../utils/db";
import { BaseProcessor } from "../base";

type ProcessResult = {
  processed: number;
  skipped: number;
  failed: number;
  errors: Array<{ recurringId: string; error: string }>;
};

/**
 * Scheduled processor that sends notifications for upcoming recurring invoices
 * Runs every 2 hours (offset from the generation scheduler) to notify users
 * about invoices that will be generated in the next 24 hours
 *
 * This gives users time to:
 * - Review the recurring series settings
 * - Pause the series if needed
 * - Update details before the invoice goes out
 */
export class InvoiceUpcomingNotificationProcessor extends BaseProcessor<InvoiceUpcomingNotificationPayload> {
  async process(
    job: Job<InvoiceUpcomingNotificationPayload>,
  ): Promise<ProcessResult> {
    // Kill switch - can be toggled without deploy via environment variable
    if (process.env.DISABLE_UPCOMING_NOTIFICATIONS === "true") {
      this.logger.warn(
        "Upcoming invoice notifications disabled via DISABLE_UPCOMING_NOTIFICATIONS",
      );
      return {
        processed: 0,
        skipped: 0,
        failed: 0,
        errors: [],
      };
    }

    const db = getDb();
    const notifications = new Notifications(db);

    this.logger.info("Starting upcoming invoice notification processor");

    // Get all recurring invoices due within 24 hours that haven't been notified
    const upcomingRecurring = await getUpcomingDueRecurring(db, 24);

    if (upcomingRecurring.length === 0) {
      this.logger.info("No upcoming invoices to notify about");
      return {
        processed: 0,
        skipped: 0,
        failed: 0,
        errors: [],
      };
    }

    this.logger.info(
      `Found ${upcomingRecurring.length} upcoming invoices to notify about`,
    );

    const errors: Array<{ recurringId: string; error: string }> = [];
    let processed = 0;
    let skipped = 0;
    let failed = 0;

    for (const recurring of upcomingRecurring) {
      try {
        // Double-check we haven't already sent notification for this cycle
        // This handles race conditions if the processor runs twice quickly
        if (recurring.upcomingNotificationSentAt && recurring.nextScheduledAt) {
          const notificationSentAt = new Date(
            recurring.upcomingNotificationSentAt,
          );
          const nextScheduled = new Date(recurring.nextScheduledAt);
          // If notification was sent within 25 hours of nextScheduled, it's for this cycle
          const hoursDiff =
            (nextScheduled.getTime() - notificationSentAt.getTime()) /
            (1000 * 60 * 60);
          if (hoursDiff <= 25) {
            this.logger.info(
              "Notification already sent for this cycle, skipping",
              {
                recurringId: recurring.id,
                upcomingNotificationSentAt:
                  recurring.upcomingNotificationSentAt,
                nextScheduledAt: recurring.nextScheduledAt,
              },
            );
            skipped++;
            continue;
          }
        }

        // Create the notification
        await notifications.create(
          "recurring_invoice_upcoming",
          recurring.teamId,
          {
            recurringId: recurring.id,
            customerName: recurring.customerName ?? undefined,
            amount: recurring.amount ?? undefined,
            currency: recurring.currency ?? undefined,
            scheduledAt: recurring.nextScheduledAt!,
            frequency: recurring.frequency,
          },
        );

        // Mark notification as sent
        await markUpcomingNotificationSent(db, {
          id: recurring.id,
          teamId: recurring.teamId,
        });

        this.logger.info("Sent upcoming invoice notification", {
          recurringId: recurring.id,
          teamId: recurring.teamId,
          customerName: recurring.customerName,
          nextScheduledAt: recurring.nextScheduledAt,
        });

        processed++;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        this.logger.error("Failed to send upcoming invoice notification", {
          recurringId: recurring.id,
          error: errorMessage,
        });

        errors.push({
          recurringId: recurring.id,
          error: errorMessage,
        });
        failed++;
      }
    }

    this.logger.info("Upcoming invoice notification processor completed", {
      processed,
      skipped,
      failed,
      total: upcomingRecurring.length,
    });

    return {
      processed,
      skipped,
      failed,
      errors,
    };
  }
}
