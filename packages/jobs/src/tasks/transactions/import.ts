import { importTransactionsSchema } from "@jobs/schema";
import { processBatch } from "@jobs/utils/process-batch";
import { mapTransactions } from "@midday/import/mappings";
import { transform } from "@midday/import/transform";
import { validateTransactions } from "@midday/import/validate";
import { createClient } from "@midday/supabase/job";
import { logger, schemaTask } from "@trigger.dev/sdk";
import Papa from "papaparse";
import { embedTransaction } from "./embed-transaction";

const BATCH_SIZE = 500;

export const importTransactions = schemaTask({
  id: "import-transactions",
  schema: importTransactionsSchema,
  maxDuration: 120,
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
            // @ts-expect-error
            validateTransactions(transactions);

          if (invalidTransactions.length > 0) {
            logger.error("Invalid transactions", {
              invalidTransactions,
            });
          }

          const results = await processBatch(
            validTransactions,
            BATCH_SIZE,
            async (batch) => {
              const { data } = await supabase
                .from("transactions")
                // @ts-expect-error - TODO: Fix transaction type mapping
                .upsert(batch, {
                  onConflict: "internal_id",
                  ignoreDuplicates: true,
                })
                .select("id")
                .throwOnError();

              return data || [];
            },
          );

          // Collect all inserted transaction IDs and trigger embeddings
          const allTransactionIds: string[] = results
            .flat()
            .map((tx) => tx.id)
            .filter(Boolean);

          if (allTransactionIds.length > 0) {
            await embedTransaction.trigger({
              transactionIds: allTransactionIds,
              teamId,
            });

            logger.info("Triggered embeddings for imported transactions", {
              count: allTransactionIds.length,
              teamId,
            });
          }

          parser.resume();
        },
      });
    });
  },
});
