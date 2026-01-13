import { updateDocumentByPath } from "@midday/db/queries";
import { createLoggerWithContext } from "@midday/logger";
import type { QueueOptions, WorkerOptions } from "bullmq";
import { getRedisConnection } from "../config";
import type { JobInfo, QueueConfig } from "../types/queue-config";
import { getDb } from "../utils/db";
import { UnsupportedFileTypeError } from "../utils/error-classification";

const logger = createLoggerWithContext("documents-queue");

/**
 * Queue options for documents queue
 */
const documentsQueueOptions: QueueOptions = {
  connection: getRedisConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: {
      age: 24 * 3600, // Keep completed jobs for 24 hours
      count: 1000, // Keep max 1000 completed jobs
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Keep failed jobs for 7 days
    },
  },
};

/**
 * Worker options for documents queue
 * Concurrency: 10 - conservative for memory + API rate limits
 * - HEIC conversion is memory-intensive (~50-100MB per 12MP image)
 * - AI classification calls (Gemini) have rate limits
 * - With 4GB worker memory and 10 concurrent jobs, plenty of headroom
 * Lock duration: 660000ms (11 minutes) to handle long-running document processing
 * - Document processing timeout is 10 minutes (TIMEOUTS.DOCUMENT_PROCESSING)
 * - Plus 1 minute buffer for classification and other operations
 * Stalled interval: 720000ms (12 minutes) - must be longer than lockDuration
 */
const documentsWorkerOptions: WorkerOptions = {
  connection: getRedisConnection(),
  concurrency: 10, // Conservative for memory safety + AI API rate limits
  lockDuration: 660000, // 11 minutes - align with DOCUMENT_PROCESSING timeout (10min) + buffer
  stalledInterval: 720000, // 12 minutes - longer than lockDuration to avoid false stalls
  limiter: {
    max: 20, // 20 jobs/second max - prevents API burst
    duration: 1000,
  },
};

/**
 * Handle unsupported file types - mark as completed with filename as title
 * This is NOT a failure, the file is stored but just can't be AI-classified
 */
async function handleUnsupportedFileType(
  job: JobInfo,
  error: UnsupportedFileTypeError,
): Promise<void> {
  const db = getDb();
  const data = job.data as {
    teamId?: string;
    filePath?: string[];
  };

  if (!data.filePath || !data.teamId) {
    return;
  }

  try {
    // Use filename as title so it displays normally in UI (no "needs classification")
    const displayName = data.filePath.at(-1) ?? "Document";

    await updateDocumentByPath(db, {
      pathTokens: data.filePath,
      teamId: data.teamId,
      title: displayName,
      summary: `File type (${error.mimetype}) is not supported for content extraction`,
      processingStatus: "completed",
    });

    logger.info("Unsupported file type marked as completed", {
      filePath: data.filePath.join("/"),
      mimetype: error.mimetype,
    });
  } catch (err) {
    logger.error("Failed to handle unsupported file type", {
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
}

/**
 * Update document status to failed when all retries are exhausted
 */
async function handleDocumentJobFinalFailure(job: JobInfo): Promise<void> {
  const db = getDb();
  const data = job.data as {
    teamId?: string;
    filePath?: string[];
    fileName?: string;
    documentId?: string;
  };

  try {
    if (data.filePath && data.teamId) {
      // process-document job - uses filePath array
      await updateDocumentByPath(db, {
        pathTokens: data.filePath,
        teamId: data.teamId,
        processingStatus: "failed",
      });
      logger.info("Document status updated to failed", {
        filePath: data.filePath.join("/"),
      });
    } else if (data.fileName && data.teamId) {
      // classify-document/classify-image job - uses fileName string
      await updateDocumentByPath(db, {
        pathTokens: data.fileName.split("/"),
        teamId: data.teamId,
        processingStatus: "failed",
      });
      logger.info("Document status updated to failed", {
        fileName: data.fileName,
      });
    } else if (data.documentId) {
      // embed-document-tags job - this is a non-critical enrichment step
      // The document was already successfully classified, so don't mark it as failed
      // Tag embedding can be retried later without affecting document usability
      logger.info(
        "Tag embedding failed (non-critical, document still usable)",
        {
          documentId: data.documentId,
        },
      );
    }
  } catch (error) {
    logger.error("Failed to update document status to failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    // Don't rethrow - we don't want to mask the original error
  }
}

/**
 * Documents queue configuration
 * For document processing and classification jobs
 * Jobs: process-document, classify-document, classify-image, embed-document-tags
 */
export const documentsQueueConfig: QueueConfig = {
  name: "documents",
  queueOptions: documentsQueueOptions,
  workerOptions: documentsWorkerOptions,
  eventHandlers: {
    onCompleted: (job) => {
      logger.info("Document job completed", {
        jobName: job.name,
        jobId: job.id,
      });
    },
    onFailed: async (job, err) => {
      // Handle unsupported file types immediately (not a failure, just unsupported)
      if (job && err instanceof UnsupportedFileTypeError) {
        logger.info("Handling unsupported file type", {
          jobName: job.name,
          jobId: job.id,
          mimetype: err.mimetype,
        });
        await handleUnsupportedFileType(job, err);
        return;
      }

      logger.error("Document job failed", {
        jobName: job?.name,
        jobId: job?.id,
        error: err instanceof Error ? err.message : "Unknown error",
      });

      // Only update status if all retries are exhausted (final failure)
      if (job && job.attemptsMade !== undefined && job.opts?.attempts) {
        const isLastAttempt = job.attemptsMade >= job.opts.attempts;
        if (isLastAttempt) {
          logger.info(
            "Document job exhausted all attempts, marking as failed",
            {
              jobName: job.name,
              attempts: job.opts.attempts,
            },
          );
          await handleDocumentJobFinalFailure(job);
        }
      }
    },
  },
};
