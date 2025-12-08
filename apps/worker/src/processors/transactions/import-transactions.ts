import { transactions } from "@midday/db/schema";
import { mapTransactions } from "@midday/import/mappings";
import { transform } from "@midday/import/transform";
import { validateTransactions } from "@midday/import/validate";
import { triggerJob } from "@midday/job-client";
import { createClient } from "@midday/supabase/job";
import type { Job } from "bullmq";
import { sql } from "drizzle-orm";
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

          // Upsert transactions using Drizzle ORM
          const results = await processBatch(
            validTransactions,
            BATCH_SIZE,
            async (batch) => {
              // Transform snake_case to camelCase for Drizzle schema
              const transformedBatch = batch.map((t) => ({
                name: t.name,
                date: t.date,
                method: t.method as "other" | "card_purchase" | "transfer",
                amount: t.amount,
                currency: t.currency,
                teamId: t.team_id,
                bankAccountId: t.bank_account_id,
                internalId: t.internal_id,
                status: t.status,
                manual: t.manual,
                categorySlug: t.category_slug,
                notified: true,
              }));

              // Upsert transactions with onConflict on internalId
              const upserted = await db
                .insert(transactions)
                .values(transformedBatch)
                .onConflictDoUpdate({
                  target: [transactions.internalId],
                  set: {
                    // Update all fields except id and createdAt
                    name: sql`excluded.name`,
                    amount: sql`excluded.amount`,
                    currency: sql`excluded.currency`,
                    date: sql`excluded.date`,
                    description: sql`excluded.description`,
                    method: sql`excluded.method`,
                    status: sql`excluded.status`,
                    balance: sql`excluded.balance`,
                    note: sql`excluded.note`,
                    categorySlug: sql`excluded.category_slug`,
                    counterpartyName: sql`excluded.counterparty_name`,
                    merchantName: sql`excluded.merchant_name`,
                    bankAccountId: sql`excluded.bank_account_id`,
                    assignedId: sql`excluded.assigned_id`,
                    internal: sql`excluded.internal`,
                    notified: sql`excluded.notified`,
                    manual: sql`excluded.manual`,
                    baseAmount: sql`excluded.base_amount`,
                    baseCurrency: sql`excluded.base_currency`,
                    taxAmount: sql`excluded.tax_amount`,
                    taxRate: sql`excluded.tax_rate`,
                    taxType: sql`excluded.tax_type`,
                    recurring: sql`excluded.recurring`,
                    frequency: sql`excluded.frequency`,
                    enrichmentCompleted: sql`excluded.enrichment_completed`,
                  },
                })
                .returning({
                  id: transactions.id,
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
