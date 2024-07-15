"use server";

import { LogEvents } from "@midday/events/events";
import { Events, client } from "@midday/jobs";
import { authActionClient } from "../safe-action";
import { importTransactionsSchema } from "../schema";

export const importTransactionsAction = authActionClient
  .schema(importTransactionsSchema)
  .metadata({
    event: LogEvents.ImportTransactions.name,
    channel: LogEvents.ImportTransactions.channel,
  })
  .action(async ({ parsedInput: { filePath }, ctx: { user } }) => {
    const event = await client.sendEvent({
      name: Events.TRANSACTIONS_IMPORT,
      payload: {
        filePath,
        teamId: user.team_id,
      },
    });

    return event;
  });
