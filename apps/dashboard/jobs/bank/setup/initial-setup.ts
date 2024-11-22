import { schedules, schemaTask } from "@trigger.dev/sdk/v3";
import { generateCron } from "jobs/utils/generate-cron";
import { z } from "zod";
import { scheduleBankSync } from "../scheduler/schedule-bank-sync";

// This task sets up the bank sync for a new team on a daily schedule and
// runs the initial sync for transactions and balance
export const initialBankSetup = schemaTask({
  id: "initial-bank-setup",
  schema: z.object({
    teamId: z.string().uuid(),
  }),
  maxDuration: 600,
  queue: {
    concurrencyLimit: 20,
  },
  run: async (payload) => {
    const { teamId } = payload;

    // Schedule the bank sync task to run daily at a random time to distribute load
    // Use a deduplication key to prevent duplicate schedules for the same team
    // Add teamId as externalId to use it in the scheduleBankSync task
    await schedules.create({
      task: scheduleBankSync.id,
      cron: generateCron(teamId),
      timezone: "UTC",
      externalId: teamId,
      deduplicationKey: `${teamId}-${scheduleBankSync.id}`,
    });

    // Run manual sync
    //  --> Transactions
    //  --> Balance
  },
});
