import { sendSlackMatchNotification } from "@midday/app-store/slack/server";
import { getInboxById, getTransactionById } from "@midday/db/queries";
import { Notifications } from "@midday/notifications";
import type { Job } from "bullmq";
import type { NotificationPayload } from "../../schemas/notifications";
import { getDb } from "../../utils/db";
import { BaseProcessor } from "../base";

type InboxMeta = {
  source?: "slack" | "whatsapp" | "email" | "upload";
  sourceMetadata?: {
    channelId?: string;
    threadTs?: string;
    // Future: WhatsApp, etc.
  };
};

/**
 * Notification processor
 * Creates notifications and activities for various events
 * Also sends provider-specific notifications for match events based on inbox source
 */
export class NotificationProcessor extends BaseProcessor<NotificationPayload> {
  async process(job: Job<NotificationPayload>): Promise<void> {
    const { type, teamId, sendEmail = false, ...data } = job.data;
    const db = getDb();

    this.logger.info("Processing notification", {
      type,
      teamId,
      sendEmail,
    });

    try {
      const notifications = new Notifications(db);
      await notifications.create(type, teamId, data, {
        sendEmail,
      });

      this.logger.info("Notification created successfully", {
        type,
        teamId,
      });

      // Handle provider-specific notifications for match events
      if (type === "inbox_auto_matched" || type === "inbox_needs_review") {
        await this.handleMatchNotification(teamId, type, data);
      }
    } catch (error) {
      this.logger.error("Failed to create notification", {
        type,
        teamId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  private async handleMatchNotification(
    teamId: string,
    type: "inbox_auto_matched" | "inbox_needs_review",
    data: Record<string, unknown>,
  ): Promise<void> {
    const db = getDb();

    // Extract match data from notification payload
    const {
      inboxId,
      transactionId,
      documentName,
      documentAmount,
      documentCurrency,
      transactionAmount,
      transactionCurrency,
      transactionName,
      confidenceScore,
      matchType,
    } = data as {
      inboxId: string;
      transactionId: string;
      documentName: string;
      documentAmount: number;
      documentCurrency: string;
      transactionAmount: number;
      transactionCurrency: string;
      transactionName: string;
      confidenceScore: number;
      matchType: "auto_matched" | "high_confidence" | "suggested";
    };

    // Get inbox item to check for source metadata
    const inboxItem = await getInboxById(db, { id: inboxId, teamId });
    const meta = inboxItem?.meta as InboxMeta | null;

    if (!meta?.source || !meta.sourceMetadata) {
      this.logger.info(
        "Inbox item has no source metadata, skipping provider notification",
        {
          inboxId,
          teamId,
        },
      );
      return;
    }

    // Get transaction for date info
    const transaction = await getTransactionById(db, {
      id: transactionId,
      teamId,
    });

    // Dispatch to provider-specific handler
    switch (meta.source) {
      case "slack":
        // channelId is required for Slack notifications
        if (!meta.sourceMetadata.channelId) {
          this.logger.warn(
            "Inbox item has Slack source but missing channelId, skipping Slack notification",
            {
              inboxId,
              teamId,
            },
          );
          return;
        }

        await this.sendSlackNotification({
          teamId,
          inboxId,
          transactionId,
          documentName,
          documentAmount,
          documentCurrency,
          transactionName,
          transactionAmount,
          transactionCurrency,
          transactionDate: transaction?.date ?? undefined,
          confidenceScore,
          matchType,
          channelId: meta.sourceMetadata.channelId,
          threadTs: meta.sourceMetadata.threadTs,
        });
        break;

      // Future: Add more providers here
      // case "whatsapp":
      //   await this.sendWhatsAppNotification(...);
      //   break;

      default:
        this.logger.info("No notification handler for source", {
          source: meta.source,
          inboxId,
        });
    }
  }

  private async sendSlackNotification(params: {
    teamId: string;
    inboxId: string;
    transactionId: string;
    documentName: string;
    documentAmount: number;
    documentCurrency: string;
    transactionName: string;
    transactionAmount: number;
    transactionCurrency: string;
    transactionDate?: string;
    confidenceScore: number;
    matchType: "auto_matched" | "high_confidence" | "suggested";
    channelId: string;
    threadTs?: string;
  }): Promise<void> {
    this.logger.info("Sending Slack match notification", {
      inboxId: params.inboxId,
      transactionId: params.transactionId,
      teamId: params.teamId,
      matchType: params.matchType,
      channelId: params.channelId,
    });

    try {
      await sendSlackMatchNotification({
        teamId: params.teamId,
        inboxId: params.inboxId,
        transactionId: params.transactionId,
        documentName: params.documentName,
        documentAmount: params.documentAmount,
        documentCurrency: params.documentCurrency,
        transactionName: params.transactionName,
        transactionAmount: params.transactionAmount,
        transactionCurrency: params.transactionCurrency,
        transactionDate: params.transactionDate,
        confidenceScore: params.confidenceScore,
        matchType: params.matchType,
        slackChannelId: params.channelId,
        slackThreadTs: params.threadTs,
      });

      this.logger.info("Slack match notification sent successfully", {
        inboxId: params.inboxId,
        transactionId: params.transactionId,
        teamId: params.teamId,
      });
    } catch (error) {
      // Don't fail the notification job if Slack notification fails
      this.logger.warn("Failed to send Slack match notification", {
        inboxId: params.inboxId,
        transactionId: params.transactionId,
        teamId: params.teamId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
