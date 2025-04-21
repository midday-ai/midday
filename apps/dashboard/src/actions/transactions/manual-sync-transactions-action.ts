"use server";

import { authActionClient } from "@/actions/safe-action";
import { manualSyncTransactionsSchema } from "@/actions/schema";
import { LogEvents } from "@midday/events/events";
import type { syncConnection } from "@midday/jobs/tasks/bank/sync/connection";
import { tasks } from "@trigger.dev/sdk/v3";

export const manualSyncTransactionsAction = authActionClient
  .schema(manualSyncTransactionsSchema)
  .metadata({
    name: "manual-sync-transactions",
    track: {
      event: LogEvents.TransactionsManualSync.name,
      channel: LogEvents.TransactionsManualSync.channel,
    },
  })
  .action(async ({ parsedInput: { connectionId } }) => {
    const event = await tasks.trigger<typeof syncConnection>(
      "sync-connection",
      {
        connectionId,
        manualSync: true,
      },
    );

    return event;
  });
