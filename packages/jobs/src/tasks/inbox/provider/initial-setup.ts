import { getDb } from "@jobs/init";
import { initialInboxSetupSchema } from "@jobs/schema";
import { generateQuarterDailyCronTag } from "@jobs/utils/generate-cron-tag";
import { updateInboxAccount } from "@midday/db/queries";
import { schedules, schemaTask } from "@trigger.dev/sdk";
import { inboxSyncScheduler } from "./sheduler";
import { syncInboxAccount } from "./sync-account";

export const initialInboxSetup = schemaTask({
  id: "initial-inbox-setup",
  schema: initialInboxSetupSchema,
  maxDuration: 120,
  queue: {
    concurrencyLimit: 20,
  },
  run: async (payload) => {
    const { id } = payload;

    // Schedule the inbox sync task to run quarter-daily (every 6 hours) at a random minute to distribute load
    // Use a deduplication key to prevent duplicate schedules for the same team
    // Add inbox account id as externalId to use it in the inboxSyncScheduler task
    const schedule = await schedules.create({
      task: inboxSyncScheduler.id,
      cron: generateQuarterDailyCronTag(id),
      timezone: "UTC",
      externalId: id,
      deduplicationKey: `${id}-${inboxSyncScheduler.id}`,
    });

    await updateInboxAccount(getDb(), {
      id,
      scheduleId: schedule.id,
    });

    await syncInboxAccount.trigger({
      id,
      manualSync: true,
    });
  },
});
