"use server";

import { LogEvents } from "@midday/events/events";
import { setupAnalytics } from "@midday/events/server";
import { Events, client } from "@midday/jobs";
import { getUser } from "@midday/supabase/cached-queries";
import { action } from "../safe-action";
import { importTransactionsSchema } from "../schema";

export const importTransactionsAction = action(
  importTransactionsSchema,
  async ({ filePath }) => {
    const user = await getUser();

    const event = await client.sendEvent({
      name: Events.TRANSACTIONS_IMPORT,
      payload: {
        filePath,
        teamId: user.data.team_id,
      },
    });

    const analytics = await setupAnalytics({
      userId: user.data.id,
      fullName: user.data.full_name,
    });

    analytics.track({
      event: LogEvents.ImportTransactions.name,
      channel: LogEvents.ImportTransactions.channel,
    });

    return event;
  }
);
