"use server";

import { LogEvents } from "@midday/events/events";
import type { exportTransactions } from "@midday/jobs/tasks/transactions/export";
import { tasks } from "@trigger.dev/sdk/v3";
import { z } from "zod";
import { authActionClient } from "./safe-action";

export const exportTransactionsAction = authActionClient
  .schema(
    z.object({
      transactionIds: z.array(z.string()),
      dateFormat: z.string().optional().default("MM/DD/YYYY"),
      locale: z.string().optional().default("en"),
    }),
  )
  .metadata({
    name: "export-transactions",
    track: {
      event: LogEvents.ExportTransactions.name,
      channel: LogEvents.ExportTransactions.channel,
    },
  })
  .action(
    async ({
      parsedInput: { transactionIds, dateFormat, locale },
      ctx: { teamId },
    }) => {
      if (!teamId) {
        throw new Error("Team not found");
      }

      const event = await tasks.trigger<typeof exportTransactions>(
        "export-transactions",
        {
          teamId,
          locale,
          transactionIds,
          dateFormat,
        },
      );

      return event;
    },
  );
