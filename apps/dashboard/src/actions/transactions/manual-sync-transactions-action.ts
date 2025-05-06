"use server";

import { authActionClient } from "@/actions/safe-action";
import { LogEvents } from "@midday/events/events";
import type { syncConnection } from "@midday/jobs/tasks/bank/sync/connection";
import { tasks } from "@trigger.dev/sdk/v3";
import { z } from "zod";

export const manualSyncTransactionsAction = authActionClient
  .schema(
    z.object({
      connectionId: z.string(),
    }),
  )
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
