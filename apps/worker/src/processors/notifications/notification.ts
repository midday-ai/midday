import { Notifications } from "@midday/notifications";
import type { Job } from "bullmq";
import type { NotificationPayload } from "../../schemas/notification";
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

    this.logger.info(
      {
        type,
        teamId,
        sendEmail,
      },
      "Processing notification",
    );

    try {
      const notifications = new Notifications(db);
      await notifications.create(type, teamId, data, {
        sendEmail,
      });

      this.logger.info(
        {
          type,
          teamId,
        },
        "Notification created successfully",
      );
    } catch (error) {
      this.logger.error(
        {
          type,
          teamId,
          error: error instanceof Error ? error.message : "Unknown error",
        },
        "Failed to create notification",
      );
      throw error;
    }
  }
}
