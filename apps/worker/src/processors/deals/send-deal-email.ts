import { getDealById, updateDeal } from "@midday/db/queries";
import { Notifications } from "@midday/notifications";
import { createClient } from "@midday/supabase/job";
import type { Job } from "bullmq";
import type { SendDealEmailPayload } from "../../schemas/deals";
import { getDb } from "../../utils/db";
import { BaseProcessor } from "../base";

/**
 * Send Deal Email Processor
 * Handles sending the deal email with optional PDF attachment
 */
export class SendDealEmailProcessor extends BaseProcessor<SendDealEmailPayload> {
  async process(job: Job<SendDealEmailPayload>): Promise<void> {
    const { dealId, filename, fullPath } = job.data;
    const db = getDb();
    // Supabase client is needed for storage operations only
    const supabase = createClient();
    const notifications = new Notifications(db);

    this.logger.info("Starting send deal email", {
      jobId: job.id,
      dealId,
      filename,
    });

    // Fetch deal with related data
    const deal = await getDealById(db, { id: dealId });

    if (!deal) {
      this.logger.error("Deal not found", { dealId });
      throw new Error(`Deal not found: ${dealId}`);
    }

    let attachments: { content: string; filename: string }[] | undefined;

    // Download PDF attachment if template includes PDF
    const template = deal.template as Record<string, unknown> | null;
    if (template?.includePdf) {
      const { data: attachmentData } = await supabase.storage
        .from("vault")
        .download(fullPath);

      if (attachmentData) {
        attachments = [
          {
            content: Buffer.from(await attachmentData.arrayBuffer()).toString(
              "base64",
            ),
            filename,
          },
        ];
        this.logger.debug("PDF attachment prepared", { dealId });
      }
    }

    const merchantEmail = deal.merchant?.email;
    const userEmail = deal.user?.email;
    const shouldSendCopy = template?.sendCopy;

    // Parse billing emails (supports comma-separated list)
    const billingEmails = deal.merchant?.billingEmail
      ? deal.merchant.billingEmail
          .split(",")
          .map((e) => e.trim())
          .filter(Boolean)
      : [];

    // Build BCC list
    const bcc = [
      ...billingEmails,
      ...(shouldSendCopy && userEmail ? [userEmail] : []),
    ];

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

    // Send notification (email)
    try {
      await notifications.create(
        "deal_sent",
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
          bcc,
          attachments,
          replyTo: deal.team?.email ?? undefined,
        },
      );
    } catch (error) {
      this.logger.error("Failed to send deal email", {
        dealId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw new Error("Deal email failed to send");
    }

    this.logger.debug("Deal email sent", { dealId, merchantEmail });

    // Update deal status using Drizzle
    const updated = await updateDeal(db, {
      id: dealId,
      teamId: deal.teamId,
      status: "unpaid",
      sentTo: merchantEmail,
      sentAt: new Date().toISOString(),
    });

    if (!updated) {
      this.logger.error("Failed to update deal status after email", {
        dealId,
      });
      // Don't throw here - email was sent successfully
    }

    this.logger.info("Send deal email completed", {
      dealId,
      merchantEmail,
    });
  }
}
