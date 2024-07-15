"use server";

import { LogEvents } from "@midday/events/events";
import { setupAnalytics } from "@midday/events/server";
import { Events, client } from "@midday/jobs";
import { authActionClient } from "../safe-action";
import { importTransactionsSchema } from "../schema";

export const importTransactionsAction = authActionClient
  .schema(importTransactionsSchema)
  .action(async ({ parsedInput: { filePath }, ctx: { user } }) => {
    const event = await client.sendEvent({
      name: Events.TRANSACTIONS_IMPORT,
      payload: {
        filePath,
        teamId: user.team_id,
      },
    });

    const analytics = await setupAnalytics({
      userId: user.id,
      fullName: user.full_name,
    });

    analytics.track({
      event: LogEvents.ImportTransactions.name,
      channel: LogEvents.ImportTransactions.channel,
    });

    return event;
  });
