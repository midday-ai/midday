"use server";

import { LogEvents } from "@midday/events/events";
import { formatAmountValue } from "@midday/import";
import { importTransactions } from "jobs/tasks/transactions/import";
import { z } from "zod";
import { authActionClient } from "../safe-action";

export const importTransactionsAction = authActionClient
  .schema(
    z.object({
      filePath: z.array(z.string()).optional(),
      bankAccountId: z.string(),
      currency: z.string(),
      currentBalance: z.string().optional(),
      inverted: z.boolean(),
      table: z.array(z.record(z.string(), z.string())).optional(),
      importType: z.enum(["csv", "image"]),
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
        inverted,
        table,
        importType,
      },
      ctx: { user, supabase },
    }) => {
      // Update currency for account
      const balance = currentBalance
        ? formatAmountValue({ amount: currentBalance })
        : null;

      await supabase
        .from("bank_accounts")
        .update({ currency, balance })
        .eq("id", bankAccountId);

      const event = await importTransactions.trigger({
        filePath,
        bankAccountId,
        currency,
        mappings,
        teamId: user.team_id!,
        inverted,
        importType,
      });

      return event;
    },
  );
