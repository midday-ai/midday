"use server";

// import { LogEvents } from "@midday/events/events";
// import { logsnag } from "@midday/events/server";
import { Events, client } from "@midday/jobs";
// import { getUser } from "@midday/supabase/cached-queries";
import { action } from "../safe-action";
import { importTransactionsSchema } from "../schema";
// import { Events, client } from "@midday/jobs";

export const importTransactionsAction = action(
  importTransactionsSchema,
  async ({ filePath }) => {
    const event = await client.sendEvent({
      name: Events.TRANSACTIONS_IMPORT,
      payload: {
        filePath,
      },
    });

    // logsnag.track({
    //   event: LogEvents.ExportTransactions.name,
    //   icon: LogEvents.ExportTransactions.icon,
    //   user_id: user.data.id,
    //   channel: LogEvents.ExportTransactions.channel,
    // });

    return event;
  }
);
