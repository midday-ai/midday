import { schedules } from "@trigger.dev/sdk";
import { syncInboxAccount } from "./sync-account";

export const inboxSyncScheduler = schedules.task({
  id: "inbox-sync-scheduler",
  maxDuration: 60,
  run: async (payload) => {
    if (!payload.externalId) {
      throw new Error("ID is required");
    }

    await syncInboxAccount.trigger({
      id: payload.externalId,
    });
  },
});
