"use server";

import { LogEvents } from "@midday/events/events";
import type { SyncConnectionPayload } from "@midday/jobs/schema";
import { tasks } from "@trigger.dev/sdk";
import { z } from "zod";
import { authActionClient } from "@/actions/safe-action";

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
    const event = await tasks.trigger("sync-connection", {
      connectionId,
      manualSync: true,
    } satisfies SyncConnectionPayload);

    return event;
  });
