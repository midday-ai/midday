"use server";

import { action } from "@/actions/safe-action";
import { manualSyncTransactionsSchema } from "@/actions/schema";
// import { LogEvents } from "@midday/events/events";
// import { logsnag } from "@midday/events/server";
import { Events, client } from "@midday/jobs";

export const manualSyncTransactionsAction = action(
  manualSyncTransactionsSchema,
  async ({ accountId }) => {
    // logsnag.track({
    //   event: LogEvents.ProjectCreated.name,
    //   icon: LogEvents.ProjectCreated.icon,
    //   user_id: user.data.email,
    //   channel: LogEvents.ProjectCreated.channel,
    // });

    const event = await client.sendEvent({
      name: Events.TRANSACTIONS_MANUAL_SYNC,
      payload: {
        accountId,
      },
    });

    return event;
  }
);
