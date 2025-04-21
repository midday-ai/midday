import { generateCronTag } from "@/utils/generate-cron-tag";
import { schedules, schemaTask } from "@trigger.dev/sdk/v3";
import { z } from "zod";
import { bankSyncScheduler } from "../scheduler/bank-scheduler";
import { syncConnection } from "../sync/connection";

// This task sets up the bank sync for a new team on a daily schedule and
// runs the initial sync for transactions and balance
export const initialBankSetup = schemaTask({
  id: "initial-bank-setup",
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
    await schedules.create({
      task: bankSyncScheduler.id,
      cron: generateCronTag(teamId),
      timezone: "UTC",
      externalId: teamId,
      deduplicationKey: `${teamId}-${bankSyncScheduler.id}`,
    });

    // Run initial sync for transactions and balance for the connection
    await syncConnection.triggerAndWait({
      connectionId,
      manualSync: true,
    });

    // And run once more to ensure all transactions are fetched on the providers side
    // GoCardLess, Teller and Plaid can take up to 3 minutes to fetch all transactions
    // For Teller and Plaid we also listen on the webhook to fetch any new transactions
    await syncConnection.trigger(
      {
        connectionId,
        manualSync: true,
      },
      {
        delay: "5m",
      },
    );
  },
});
