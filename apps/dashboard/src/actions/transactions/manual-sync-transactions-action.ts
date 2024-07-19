"use server";

import { authActionClient } from "@/actions/safe-action";
import { manualSyncTransactionsSchema } from "@/actions/schema";
import { LogEvents } from "@midday/events/events";
import { Events, client } from "@midday/jobs";

export const manualSyncTransactionsAction = authActionClient
  .schema(manualSyncTransactionsSchema)
  .metadata({
    event: LogEvents.TransactionsManualSync.name,
    channel: LogEvents.TransactionsManualSync.channel,
  })
  .action(async ({ parsedInput: { connectionId }, ctx: { user } }) => {
    const event = await client.sendEvent({
      name: Events.TRANSACTIONS_MANUAL_SYNC,
      payload: {
        connectionId,
        teamId: user.team_id,
      },
    });

    return event;
  });
