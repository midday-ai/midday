import { schedules, schemaTask } from "@trigger.dev/sdk/v3";
import { generateCronTag } from "jobs/utils/generate-cron-tag";
import { z } from "zod";

export const initialInboxSetup = schemaTask({
  id: "initial-inbox-setup",
  schema: z.object({
    teamId: z.string().uuid(),
    connectionId: z.string().uuid(),
  }),
  maxDuration: 300,
  queue: {
    concurrencyLimit: 50,
  },
  run: async (payload) => {
    const { teamId, connectionId } = payload;

    // Schedule the bank sync task to run daily at a random time to distribute load
    // Use a deduplication key to prevent duplicate schedules for the same team
    // Add teamId as externalId to use it in the bankSyncScheduler task
    // await schedules.create({
    //   task: bankSyncScheduler.id,
    //   cron: generateCronTag(teamId),
    //   timezone: "UTC",
    //   externalId: teamId,
    //   deduplicationKey: `${teamId}-${bankSyncScheduler.id}`,
    // });
  },
});
