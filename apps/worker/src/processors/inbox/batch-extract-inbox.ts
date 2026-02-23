import { updateInbox, updateInboxWithProcessedData } from "@midday/db/queries";
import {
  type BatchExtractionItem,
  type BatchExtractionResult,
  type BatchJobStatus,
  cancelBatchJob,
  downloadBatchErrors,
  downloadBatchResults,
  getBatchJobStatus,
  submitBatchExtraction,
} from "@midday/documents/batch";
import { triggerJob, triggerJobAndWait } from "@midday/job-client";
import { createClient } from "@midday/supabase/job";
import type { Job } from "bullmq";
import { getDb } from "../../utils/db";
import { BaseProcessor } from "../base";

interface BatchExtractInboxPayload {
  items: Array<{
    id: string;
    filePath: string[];
    teamId: string;
  }>;
  teamId: string;
  inboxAccountId: string;
}

const BATCH_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const POLL_INTERVALS = [5000, 10000, 20000, 30000];
const CHUNK_SIZE = 50;

function getPollInterval(attempt: number): number {
  if (attempt < POLL_INTERVALS.length) {
    return POLL_INTERVALS[attempt]!;
  }
  return POLL_INTERVALS[POLL_INTERVALS.length - 1]!;
}

function isTerminalStatus(status: BatchJobStatus): boolean {
  return (
    status === "SUCCESS" ||
    status === "FAILED" ||
    status === "TIMEOUT_EXCEEDED" ||
    status === "CANCELLED"
  );
}

