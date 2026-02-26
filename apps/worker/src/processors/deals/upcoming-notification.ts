import {
  getUpcomingDueRecurring,
  markUpcomingNotificationSent,
} from "@midday/db/queries";
import { Notifications } from "@midday/notifications";
import type { Job } from "bullmq";
import type { DealUpcomingNotificationPayload } from "../../schemas/deals";
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
 * Scheduled processor that sends notifications for upcoming recurring deals
 * Runs every 2 hours (offset from the generation scheduler) to notify users
 * about deals that will be generated in the next 24 hours
 *
 * This gives users time to:
 * - Review the recurring series settings
 * - Pause the series if needed
 * - Update details before the deal goes out
 *
 * Notifications are batched per team - if a team has multiple recurring deals
 * due on the same day, they receive a single summary notification.
 */
export class DealUpcomingNotificationProcessor extends BaseProcessor<DealUpcomingNotificationPayload> {
  async process(
    job: Job<DealUpcomingNotificationPayload>,
  ): Promise<ProcessResult> {
    // Kill switch - can be toggled without deploy via environment variable
    if (process.env.DISABLE_UPCOMING_NOTIFICATIONS === "true") {
      this.logger.warn(
        "Upcoming deal notifications disabled via DISABLE_UPCOMING_NOTIFICATIONS",
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
        "[STAGING MODE] Upcoming deal notification processor - logging only, no execution",
      );

      const { data: upcomingRecurring, hasMore } =
        await getUpcomingDueRecurring(db, 24);

      if (upcomingRecurring.length === 0) {
        this.logger.info("[STAGING] No upcoming deals to notify about");
        return {
          processed: 0,
          skipped: 0,
          failed: 0,
          errors: [],
          hasMore: false,
        };
      }

      // Group deals by teamId for logging
      const dealsByTeam = new Map<string, typeof upcomingRecurring>();
      for (const deal of upcomingRecurring) {
        const existing = dealsByTeam.get(deal.teamId) || [];
        existing.push(deal);
        dealsByTeam.set(deal.teamId, existing);
      }

      this.logger.info(
        `[STAGING] Would notify ${dealsByTeam.size} teams about ${upcomingRecurring.length} upcoming deals${hasMore ? " (more pending)" : ""}`,
        {
          teamCount: dealsByTeam.size,
          dealCount: upcomingRecurring.length,
          hasMore,
          teams: Array.from(dealsByTeam.entries()).map(
            ([teamId, deals]) => ({
              teamId,
              dealCount: deals.length,
              deals: deals.map((d) => ({
                recurringId: d.id,
                merchantName: d.merchantName,
                amount: d.amount,
                currency: d.currency,
                scheduledAt: d.nextScheduledAt,
              })),
            }),
          ),
        },
      );

      // Return simulated results
      return {
        processed: dealsByTeam.size,
        skipped: 0,
        failed: 0,
        errors: [],
        hasMore,
      };
    }

    const notifications = new Notifications(db);

    this.logger.info("Starting upcoming deal notification processor");

    // Get recurring deals due within 24 hours that haven't been notified (batched, default limit: 100)
    const { data: upcomingRecurring, hasMore } = await getUpcomingDueRecurring(
      db,
      24,
    );

    if (upcomingRecurring.length === 0) {
      this.logger.info("No upcoming deals to notify about");
      return {
        processed: 0,
        skipped: 0,
        failed: 0,
        errors: [],
        hasMore: false,
      };
    }

    this.logger.info(
      `Found ${upcomingRecurring.length} upcoming deals to notify about${hasMore ? " (more pending)" : ""}`,
      { count: upcomingRecurring.length, hasMore },
    );

    // Filter out deals that have already been notified for this cycle
    const eligibleDeals = upcomingRecurring.filter((recurring) => {
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

    const skipped = upcomingRecurring.length - eligibleDeals.length;

    if (eligibleDeals.length === 0) {
      this.logger.info("All upcoming deals already notified");
      return {
        processed: 0,
        skipped,
        failed: 0,
        errors: [],
        hasMore,
      };
    }

    // Group deals by teamId for batched notifications
    const dealsByTeam = new Map<string, typeof eligibleDeals>();

    for (const deal of eligibleDeals) {
      const existing = dealsByTeam.get(deal.teamId) || [];
      existing.push(deal);
      dealsByTeam.set(deal.teamId, existing);
    }

    this.logger.info(
      `Grouped ${eligibleDeals.length} deals into ${dealsByTeam.size} teams`,
    );

    const errors: Array<{ teamId: string; error: string }> = [];
    let processed = 0;
    let failed = 0;

    // Process each team's batch
    for (const [teamId, teamDeals] of dealsByTeam.entries()) {
      try {
        // Create batched notification for the team
        await notifications.create(
          "recurring_deal_upcoming",
          teamId,
          {
            deals: teamDeals.map((d) => ({
              recurringId: d.id,
              merchantName: d.merchantName ?? undefined,
              amount: d.amount ?? undefined,
              currency: d.currency ?? undefined,
              scheduledAt: d.nextScheduledAt!,
              frequency: d.frequency,
            })),
            count: teamDeals.length,
          },
          { sendEmail: true },
        );

        // Mark all deals in this batch as notified
        for (const deal of teamDeals) {
          await markUpcomingNotificationSent(db, {
            id: deal.id,
            teamId: deal.teamId,
          });
        }

        this.logger.info("Sent batched upcoming deal notification", {
          teamId,
          dealCount: teamDeals.length,
          merchantNames: teamDeals
            .map((d) => d.merchantName)
            .filter(Boolean),
        });

        processed++;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        this.logger.error(
          "Failed to send batched upcoming deal notification",
          {
            teamId,
            dealCount: teamDeals.length,
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

    this.logger.info("Upcoming deal notification processor completed", {
      teamsProcessed: processed,
      teamsFailed: failed,
      dealsSkipped: skipped,
      totalDeals: upcomingRecurring.length,
      hasMore,
    });

    if (hasMore) {
      this.logger.info(
        "More upcoming deals pending - will be processed in next scheduler run",
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
