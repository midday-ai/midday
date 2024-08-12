"use server";

import { LogEvents } from "@midday/events/events";
import { formatAmountValue } from "@midday/import";
import { Events, client } from "@midday/jobs";
import { z } from "zod";
import { authActionClient } from "../safe-action";

export const importTransactionsAction = authActionClient
  .schema(
    z.object({
      filePath: z.array(z.string()),
      bankAccountId: z.string(),
      currency: z.string(),
      currentBalance: z.string().optional(),
      mappings: z.object({
        amount: z.string(),
        date: z.string(),
        description: z.string(),
        balance: z.string().optional(),
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
      parsedInput: {
        filePath,
        bankAccountId,
        currency,
        mappings,
        currentBalance,
      },
      ctx: { user, supabase },
    }) => {
      // Update currency for account
      const balance = currentBalance ? formatAmountValue(currentBalance) : null;

      await supabase
        .from("bank_accounts")
        .update({ currency, balance })
        .eq("id", bankAccountId);

      const event = await client.sendEvent({
        name: Events.TRANSACTIONS_IMPORT,
        payload: {
          filePath,
          bankAccountId,
          currency,
          mappings,
          teamId: user.team_id,
          importType: "csv",
        },
      });

      return event;
    },
  );
