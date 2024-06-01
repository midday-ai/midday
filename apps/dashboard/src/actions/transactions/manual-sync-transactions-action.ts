"use server";

import { action } from "@/actions/safe-action";
import { manualSyncTransactionsSchema } from "@/actions/schema";
import { LogEvents } from "@midday/events/events";
import { setupAnalytics } from "@midday/events/server";
import { Events, client } from "@midday/jobs";
import { getUser } from "@midday/supabase/cached-queries";

export const manualSyncTransactionsAction = action(
  manualSyncTransactionsSchema,
  async ({ accountId }) => {
    const user = await getUser();

    const analytics = await setupAnalytics({
      userId: user.data.id,
      fullName: user.data.full_name,
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
  }
);
