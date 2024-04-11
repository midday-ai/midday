"use server";

import { LogEvents } from "@midday/events/events";
import { setupLogSnag } from "@midday/events/server";
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

    const logsnag = await setupLogSnag({
      userId: user.data.id,
      fullName: user.data.full_name,
    });

    logsnag.track({
      event: LogEvents.ExportTransactions.name,
      icon: LogEvents.ExportTransactions.icon,
      channel: LogEvents.ExportTransactions.channel,
    });

    return event;
  }
);
