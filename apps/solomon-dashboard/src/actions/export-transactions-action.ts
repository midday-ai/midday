"use server";

import { LogEvents } from "@midday/events/events";
import { setupAnalytics } from "@midday/events/server";
import { Events, client } from "@midday/jobs";
import { getUser } from "@midday/supabase/cached-queries";
import { action } from "./safe-action";
import { exportTransactionsSchema } from "./schema";

export const exportTransactionsAction = action(
  exportTransactionsSchema,
  async (transactionIds) => {
    const user = await getUser();

    const event = await client.sendEvent({
      name: Events.TRANSACTIONS_EXPORT,
      payload: {
        transactionIds,
        teamId: user.data.team_id,
        locale: user.data.locale,
      },
    });

    const analytics = await setupAnalytics({
      userId: user.data.id,
      fullName: user.data.full_name,
    });

    analytics.track({
      event: LogEvents.ExportTransactions.name,
      channel: LogEvents.ExportTransactions.channel,
    });

    return event;
  }
);
