"use server";

import { authActionClient } from "@/actions/safe-action";
import { manualSyncTransactionsSchema } from "@/actions/schema";
import { LogEvents } from "@midday/events/events";
import { setupAnalytics } from "@midday/events/server";
import { Events, client } from "@midday/jobs";

export const manualSyncTransactionsAction = authActionClient
  .schema(manualSyncTransactionsSchema)
  .action(async ({ parsedInput: { accountId }, ctx: { user } }) => {
    const analytics = await setupAnalytics({
      userId: user.id,
      fullName: user.full_name,
    });

    analytics.track({
      event: LogEvents.TransactionsManualSync.name,
      channel: LogEvents.TransactionsManualSync.channel,
    });

    const event = await client.sendEvent({
      name: Events.TRANSACTIONS_MANUAL_SYNC,
      payload: {
        accountId,
      },
    });

    return event;
  });
