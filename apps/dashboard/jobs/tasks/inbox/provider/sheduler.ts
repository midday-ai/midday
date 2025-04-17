import { schedules } from "@trigger.dev/sdk/v3";
import { syncInboxAccount } from "./sync-account";

export const inboxSyncScheduler = schedules.task({
  id: "inbox-sync-scheduler",
  maxDuration: 600,
  run: async (payload) => {
    // Only run in production (Set in Trigger.dev)
    if (process.env.TRIGGER_ENVIRONMENT !== "production") return;

    if (!payload.externalId) {
      throw new Error("ID is required");
    }

    await syncInboxAccount.trigger({
      id: payload.externalId,
    });
  },
});
