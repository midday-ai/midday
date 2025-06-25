import { bulkImportTransactions } from "@midday/db/queries";
import { mapTransactions } from "@midday/import/mappings";
import { transform } from "@midday/import/transform";
import { validateTransactions } from "@midday/import/validate";
import { job } from "@worker/core/job";
import { importsQueue } from "@worker/queues/queues";
import { importTransactionsSchema } from "@worker/schemas/jobs";
import { formatISO } from "date-fns";
import Papa from "papaparse";

export const importTransactionsJob = job(
  "import-transactions",
  importTransactionsSchema,
  {
    queue: importsQueue,
    attempts: 3,
    removeOnComplete: 50,
    removeOnFail: 50,
  },
  async (
    { teamId, filePath, bankAccountId, currency, mappings, inverted },
    ctx,
  ) => {
    ctx.logger.info("Starting transaction import", {
      teamId,
      filePath: filePath?.join("/"),
      bankAccountId,
      currency,
    });

    if (!filePath) {
      throw new Error("File path is required");
    }

    const { data: fileData } = await ctx.supabase.storage
      .from("vault")
      .download(filePath.join("/"));

    const content = await fileData?.text();
    if (!content) {
      throw new Error("File content is required");
    }

    let totalProcessed = 0;
    let totalValid = 0;
    let totalInvalid = 0;

    return new Promise((resolve, reject) => {
      Papa.parse(content, {
        header: true,
        skipEmptyLines: true,
        worker: false,
        complete: () => {
          ctx.logger.info("CSV import completed", {
            teamId,
            totalProcessed,
            totalValid,
            totalInvalid,
          });
          resolve({ teamId, totalProcessed, totalValid, totalInvalid });
        },
        error: (error: Error) => {
          ctx.logger.error("CSV parsing failed", {
            teamId,
            error: error.message,
          });
          reject(new Error(`CSV parsing failed: ${error.message}`));
        },
        chunk: async (
          chunk: {
            data: Record<string, string>[];
            errors: Array<{ message: string }>;
          },
          parser: Papa.Parser,
        ) => {
          parser.pause();

          try {
            if (!chunk.data?.length) {
              ctx.logger.warn("No data in CSV import chunk", { teamId });
              parser.resume();
              return;
            }

            ctx.logger.info("Processing CSV chunk", {
              teamId,
              chunkSize: chunk.data.length,
            });

            // Process chunk in one pipeline
            const { validTransactions, invalidTransactions } =
              validateTransactions(
                mapTransactions(
                  chunk.data,
                  mappings,
                  currency,
                  teamId,
                  bankAccountId,
                ).map((transaction) =>
                  transform({ transaction, inverted }),
                ) as any,
              );

            totalValid += validTransactions.length;
            totalInvalid += invalidTransactions.length;

            if (invalidTransactions.length > 0) {
              ctx.logger.warn("Found invalid transactions", {
                teamId,
                invalidCount: invalidTransactions.length,
                validCount: validTransactions.length,
              });
            }

            if (validTransactions.length > 0) {
              // Convert to database format with string dates
              const transactions = validTransactions.map((tx) => ({
                ...tx,
                date: formatISO(tx.date, { representation: "date" }),
              }));

              const result = await bulkImportTransactions(ctx.db, transactions);
              ctx.logger.info("Chunk processed successfully", {
                teamId,
                processedCount: result.insertedCount,
              });
            }

            totalProcessed += chunk.data.length;

            parser.resume();
          } catch (error) {
            ctx.logger.error("Error processing CSV chunk", {
              teamId,
              error: error instanceof Error ? error.message : String(error),
            });
            parser.abort();
            reject(error);
          }
        },
      });
    });
  },
);
