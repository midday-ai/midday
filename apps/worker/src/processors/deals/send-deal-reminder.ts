import { getDealById } from "@midday/db/queries";
import { Notifications } from "@midday/notifications";
import type { Job } from "bullmq";
import type { SendDealReminderPayload } from "../../schemas/deals";
import { getDb } from "../../utils/db";
import { BaseProcessor } from "../base";

/**
 * Send Deal Reminder Processor
 * Handles sending reminder emails for unpaid/overdue deals
 */
export class SendDealReminderProcessor extends BaseProcessor<SendDealReminderPayload> {
  async process(job: Job<SendDealReminderPayload>): Promise<void> {
    const { dealId } = job.data;
    const db = getDb();
    const notifications = new Notifications(db);

    this.logger.info("Starting send deal reminder", {
      jobId: job.id,
      dealId,
    });

    // Fetch deal with related data
    const deal = await getDealById(db, { id: dealId });

    if (!deal) {
      this.logger.error("Deal not found", { dealId });
      throw new Error(`Deal not found: ${dealId}`);
    }

    const merchantEmail = deal.merchant?.email;

    if (!merchantEmail) {
      this.logger.error("Deal merchant email not found", { dealId });
      throw new Error(`Deal merchant email not found: ${dealId}`);
    }

    if (!deal.dealNumber || !deal.merchant?.name) {
      this.logger.error("Deal missing required fields", {
        dealId,
        hasDealNumber: !!deal.dealNumber,
        hasMerchantName: !!deal.merchant?.name,
      });
      throw new Error(`Deal missing required fields: ${dealId}`);
    }

    // Send reminder notification (email)
    try {
      await notifications.create(
        "deal_reminder_sent",
        deal.teamId,
        {
          dealId,
          dealNumber: deal.dealNumber,
          merchantName: deal.merchant.name,
          merchantEmail,
          token: deal.token,
        },
        {
          sendEmail: true,
          replyTo: deal.team?.email ?? undefined,
        },
      );
    } catch (error) {
      this.logger.error("Failed to send deal reminder email", {
        dealId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw new Error("Deal reminder email failed to send");
    }

    this.logger.info("Deal reminder email sent", {
      dealId,
      merchantEmail,
    });
  }
}
