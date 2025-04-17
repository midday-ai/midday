import { schedules, schemaTask } from "@trigger.dev/sdk/v3";
import { generateQuarterDailyCronTag } from "jobs/utils/generate-cron-tag";
import { z } from "zod";
import { processAttachment } from "../process-attachment";
import { inboxSyncScheduler } from "./sheduler";

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

    // Schedule the inbox sync task to run every 6 hours at a random time to distribute load
    // Use a deduplication key to prevent duplicate schedules for the same team
    // Add inbox account id as externalId to use it in the inboxSyncScheduler task
    await schedules.create({
      task: inboxSyncScheduler.id,
      cron: generateQuarterDailyCronTag(id),
      timezone: "UTC",
      externalId: id,
      deduplicationKey: `${id}-${inboxSyncScheduler.id}`,
    });

    // Do initial sync of the email account

    // processAttachment.batchTrigger({
    //   teamId: id,
    //   mimetype: "text/plain",
    //   size: 100,
    //   file_path: ["test.txt"],
    //   displayName: "test.txt",
    // });
  },
});
