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

const createTransactionSchema = z.object({
  name: z.string(),
  currency: z.string(),
  bank_account_id: z.string(),
  team_id: z.string(),
  internal_id: z.string(),
  status: z.enum(["posted", "pending"]),
  method: z.enum(["card", "bank", "other"]),
  date: z.coerce.date(),
  amount: z.number(),
  manual: z.boolean(),
  category_slug: z.string().nullable(),
});

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
                Object.entries(mappings)
                  // Filter out empty values
                  .filter(([_, value]) => value !== "")
                  .map(([key, value]) => [key, row[value]]),
              ) as Transaction),
              currency,
              teamId,
              bankAccountId,
            };
          });

          const transactions = mappedTransactions.map(transform);

          const processedTransactions = transactions.map((transaction) => {
            return createTransactionSchema.safeParse(transaction);
          });

          const validTransactions = processedTransactions.filter(
            (transaction) => transaction.success,
          );

          const invalidTransactions = processedTransactions.filter(
            (transaction) => !transaction.success,
          );

          if (invalidTransactions.length > 0) {
            await io.logger.error("Invalid transactions", {
              invalidTransactions,
            });
          }

          // Only valid transactions need to be processed
          if (validTransactions.length > 0) {
            await processBatch(
              validTransactions.map(({ data }) => data),
              BATCH_LIMIT,
              async (batch) => {
                await supabase.from("transactions").upsert(batch, {
                  onConflict: "internal_id",
                  ignoreDuplicates: true,
                });
              },
            );
          }

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
