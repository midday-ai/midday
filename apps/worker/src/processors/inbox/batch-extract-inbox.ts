import {
  type UpdateInboxWithProcessedDataParams,
  updateInbox,
  updateInboxWithProcessedData,
} from "@midday/db/queries";
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
import { triggerJob } from "@midday/job-client";
import { createClient } from "@midday/supabase/job";
import type { Job } from "bullmq";
import {
  type BatchExtractInboxPayload,
  batchExtractInboxSchema,
} from "../../schemas/inbox";
import { getDb } from "../../utils/db";
import { BaseProcessor } from "../base";

const BATCH_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const POLL_INTERVALS = [5000, 10000, 20000, 30000];
const CHUNK_SIZE = 50;
const MAX_ITEMS_PER_JOB = 500;
const DB_BATCH_SIZE = 100;

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
  protected getPayloadSchema() {
    return batchExtractInboxSchema;
  }

  async process(job: Job<BatchExtractInboxPayload>): Promise<{
    totalItems: number;
    succeeded: number;
    failed: number;
    batchJobIds: string[];
    splitIntoJobs?: number;
  }> {
    const { items, teamId, inboxAccountId } = job.data;
    const supabase = createClient();
    const db = getDb();

    // Split large payloads into separate jobs to limit blast radius
    if (items.length > MAX_ITEMS_PER_JOB) {
      const childJobIds: string[] = [];

      for (let i = 0; i < items.length; i += MAX_ITEMS_PER_JOB) {
        const chunk = items.slice(i, i + MAX_ITEMS_PER_JOB);
        const result = await triggerJob(
          "batch-extract-inbox",
          { items: chunk, teamId, inboxAccountId },
          "inbox-provider",
        );
        childJobIds.push(result.id);
      }

      this.logger.info("Split large batch into child jobs", {
        jobId: job.id,
        totalItems: items.length,
        childJobs: childJobIds.length,
        childJobIds,
      });

      return {
        totalItems: items.length,
        succeeded: 0,
        failed: 0,
        batchJobIds: [],
        splitIntoJobs: childJobIds.length,
      };
    }

    this.logger.info("Starting batch extraction", {
      jobId: job.id,
      teamId,
      inboxAccountId,
      itemCount: items.length,
    });

    // Stream downloads per chunk: download, encode, submit, release memory
    const batchJobIds: string[] = [];
    const submittedItemIds: string[] = [];
    const itemChunks: Array<typeof items> = [];

    for (let i = 0; i < items.length; i += CHUNK_SIZE) {
      itemChunks.push(items.slice(i, i + CHUNK_SIZE));
    }

    for (let chunkIdx = 0; chunkIdx < itemChunks.length; chunkIdx++) {
      const chunk = itemChunks[chunkIdx]!;
      const chunkItems: BatchExtractionItem[] = [];

      for (const item of chunk) {
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

          chunkItems.push({ id: item.id, pdfBase64: base64 });
        } catch (error) {
          this.logger.warn("Failed to download file, skipping", {
            filePath,
            inboxItemId: item.id,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      if (chunkItems.length === 0) {
        this.logger.warn("No valid items in chunk, skipping", {
          jobId: job.id,
          chunkIndex: chunkIdx,
        });
        continue;
      }

      const batchJobId = await submitBatchExtraction(chunkItems);
      batchJobIds.push(batchJobId);
      submittedItemIds.push(...chunkItems.map((item) => item.id));

      this.logger.info("Batch chunk submitted", {
        jobId: job.id,
        batchJobId,
        chunkIndex: chunkIdx,
        chunkSize: chunkItems.length,
      });

      await job.updateProgress({
        status: "submitting",
        chunksSubmitted: chunkIdx + 1,
        totalChunks: itemChunks.length,
        itemsSubmitted: submittedItemIds.length,
        totalItems: items.length,
      });

      // chunkItems goes out of scope here, allowing GC to reclaim the base64 data
    }

    if (batchJobIds.length === 0) {
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

    for (let i = 0; i < submittedItemIds.length; i += DB_BATCH_SIZE) {
      const batch = submittedItemIds.slice(i, i + DB_BATCH_SIZE);
      const settled = await Promise.allSettled(
        batch.map((id) =>
          updateInbox(db, { id, teamId, status: "processing" }),
        ),
      );
      for (const result of settled) {
        if (result.status === "rejected") {
          this.logger.warn("Failed to update inbox item to processing", {
            jobId: job.id,
            error:
              result.reason instanceof Error
                ? result.reason.message
                : "Unknown error",
          });
        }
      }
    }

    await job.updateProgress({
      status: "polling",
      chunksSubmitted: batchJobIds.length,
      totalChunks: itemChunks.length,
      itemsSubmitted: submittedItemIds.length,
      totalItems: items.length,
    });

    const allResults = await this.pollBatchJobs(job, batchJobIds);

    const processedIds = new Set(allResults.map((r) => r.id));
    const { succeeded, failed, embeddableIds } = await this.processResults(
      allResults,
      items,
      teamId,
      inboxAccountId,
      db,
    );

    // Trigger batch embedding for all successful non-"other" items
    if (embeddableIds.length > 0) {
      try {
        await triggerJob(
          "batch-embed-inbox",
          {
            items: embeddableIds.map((id) => ({ inboxId: id, teamId })),
            teamId,
          },
          "inbox",
        );

        this.logger.info("Triggered batch embedding", {
          jobId: job.id,
          embeddableCount: embeddableIds.length,
        });
      } catch (error) {
        this.logger.error("Failed to trigger batch embedding", {
          jobId: job.id,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Fallback: items that were submitted but got no result
    const submittedIdSet = new Set(submittedItemIds);
    const unprocessedItems = items.filter(
      (item) =>
        item.id && submittedIdSet.has(item.id) && !processedIds.has(item.id),
    );

    if (unprocessedItems.length > 0) {
      this.logger.info("Falling back to real-time for unprocessed items", {
        jobId: job.id,
        count: unprocessedItems.length,
      });

      await Promise.allSettled(
        unprocessedItems.map((item) =>
          triggerJob(
            "process-attachment",
            {
              filePath: item.filePath,
              teamId: item.teamId,
              size: item.size ?? 0,
              mimetype: item.mimetype ?? "application/pdf",
              inboxAccountId,
            },
            "inbox",
          ).catch((error) => {
            this.logger.error("Failed to queue fallback extraction", {
              inboxItemId: item.id,
              error: error instanceof Error ? error.message : "Unknown error",
            });
          }),
        ),
      );
    }

    await job.updateProgress({
      status: "complete",
      succeeded,
      failed: failed + unprocessedItems.length,
      totalItems: items.length,
    });

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
   * Process extraction results: batch update DB, collect embeddable IDs, queue fallbacks.
   * Returns succeeded/failed counts and IDs that need embedding.
   */
  private async processResults(
    results: BatchExtractionResult[],
    items: BatchExtractInboxPayload["items"],
    teamId: string,
    inboxAccountId: string | undefined,
    db: ReturnType<typeof getDb>,
  ): Promise<{ succeeded: number; failed: number; embeddableIds: string[] }> {
    let succeeded = 0;
    let failed = 0;
    const embeddableIds: string[] = [];
    const fallbackItems: Array<{
      inboxId: string;
      item: BatchExtractInboxPayload["items"][number];
    }> = [];
    const dbUpdates: UpdateInboxWithProcessedDataParams[] = [];

    for (const result of results) {
      if (result.success && result.data) {
        const data = result.data;
        const docType = data.document_type;

        const type =
          docType === "invoice"
            ? "invoice"
            : docType === "receipt"
              ? "expense"
              : docType === "other"
                ? "other"
                : null;

        dbUpdates.push({
          id: result.id,
          amount: data.total_amount ?? undefined,
          currency: data.currency ?? undefined,
          displayName: data.vendor_name || undefined,
          website: data.website ?? undefined,
          date: data.invoice_date || undefined,
          taxAmount: data.tax_amount ?? undefined,
          taxRate: data.tax_rate ?? undefined,
          taxType: data.tax_type ?? undefined,
          type,
          invoiceNumber: data.invoice_number ?? undefined,
          status: docType === "other" ? "other" : "analyzing",
        });

        if (docType !== "other") {
          embeddableIds.push(result.id);
        }

        succeeded++;
      } else {
        this.logger.warn("Batch item extraction failed, queuing fallback", {
          inboxId: result.id,
          error: result.error,
        });

        const originalItem = items.find((i) => i.id === result.id);
        if (originalItem) {
          fallbackItems.push({ inboxId: result.id, item: originalItem });
        }
        failed++;
      }
    }

    for (let i = 0; i < dbUpdates.length; i += DB_BATCH_SIZE) {
      const batch = dbUpdates.slice(i, i + DB_BATCH_SIZE);
      const settled = await Promise.allSettled(
        batch.map((update) => updateInboxWithProcessedData(db, update)),
      );
      for (const result of settled) {
        if (result.status === "rejected") {
          this.logger.warn("Failed to update inbox item with processed data", {
            error:
              result.reason instanceof Error
                ? result.reason.message
                : "Unknown error",
          });
        }
      }
    }

    if (fallbackItems.length > 0) {
      await Promise.allSettled(
        fallbackItems.map(({ inboxId, item }) =>
          triggerJob(
            "process-attachment",
            {
              filePath: item.filePath,
              teamId: item.teamId,
              size: item.size ?? 0,
              mimetype: item.mimetype ?? "application/pdf",
              inboxAccountId,
            },
            "inbox",
          ).catch((error) => {
            this.logger.error("Failed to queue fallback extraction", {
              inboxId,
              error: error instanceof Error ? error.message : "Unknown error",
            });
          }),
        ),
      );
    }

    return { succeeded, failed, embeddableIds };
  }
}
