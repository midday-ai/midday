import { upsertTransactions } from "@midday/db/queries";
import { mapTransactions } from "@midday/import/mappings";
import { transform } from "@midday/import/transform";
import { validateTransactions } from "@midday/import/validate";
import { triggerJob } from "@midday/job-client";
import { createClient } from "@midday/supabase/job";
import type { Job } from "bullmq";
import Papa from "papaparse";
import type { ImportTransactionsPayload } from "../../schemas/transactions";
import { getDb } from "../../utils/db";
import { processBatch } from "../../utils/process-batch";
import { TIMEOUTS, withTimeout } from "../../utils/timeout";
import { BaseProcessor } from "../base";

const BATCH_SIZE = 500;

/**
 * Imports transactions from CSV files
 * Parses CSV, maps columns, validates, and upserts transactions
 * Then triggers embedding for imported transactions
 */
export class ImportTransactionsProcessor extends BaseProcessor<ImportTransactionsPayload> {
  async process(job: Job<ImportTransactionsPayload>): Promise<void> {
    const { teamId, filePath, bankAccountId, currency, mappings, inverted } =
      job.data;
    const db = getDb();
    const supabase = createClient();

    this.logger.info("Starting import-transactions job", {
      jobId: job.id,
      teamId,
      filePath: filePath?.join("/"),
      bankAccountId,
      currency,
    });

    if (!filePath) {
      throw new Error("File path is required");
    }

    await this.updateProgress(
      job,
      this.ProgressMilestones.FETCHED,
      "Downloading file",
    );

    // Download file from Supabase storage with timeout
    const { data: fileData } = await withTimeout(
      supabase.storage.from("vault").download(filePath.join("/")),
      TIMEOUTS.FILE_DOWNLOAD,
      `File download timed out after ${TIMEOUTS.FILE_DOWNLOAD}ms`,
    );

    const content = await fileData?.text();

    if (!content) {
      throw new Error("File content is required");
    }

    await this.updateProgress(job, 20);

    const allTransactionIds: string[] = [];

    await new Promise<void>((resolve, reject) => {
      // @ts-expect-error - Papa.parse overload resolution issue with string type
      Papa.parse(content, {
        header: true,
        skipEmptyLines: true,
        worker: false,
        complete: () => {
          resolve();
        },
        error: (error: Papa.ParseError) => {
          reject(error);
        },
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

          const transformedTransactions = mappedTransactions.map(
            (transaction) => transform({ transaction, inverted }),
          );

          const { validTransactions, invalidTransactions } =
            // @ts-expect-error - validateTransactions types may not match exactly
            validateTransactions(transformedTransactions);

          if (invalidTransactions.length > 0) {
            this.logger.error("Invalid transactions", {
              invalidTransactions,
            });
          }

          // Upsert transactions using db query function
          const results = await processBatch(
            validTransactions,
            BATCH_SIZE,
            async (batch) => {
              // Transform snake_case to camelCase for Drizzle schema
              // Only include fields that exist in the validated transaction
              const transformedBatch = batch.map((t) => ({
                name: t.name,
                date: t.date,
                method: (t.method === "card"
                  ? "card_purchase"
                  : t.method === "bank"
                    ? "transfer"
                    : "other") as "other" | "card_purchase" | "transfer",
                amount: t.amount,
                currency: t.currency,
                teamId: t.team_id,
                bankAccountId: t.bank_account_id ?? null,
                internalId: t.internal_id,
                status: t.status as
                  | "pending"
                  | "completed"
                  | "archived"
                  | "posted"
                  | "excluded",
                manual: t.manual,
                categorySlug: t.category_slug ?? null,
                // Optional fields that may not exist in imported transactions
                description: null,
                balance: null,
                note: null,
                counterpartyName: null,
                merchantName: null,
                assignedId: null,
                internal: false,
                notified: true,
                baseAmount: null,
                baseCurrency: null,
                taxAmount: null,
                taxRate: null,
                taxType: null,
                recurring: false,
                frequency: null,
                enrichmentCompleted: false,
              }));

              // Upsert transactions with conflict handling on internalId
              const upserted = await upsertTransactions(db, {
                transactions: transformedBatch,
                teamId,
              });

              return upserted;
            },
          );

          // Collect all transaction IDs
          const batchTransactionIds = results
            .flat()
            .map((tx) => tx.id)
            .filter(Boolean);

          allTransactionIds.push(...batchTransactionIds);

          parser.resume();
        },
      });
    });

    await this.updateProgress(job, 80);

    // Trigger embeddings for imported transactions
    if (allTransactionIds.length > 0) {
      this.logger.info("Triggering embeddings for imported transactions", {
        count: allTransactionIds.length,
        teamId,
      });

      await triggerJob(
        "embed-transaction",
        {
          transactionIds: allTransactionIds,
          teamId,
        },
        "transactions",
      );
    }

    await this.updateProgress(job, 100);

    this.logger.info("Import transactions completed", {
      totalImported: allTransactionIds.length,
      teamId,
    });
  }
}
