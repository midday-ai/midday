import { Notifications } from "@midday/notifications";
import type { Job } from "bullmq";
import type { NotificationPayload } from "../../schemas/notifications";
import { getDb } from "../../utils/db";
import { BaseProcessor } from "../base";

/**
 * Notification processor
 * Creates notifications and activities for various events
 * Matches the behavior of the Trigger.dev notification task
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
    } catch (error) {
      this.logger.error("Failed to create notification", {
        type,
        teamId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }
}
