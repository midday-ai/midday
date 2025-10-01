"use server";

import { LogEvents } from "@midday/events/events";
import type { ExportTransactionsPayload } from "@midday/jobs/schema";
import { tasks } from "@trigger.dev/sdk";
import { z } from "zod";
import { authActionClient } from "./safe-action";

export const exportTransactionsAction = authActionClient
  .schema(
    z.object({
      transactionIds: z.array(z.string()),
      dateFormat: z.string().optional(),
      locale: z.string().optional().default("en"),
      exportSettings: z
        .object({
          csvDelimiter: z.string(),
          includeCSV: z.boolean(),
          includeXLSX: z.boolean(),
          sendEmail: z.boolean(),
          accountantEmail: z.string().optional(),
        })
        .optional(),
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
      parsedInput: { transactionIds, dateFormat, locale, exportSettings },
      ctx: { teamId, user },
    }) => {
      if (!teamId) {
        throw new Error("Team not found");
      }

      const event = await tasks.trigger("export-transactions", {
        teamId,
        userId: user.id,
        locale,
        transactionIds,
        dateFormat,
        exportSettings,
      } satisfies ExportTransactionsPayload);

      return event;
    },
  );
