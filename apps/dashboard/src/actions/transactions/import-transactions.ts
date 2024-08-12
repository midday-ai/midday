"use server";

import { LogEvents } from "@midday/events/events";
import { Events, client } from "@midday/jobs";
import { z } from "zod";
import { authActionClient } from "../safe-action";

export const importTransactionsAction = authActionClient
  .schema(
    z.object({
      filePath: z.string(),
      bankAccountId: z.string(),
      currency: z.string(),
      mappings: z.object({
        amount: z.string(),
        date: z.string(),
        description: z.string(),
      }),
    }),
  )
  .metadata({
    name: "import-transactions",
    track: {
      event: LogEvents.ImportTransactions.name,
      channel: LogEvents.ImportTransactions.channel,
    },
  })
  .action(
    async ({
      parsedInput: { filePath, bankAccountId, currency, mappings },
      ctx: { user },
    }) => {
      const event = await client.sendEvent({
        name: Events.TRANSACTIONS_IMPORT,
        payload: {
          filePath,
          bankAccountId,
          currency,
          mappings,
          teamId: user.team_id,
        },
      });

      return event;
    },
  );
