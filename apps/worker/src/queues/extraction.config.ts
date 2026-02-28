import { updateDocumentByPath } from "@midday/db/queries";
import { createLoggerWithContext } from "@midday/logger";
import type { QueueOptions, WorkerOptions } from "bullmq";
import { getRedisConnection } from "../config";
import type { JobInfo, QueueConfig } from "../types/queue-config";
import { getDb } from "../utils/db";
import { UnsupportedFileTypeError } from "../utils/error-classification";

const logger = createLoggerWithContext("worker:queue:extraction");

const extractionQueueOptions: QueueOptions = {
  connection: getRedisConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: {
      age: 24 * 3600,
      count: 1000,
    },
    removeOnFail: {
      age: 7 * 24 * 3600,
    },
  },
};

/**
 * Worker options for the extraction queue.
 *
 * Rate-limited to stay safely under the Mistral API 6 RPS limit.
 * All jobs that call the Mistral OCR endpoint (/v1/ocr) synchronously
 * must run on this queue so a single limiter governs all callers.
 *
 * - concurrency 5: at most 5 in-flight Mistral calls
 * - limiter 5/s:   at most 5 new jobs dequeued per second (1 RPS headroom)
 * - lock/stall:    same as inbox queue (process-attachment can take up to 10 min)
 */
const extractionWorkerOptions: WorkerOptions = {
  connection: getRedisConnection(),
  concurrency: 5,
  lockDuration: 660000,
  stalledInterval: 720000,
  limiter: {
    max: 5,
    duration: 1000,
  },
};

/**
 * Extraction queue configuration
 * Jobs: process-attachment, process-transaction-attachment, process-document
 */
export const extractionQueueConfig: QueueConfig = {
  name: "extraction",
  queueOptions: extractionQueueOptions,
  workerOptions: extractionWorkerOptions,
  eventHandlers: {
    onCompleted: (job) => {
      logger.info("Job completed", { jobName: job.name, jobId: job.id });
    },
    onFailed: async (job, err) => {
      if (job && err instanceof UnsupportedFileTypeError) {
        await handleUnsupportedFileType(job, err);
        return;
      }

      logger.error("Job failed", {
        jobName: job?.name,
        jobId: job?.id,
        error: err.message,
      });

      if (
        job?.name === "process-document" &&
        job.attemptsMade !== undefined &&
        job.opts?.attempts
      ) {
        const isLastAttempt = job.attemptsMade >= job.opts.attempts;
        if (isLastAttempt) {
          await handleDocumentJobFinalFailure(job);
        }
      }
    },
  },
};

async function handleUnsupportedFileType(
  job: JobInfo,
  error: UnsupportedFileTypeError,
): Promise<void> {
  const db = getDb();
  const data = job.data as { teamId?: string; filePath?: string[] };

  if (!data.filePath || !data.teamId) return;

  try {
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

async function handleDocumentJobFinalFailure(job: JobInfo): Promise<void> {
  const db = getDb();
  const data = job.data as { teamId?: string; filePath?: string[] };

  if (!data.filePath || !data.teamId) return;

  try {
    await updateDocumentByPath(db, {
      pathTokens: data.filePath,
      teamId: data.teamId,
      processingStatus: "failed",
    });
    logger.info("Document status updated to failed", {
      filePath: data.filePath.join("/"),
    });
  } catch (err) {
    logger.error("Failed to update document status", {
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
}
