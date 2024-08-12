import { eventTrigger } from "@trigger.dev/sdk";
import { revalidateTag } from "next/cache";
import Papa from "papaparse";
import { z } from "zod";
import { client, supabase } from "../client";
import { Events, Jobs } from "../constants";

const BATCH_LIMIT = 500;

client.defineJob({
  id: Jobs.TRANSACTIONS_IMPORT,
  name: "Transactions - Import",
  version: "0.0.1",
  trigger: eventTrigger({
    name: Events.TRANSACTIONS_MANUAL_SYNC,
    schema: z.object({
      filePath: z.array(z.string()),
      bankAccountId: z.string(),
      currency: z.string(),
      mappings: z.object({
        amount: z.string(),
        date: z.string(),
        description: z.string(),
      }),
      teamId: z.string(),
    }),
  }),
  integrations: { supabase },
  run: async (payload, io) => {
    const supabase = io.supabase.client;

    const { teamId, filePath, bankAccountId, currency, mappings } = payload;

    const { data } = await supabase.storage
      .from("vault")
      .download(filePath.join("/"));

    await new Promise((resolve, reject) => {
      Papa.parse(data, {
        header: true,
        skipEmptyLines: true,
        // skipFirstNLines: cursor,
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
          parser.pause(); // Pause parsing until we finish processing this chunk

          const { data } = chunk;
          if (!data?.length) {
            console.warn("No data in CSV import chunk", chunk.errors);
            return;
          }
          parser.resume();
        },
      });
    });

    //   const formattedTransactions = transactions.data?.map((transaction) => {
    //     return transformTransaction({
    //       transaction,
    //       teamId: account.team_id,
    //       bankAccountId: account.id,
    //     });
    //   });

    //    // we need to guard against massive payloads
    //    await processBatch(formattedTransactions, BATCH_LIMIT, async (batch) => {
    //     await supabase.from("transactions").upsert(batch, {
    //       onConflict: "internal_id",
    //       ignoreDuplicates: true,
    //     });
    //   });

    // revalidateTag(`bank_connections_${teamId}`);
    // revalidateTag(`transactions_${teamId}`);
    // revalidateTag(`spending_${teamId}`);
    // revalidateTag(`metrics_${teamId}`);
    // revalidateTag(`bank_accounts_${teamId}`);
    // revalidateTag(`insights_${teamId}`);
  },
});
