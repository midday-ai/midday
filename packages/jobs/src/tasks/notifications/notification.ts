import { getDb } from "@jobs/init";
import { notificationSchema } from "@jobs/schema";
import { Notifications } from "@midday/notifications-v2";
import { schemaTask } from "@trigger.dev/sdk";

export const notification = schemaTask({
  id: "notification",
  schema: notificationSchema,
  machine: "micro",
  maxDuration: 60,
  queue: {
    concurrencyLimit: 5,
  },
  run: async (payload) => {
    const notifications = new Notifications(getDb());

    const { type, teamId, sendEmail = false, ...notificationData } = payload;

    return notifications.create(type, teamId, notificationData, {
      sendEmail,
    });
  },
});
