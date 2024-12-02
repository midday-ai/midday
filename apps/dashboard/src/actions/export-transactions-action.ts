"use server";

import { LogEvents } from "@midday/events/events";
import { exportTransactions } from "jobs/tasks/transactions/export";
import { authActionClient } from "./safe-action";
import { exportTransactionsSchema } from "./schema";

export const exportTransactionsAction = authActionClient
  .schema(exportTransactionsSchema)
  .metadata({
    name: "export-transactions",
    track: {
      event: LogEvents.ExportTransactions.name,
      channel: LogEvents.ExportTransactions.channel,
    },
  })
  .action(async ({ parsedInput: transactionIds, ctx: { user } }) => {
    if (!user.team_id || !user.locale) {
      throw new Error("User not found");
    }

    const event = await exportTransactions.trigger({
      teamId: user.team_id,
      locale: user.locale,
      transactionIds,
    });

    return event;
  });
