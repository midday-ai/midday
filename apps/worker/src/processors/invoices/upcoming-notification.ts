import {
  getUpcomingDueRecurring,
  markUpcomingNotificationSent,
} from "@midday/db/queries";
import { Notifications } from "@midday/notifications";
import type { Job } from "bullmq";
import type { InvoiceUpcomingNotificationPayload } from "../../schemas/invoices";
import { getDb } from "../../utils/db";
import { isStaging } from "../../utils/env";
import { BaseProcessor } from "../base";

type ProcessResult = {
  processed: number;
  skipped: number;
  failed: number;
  errors: Array<{ teamId: string; error: string }>;
  hasMore: boolean;
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
 *
 * Notifications are batched per team - if a team has multiple recurring invoices
 * due on the same day, they receive a single summary notification.
 */
export class InvoiceUpcomingNotificationProcessor extends BaseProcessor<InvoiceUpcomingNotificationPayload> {
  async process(
    _job: Job<InvoiceUpcomingNotificationPayload>,
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
        hasMore: false,
      };
    }

    const db = getDb();

    // In staging, log what would happen but don't execute
    if (isStaging()) {
      this.logger.info(
        "[STAGING MODE] Upcoming invoice notification processor - logging only, no execution",
      );

      const { data: upcomingRecurring, hasMore } =
        await getUpcomingDueRecurring(db, 24);

      if (upcomingRecurring.length === 0) {
        this.logger.info("[STAGING] No upcoming invoices to notify about");
        return {
          processed: 0,
          skipped: 0,
          failed: 0,
          errors: [],
          hasMore: false,
        };
      }

      // Group invoices by teamId for logging
      const invoicesByTeam = new Map<string, typeof upcomingRecurring>();
      for (const invoice of upcomingRecurring) {
        const existing = invoicesByTeam.get(invoice.teamId) || [];
        existing.push(invoice);
        invoicesByTeam.set(invoice.teamId, existing);
      }

      this.logger.info(
        `[STAGING] Would notify ${invoicesByTeam.size} teams about ${upcomingRecurring.length} upcoming invoices${hasMore ? " (more pending)" : ""}`,
        {
          teamCount: invoicesByTeam.size,
          invoiceCount: upcomingRecurring.length,
          hasMore,
          teams: Array.from(invoicesByTeam.entries()).map(
            ([teamId, invoices]) => ({
              teamId,
              invoiceCount: invoices.length,
              invoices: invoices.map((inv) => ({
                recurringId: inv.id,
                customerName: inv.customerName,
                amount: inv.amount,
                currency: inv.currency,
                scheduledAt: inv.nextScheduledAt,
              })),
            }),
          ),
        },
      );

      // Return simulated results
      return {
        processed: invoicesByTeam.size,
        skipped: 0,
        failed: 0,
        errors: [],
        hasMore,
      };
    }

    const notifications = new Notifications(db);

    this.logger.info("Starting upcoming invoice notification processor");

    // Get recurring invoices due within 24 hours that haven't been notified (batched, default limit: 100)
    const { data: upcomingRecurring, hasMore } = await getUpcomingDueRecurring(
      db,
      24,
    );

    if (upcomingRecurring.length === 0) {
      this.logger.info("No upcoming invoices to notify about");
      return {
        processed: 0,
        skipped: 0,
        failed: 0,
        errors: [],
        hasMore: false,
      };
    }

    this.logger.info(
      `Found ${upcomingRecurring.length} upcoming invoices to notify about${hasMore ? " (more pending)" : ""}`,
      { count: upcomingRecurring.length, hasMore },
    );

    // Filter out invoices that have already been notified for this cycle
    const eligibleInvoices = upcomingRecurring.filter((recurring) => {
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
              upcomingNotificationSentAt: recurring.upcomingNotificationSentAt,
              nextScheduledAt: recurring.nextScheduledAt,
            },
          );
          return false;
        }
      }
      return true;
    });

    const skipped = upcomingRecurring.length - eligibleInvoices.length;

    if (eligibleInvoices.length === 0) {
      this.logger.info("All upcoming invoices already notified");
      return {
        processed: 0,
        skipped,
        failed: 0,
        errors: [],
        hasMore,
      };
    }

    // Group invoices by teamId for batched notifications
    const invoicesByTeam = new Map<string, typeof eligibleInvoices>();

    for (const invoice of eligibleInvoices) {
      const existing = invoicesByTeam.get(invoice.teamId) || [];
      existing.push(invoice);
      invoicesByTeam.set(invoice.teamId, existing);
    }

    this.logger.info(
      `Grouped ${eligibleInvoices.length} invoices into ${invoicesByTeam.size} teams`,
    );

    const errors: Array<{ teamId: string; error: string }> = [];
    let processed = 0;
    let failed = 0;

    // Process each team's batch
    for (const [teamId, teamInvoices] of invoicesByTeam.entries()) {
      try {
        // Create batched notification for the team
        await notifications.create(
          "recurring_invoice_upcoming",
          teamId,
          {
            invoices: teamInvoices.map((inv) => ({
              recurringId: inv.id,
              customerName: inv.customerName ?? undefined,
              amount: inv.amount ?? undefined,
              currency: inv.currency ?? undefined,
              scheduledAt: inv.nextScheduledAt!,
              frequency: inv.frequency,
            })),
            count: teamInvoices.length,
          },
          { sendEmail: true },
        );

        // Mark all invoices in this batch as notified
        for (const invoice of teamInvoices) {
          await markUpcomingNotificationSent(db, {
            id: invoice.id,
            teamId: invoice.teamId,
          });
        }

        this.logger.info("Sent batched upcoming invoice notification", {
          teamId,
          invoiceCount: teamInvoices.length,
          customerNames: teamInvoices
            .map((inv) => inv.customerName)
            .filter(Boolean),
        });

        processed++;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        this.logger.error(
          "Failed to send batched upcoming invoice notification",
          {
            teamId,
            invoiceCount: teamInvoices.length,
            error: errorMessage,
          },
        );

        errors.push({
          teamId,
          error: errorMessage,
        });
        failed++;
      }
    }

    this.logger.info("Upcoming invoice notification processor completed", {
      teamsProcessed: processed,
      teamsFailed: failed,
      invoicesSkipped: skipped,
      totalInvoices: upcomingRecurring.length,
      hasMore,
    });

    if (hasMore) {
      this.logger.info(
        "More upcoming invoices pending - will be processed in next scheduler run",
      );
    }

    return {
      processed,
      skipped,
      failed,
      errors,
      hasMore,
    };
  }
}
