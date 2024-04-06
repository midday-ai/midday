"use server";

import { LogEvents } from "@midday/events/events";
import { setupLogSnag } from "@midday/events/server";
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

    const logsnag = setupLogSnag();

    logsnag.track({
      event: LogEvents.ImportTransactions.name,
      icon: LogEvents.ImportTransactions.icon,
      user_id: user.data.id,
      channel: LogEvents.ImportTransactions.channel,
    });

    return event;
  }
);
