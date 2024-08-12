import { transform } from "@midday/import/src/transform";
import type { Transaction } from "@midday/import/src/types";
import { eventTrigger } from "@trigger.dev/sdk";
import { revalidateTag } from "next/cache";
import Papa from "papaparse";
import { z } from "zod";
import { client, supabase } from "../client";
import { Events, Jobs } from "../constants";
import { processBatch } from "../utils/process";

const BATCH_LIMIT = 500;

client.defineJob({
  id: Jobs.TRANSACTIONS_IMPORT,
  name: "Transactions - Import",
  version: "0.0.2",
  trigger: eventTrigger({
    name: Events.TRANSACTIONS_IMPORT,
    schema: z.object({
      importType: z.enum(["csv", "image"]),
      filePath: z.array(z.string()),
      bankAccountId: z.string(),
      currency: z.string(),
      teamId: z.string(),
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

    const { teamId, filePath, bankAccountId, currency, mappings } = payload;

    const { data } = await supabase.storage
      .from("vault")
      .download(filePath.join("/"));

    const content = await data?.text();

    await new Promise((resolve, reject) => {
      Papa.parse(content, {
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
          parser,
        ) => {
          parser.pause();

          const { data } = chunk;

          if (!data?.length) {
            console.warn("No data in CSV import chunk", chunk.errors);
            return;
          }

          const mappedTransactions = data.map((row): Transaction => {
            return {
              ...(Object.fromEntries(
                Object.entries(mappings).map(([key, value]) => [
                  key,
                  row[value],
                ]),
              ) as Transaction),
              currency,
              teamId,
              bankAccountId,
            };
          });

          const transactions = mappedTransactions.map(transform);

          // we need to guard against massive payloads
          await processBatch(transactions, BATCH_LIMIT, async (batch) => {
            const katt = await supabase.from("transactions").upsert(batch, {
              onConflict: "internal_id",
              ignoreDuplicates: true,
            });

            console.log(katt);
          });

          parser.resume();
        },
      });
    });

    revalidateTag(`bank_connections_${teamId}`);
    revalidateTag(`transactions_${teamId}`);
    revalidateTag(`spending_${teamId}`);
    revalidateTag(`metrics_${teamId}`);
    revalidateTag(`bank_accounts_${teamId}`);
    revalidateTag(`insights_${teamId}`);
  },
});
