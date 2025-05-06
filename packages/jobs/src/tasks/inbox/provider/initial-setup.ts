import { generateQuarterDailyCronTag } from "@/utils/generate-cron-tag";
import { createClient } from "@midday/supabase/job";
import { updateInboxAccount } from "@midday/supabase/mutations";
import { schedules, schemaTask } from "@trigger.dev/sdk/v3";
import { z } from "zod";
import { inboxSyncScheduler } from "./sheduler";
import { syncInboxAccount } from "./sync-account";

export const initialInboxSetup = schemaTask({
  id: "initial-inbox-setup",
  schema: z.object({
    id: z.string().uuid(), // This is the inbox_account row id
  }),
  maxDuration: 300,
  queue: {
    concurrencyLimit: 20,
  },
  run: async (payload) => {
    const { id } = payload;

    const supabase = createClient();

    // Schedule the inbox sync task to run every 6 hours at a random time to distribute load
    // Use a deduplication key to prevent duplicate schedules for the same team
    // Add inbox account id as externalId to use it in the inboxSyncScheduler task
    const schedule = await schedules.create({
      task: inboxSyncScheduler.id,
      cron: generateQuarterDailyCronTag(id),
      timezone: "UTC",
      externalId: id,
      deduplicationKey: `${id}-${inboxSyncScheduler.id}`,
    });

    await updateInboxAccount(supabase, {
      id,
      scheduleId: schedule.id,
    });

    await syncInboxAccount.trigger({
      id,
    });
  },
});
