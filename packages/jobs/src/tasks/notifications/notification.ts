import { getDb } from "@jobs/init";
import { notificationSchema } from "@jobs/schema";
import { Notifications } from "@midday/notifications-v2";
import { schemaTask } from "@trigger.dev/sdk";

export const notification = schemaTask({
  id: "notification",
  schema: notificationSchema,
  maxDuration: 60,
  queue: {
    concurrencyLimit: 5,
  },
  run: async (payload) => {
    const notifications = new Notifications(getDb());

    const { type, teamId, ...notificationData } = payload;

    // Check if notification type is supported in notifications-v2
    if (type === "invoice_paid" || type === "invoice_overdue") {
      console.error(
        `${type} notifications not yet migrated to notifications-v2`,
      );

      return;
    }

    return notifications.create(type, teamId, notificationData);
  },
});
