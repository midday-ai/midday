import { transform } from "@midday/import/src/transform";
import { eventTrigger } from "@trigger.dev/sdk";
import Papa from "papaparse";
import { z } from "zod";
import { client, supabase } from "../client";
import { Events, Jobs } from "../constants";
import { mapTransactions, processTransactions } from "../utils/import";

client.defineJob({
  id: Jobs.TRANSACTIONS_IMPORT,
  name: "Transactions - Import",
  version: "0.0.2",
  trigger: eventTrigger({
    name: Events.TRANSACTIONS_IMPORT,
    schema: z.object({
      importType: z.enum(["csv", "image"]),
      inverted: z.boolean(),
      filePath: z.array(z.string()).optional(),
      bankAccountId: z.string(),
      currency: z.string(),
      teamId: z.string(),
      table: z.array(z.record(z.string(), z.string())).optional(),
      timezone: z.string(),
      mappings: z.object({
        amount: z.string(),
        date: z.string(),
        description: z.string(),
      }),
    }),
  }),
  integrations: { supabase },
  run: async (payload, io) => {
    const supabase = io.supabase.client;

    const {
      teamId,
      filePath,
      importType,
      bankAccountId,
      currency,
      mappings,
      inverted,
      table,
      timezone,
    } = payload;

    switch (importType) {
      case "csv": {
        if (!filePath) {
          throw new Error("File path is required");
        }

        const { data: fileData } = await supabase.storage
          .from("vault")
          .download(filePath.join("/"));

        const content = await fileData?.text();

        await new Promise((resolve, reject) => {
          Papa.parse(content as string, {
            header: true,
            skipEmptyLines: true,
            worker: false,
            complete: resolve,
            error: reject,
            chunk: async (
              chunk: {
                data?: Record<string, string>[];
                errors: { message: string }[];
              },
              parser: any
            ) => {
              parser.pause();

              const { data } = chunk;

              if (!data?.length) {
                throw new Error("No data in CSV import chunk");
              }

              const mappedTransactions = mapTransactions(
                data,
                mappings,
                currency,
                teamId,
                bankAccountId
              );
              const transactions = mappedTransactions.map((transaction) =>
                transform({ transaction, inverted, timezone })
              );

              await processTransactions({ transactions, io, supabase, teamId });

              parser.resume();
            },
          });
        });

        break;
      }
      case "image": {
        if (!table) {
          throw new Error("Table is required");
        }

        const mappedTransactions = mapTransactions(
          table,
          mappings,
          currency,
          teamId,
          bankAccountId
        );

        const transactions = mappedTransactions.map((transaction) =>
          transform({ transaction, inverted, timezone })
        );

        await processTransactions({ transactions, io, supabase, teamId });

        break;
      }
      default: {
        throw new Error("Invalid import type");
      }
    }
  },
});
