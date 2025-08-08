import { getDb } from "@jobs/init";
import { inboxNotificationSchema } from "@jobs/schema";
import { Notifications } from "@midday/notifications-v2";
import { schemaTask } from "@trigger.dev/sdk";

export const inboxNotification = schemaTask({
  id: "inbox-notification",
  schema: inboxNotificationSchema,
  maxDuration: 30,
  queue: {
    concurrencyLimit: 2,
  },
  run: async ({ teamId, totalCount, source, provider, syncType }) => {
    const notifications = new Notifications(getDb());

    await notifications.create("inbox_new", teamId, {
      totalCount,
      source,
      provider,
      syncType,
    });

    return {
      teamId,
      totalCount,
      source,
      notificationSent: true,
    };
  },
});
