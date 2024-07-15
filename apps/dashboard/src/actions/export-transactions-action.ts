"use server";

import { LogEvents } from "@midday/events/events";
import { Events, client } from "@midday/jobs";
import { authActionClient } from "./safe-action";
import { exportTransactionsSchema } from "./schema";

export const exportTransactionsAction = authActionClient
  .schema(exportTransactionsSchema)
  .metadata({
    event: LogEvents.ExportTransactions.name,
    channel: LogEvents.ExportTransactions.channel,
  })
  .action(async ({ parsedInput: { transactionIds }, ctx: { user } }) => {
    const event = await client.sendEvent({
      name: Events.TRANSACTIONS_EXPORT,
      payload: {
        transactionIds,
        teamId: user.team_id,
        locale: user.locale,
      },
    });

    return event;
  });
