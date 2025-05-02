import { processBatch } from "@/utils/process-batch";
import { mapTransactions } from "@midday/import/mappings";
import { transform } from "@midday/import/transform";
import { validateTransactions } from "@midday/import/validate";
import { createClient } from "@midday/supabase/job";
import { logger, schemaTask } from "@trigger.dev/sdk/v3";
import Papa from "papaparse";
import { z } from "zod";

const BATCH_SIZE = 500;

export const importTransactions = schemaTask({
  id: "import-transactions",
  schema: z.object({
    inverted: z.boolean(),
    filePath: z.array(z.string()).optional(),
    bankAccountId: z.string(),
    currency: z.string(),
    teamId: z.string(),
    table: z.array(z.record(z.string(), z.string())).optional(),
    mappings: z.object({
      amount: z.string(),
      date: z.string(),
      description: z.string(),
    }),
  }),
  maxDuration: 300,
  queue: {
    concurrencyLimit: 10,
  },
  run: async ({
    teamId,
    filePath,
    bankAccountId,
    currency,
    mappings,
    inverted,
    table,
  }) => {
    const supabase = createClient();

    if (!filePath) {
      throw new Error("File path is required");
    }

    const { data: fileData } = await supabase.storage
      .from("vault")
      .download(filePath.join("/"));

    const content = await fileData?.text();

    if (!content) {
      throw new Error("File content is required");
    }

    await new Promise((resolve, reject) => {
      Papa.parse(content, {
        header: true,
        skipEmptyLines: true,
        worker: false,
        complete: resolve,
        error: reject,
        chunk: async (
          chunk: {
            data: Record<string, string>[];
            errors: Array<{ message: string }>;
          },
          parser: Papa.Parser,
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
            bankAccountId,
          );

          const transactions = mappedTransactions.map((transaction) =>
            transform({ transaction, inverted }),
          );

          const { validTransactions, invalidTransactions } =
            validateTransactions(transactions);

          if (invalidTransactions.length > 0) {
            logger.error("Invalid transactions", {
              invalidTransactions,
            });
          }

          await processBatch(validTransactions, BATCH_SIZE, async (batch) => {
            return supabase.from("transactions").upsert(batch, {
              onConflict: "internal_id",
              ignoreDuplicates: true,
            });
          });

          parser.resume();
        },
      });
    });
  },
});