export class BatchExtractInboxProcessor extends BaseProcessor<BatchExtractInboxPayload> {
  async process(job: Job<BatchExtractInboxPayload>): Promise<{
    totalItems: number;
    succeeded: number;
    failed: number;
    batchJobIds: string[];
  }> {
    const { items, teamId, inboxAccountId } = job.data;
    const supabase = createClient();
    const db = getDb();

    this.logger.info("Starting batch extraction", {
      jobId: job.id,
      teamId,
      inboxAccountId,
      itemCount: items.length,
    });

    const batchItems: BatchExtractionItem[] = [];

    for (const item of items) {
      if (!item.id) {
        this.logger.warn("Skipping batch item with missing id", {
          filePath: item.filePath,
          teamId: item.teamId,
        });
        continue;
      }

      const filePath = item.filePath.join("/");

      try {
        const { data } = await supabase.storage
          .from("vault")
          .download(filePath);

        if (!data) {
          this.logger.warn("File not found in storage, skipping", {
            filePath,
            inboxItemId: item.id,
          });
          continue;
        }

        const buffer = await data.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");

        batchItems.push({
          id: item.id,
          pdfBase64: base64,
        });
      } catch (error) {
        this.logger.warn("Failed to download file, skipping", {
          filePath,
          inboxItemId: item.id,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    if (batchItems.length === 0) {
      this.logger.warn("No valid items to process", {
        jobId: job.id,
        teamId,
      });
      return {
        totalItems: items.length,
        succeeded: 0,
        failed: items.length,
        batchJobIds: [],
      };
    }

    // Split into chunks to avoid large JSONL uploads
    const chunks: BatchExtractionItem[][] = [];
    for (let i = 0; i < batchItems.length; i += CHUNK_SIZE) {
      chunks.push(batchItems.slice(i, i + CHUNK_SIZE));
    }

    this.logger.info("Submitting batch chunks to Mistral", {
      jobId: job.id,
      totalItems: batchItems.length,
      chunkCount: chunks.length,
      chunkSize: CHUNK_SIZE,
    });

    const batchJobIds = await Promise.all(
      chunks.map(async (chunk, idx) => {
        const batchJobId = await submitBatchExtraction(chunk);
        this.logger.info("Batch chunk submitted", {
          jobId: job.id,
          batchJobId,
          chunkIndex: idx,
          chunkSize: chunk.length,
        });
        return batchJobId;
      }),
    );

    await Promise.all(
      batchItems.map((item) =>
        updateInbox(db, {
          id: item.id,
          teamId,
          status: "processing",
        }),
      ),
    );

    const allResults = await this.pollBatchJobs(job, batchJobIds);

    const processedIds = new Set(allResults.map((r) => r.id));
    const { succeeded, failed } = await this.processResults(
      allResults,
      items,
      teamId,
      inboxAccountId,
      db,
    );

    // Fallback: items that were submitted but got no result
    const unprocessedItems = items.filter(
      (item) =>
        item.id &&
        batchItems.some((b) => b.id === item.id) &&
        !processedIds.has(item.id),
    );

    if (unprocessedItems.length > 0) {
      this.logger.info("Falling back to real-time for unprocessed items", {
        jobId: job.id,
        count: unprocessedItems.length,
      });

      for (const item of unprocessedItems) {
        try {
          await triggerJob(
            "process-attachment",
            {
              filePath: item.filePath,
              teamId: item.teamId,
              size: 0,
              mimetype: "application/pdf",
              inboxAccountId,
            },
            "inbox",
          );
        } catch (error) {
          this.logger.error("Failed to queue fallback extraction", {
            inboxItemId: item.id,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
    }

    return {
      totalItems: items.length,
      succeeded,
      failed: failed + unprocessedItems.length,
      batchJobIds,
    };
  }

  /**
   * Poll multiple batch jobs concurrently until all complete or timeout.
   * Returns merged results from all completed jobs.
   */
  private async pollBatchJobs(
    job: Job<BatchExtractInboxPayload>,
    batchJobIds: string[],
  ): Promise<BatchExtractionResult[]> {
    const startTime = Date.now();
    const pending = new Set(batchJobIds);
    const allResults: BatchExtractionResult[] = [];
    let pollAttempt = 0;

    while (pending.size > 0 && Date.now() - startTime < BATCH_TIMEOUT_MS) {
      const interval = getPollInterval(pollAttempt);
      await new Promise((resolve) => setTimeout(resolve, interval));
      pollAttempt++;

      const statuses = await Promise.all(
        Array.from(pending).map(async (batchJobId) => {
          const status = await getBatchJobStatus(batchJobId);
          return { batchJobId, status };
        }),
      );

      for (const { batchJobId, status } of statuses) {
        this.logger.info("Batch job poll", {
          jobId: job.id,
          batchJobId,
          status: status.status,
          succeeded: status.succeededRequests,
          failed: status.failedRequests,
          total: status.totalRequests,
          pending: pending.size,
          elapsed: `${Date.now() - startTime}ms`,
        });

        if (isTerminalStatus(status.status)) {
          const results = status.outputFileId
            ? await downloadBatchResults(status.outputFileId)
            : [];

          if (status.errorFileId) {
            const errorResults = await downloadBatchErrors(status.errorFileId);
            const outputIds = new Set(results.map((r) => r.id));
            for (const err of errorResults) {
              if (!outputIds.has(err.id)) {
                results.push(err);
              }
            }
          }

          allResults.push(...results);
          pending.delete(batchJobId);

          this.logger.info("Batch chunk completed", {
            jobId: job.id,
            batchJobId,
            status: status.status,
            resultCount: results.length,
            remainingChunks: pending.size,
          });
        }
      }
    }

    // Cancel any still-running jobs on timeout
    for (const batchJobId of pending) {
      this.logger.warn("Batch chunk timed out, cancelling", {
        jobId: job.id,
        batchJobId,
        elapsed: `${Date.now() - startTime}ms`,
      });

      try {
        await cancelBatchJob(batchJobId);
      } catch (cancelError) {
        this.logger.warn("Failed to cancel batch job", {
          batchJobId,
          error:
            cancelError instanceof Error
              ? cancelError.message
              : "Unknown error",
        });
      }
    }

    return allResults;
  }

  /**
   * Process extraction results: update DB, trigger embeddings, queue fallbacks.
   */
  private async processResults(
    results: BatchExtractionResult[],
    items: BatchExtractInboxPayload["items"],
    teamId: string,
    inboxAccountId: string,
    db: ReturnType<typeof getDb>,
  ): Promise<{ succeeded: number; failed: number }> {
    let succeeded = 0;
    let failed = 0;

    for (const result of results) {
      if (result.success && result.data) {
        try {
          const data = result.data;
          const docType = data.document_type as string | undefined;

          await updateInboxWithProcessedData(db, {
            id: result.id,
            amount: data.total_amount as number | undefined,
            currency: data.currency as string | undefined,
            displayName:
              (data.vendor_name as string) ||
              (data.store_name as string) ||
              undefined,
            website: data.website as string | undefined,
            date:
              (data.invoice_date as string) ||
              (data.date as string) ||
              undefined,
            taxAmount: data.tax_amount as number | undefined,
            taxRate: data.tax_rate as number | undefined,
            taxType: data.tax_type as string | undefined,
            type:
              docType === "invoice"
                ? "invoice"
                : docType === "receipt"
                  ? "expense"
                  : docType === "other"
                    ? "other"
                    : null,
            invoiceNumber: data.invoice_number as string | undefined,
            status: "analyzing",
          });

          if (docType !== "other") {
            try {
              await triggerJobAndWait(
                "embed-inbox",
                { inboxId: result.id, teamId },
                "embeddings",
                { timeout: 60000 },
              );
            } catch (embedError) {
              this.logger.warn("Embedding failed for batch item", {
                inboxId: result.id,
                error:
                  embedError instanceof Error
                    ? embedError.message
                    : "Unknown error",
              });
              await updateInboxWithProcessedData(db, {
                id: result.id,
                status: "pending",
              });
            }
          } else {
            await updateInboxWithProcessedData(db, {
              id: result.id,
              status: "other",
            });
          }

          succeeded++;
        } catch (updateError) {
          this.logger.error("Failed to update inbox item from batch", {
            inboxId: result.id,
            error:
              updateError instanceof Error
                ? updateError.message
                : "Unknown error",
          });
          failed++;
        }
      } else {
        this.logger.warn("Batch item extraction failed, queuing fallback", {
          inboxId: result.id,
          error: result.error,
        });

        const originalItem = items.find((i) => i.id === result.id);
        if (originalItem) {
          try {
            await triggerJob(
              "process-attachment",
              {
                filePath: originalItem.filePath,
                teamId: originalItem.teamId,
                size: 0,
                mimetype: "application/pdf",
                inboxAccountId,
              },
              "inbox",
            );
          } catch (fallbackError) {
            this.logger.error("Failed to queue fallback extraction", {
              inboxId: result.id,
              error:
                fallbackError instanceof Error
                  ? fallbackError.message
                  : "Unknown error",
            });
          }
        }
        failed++;
      }
    }

    return { succeeded, failed };
  }
}
