"use server";

import { LogEvents } from "@midday/events/events";
import type { exportTransactions } from "@midday/jobs/tasks/transactions/export";
import { tasks } from "@trigger.dev/sdk/v3";
import { z } from "zod";
import { authActionClient } from "./safe-action";

export const exportTransactionsAction = authActionClient
  .schema(z.array(z.string()))
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

    const event = await tasks.trigger<typeof exportTransactions>(
      "export-transactions",
      {
        teamId: user.team_id,
        locale: user.locale,
        transactionIds,
        dateFormat: user.date_format,
      },
    );

    return event;
  });
