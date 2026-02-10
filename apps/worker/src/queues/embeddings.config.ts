import { createLoggerWithContext } from "@midday/logger";
import type { QueueOptions, WorkerOptions } from "bullmq";
import { getRedisConnection } from "../config";
import type { QueueConfig } from "../types/queue-config";

const logger = createLoggerWithContext("worker:queue:embeddings");

/**
 * Queue options for embeddings queue
 */
const embeddingsQueueOptions: QueueOptions = {
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
 * Worker options for embeddings queue
 * Concurrency: 50 - embedding jobs are fast and lightweight
 *
 * IMPORTANT: This queue is separate from the inbox queue to prevent deadlocks.
 * When process-attachment/slack-upload jobs use triggerJobAndWait() to wait for
 * embed-inbox completion, having embed-inbox on a separate queue ensures dedicated
 * workers can process it while inbox workers are waiting.
 */
const embeddingsWorkerOptions: WorkerOptions = {
  connection: getRedisConnection(),
  concurrency: 20, // Embeddings are fast, high concurrency is safe
  lockDuration: 60000, // 1 minute - embeddings should be quick
  stalledInterval: 90000, // 1.5 minutes
  limiter: {
    max: 10, // 10 jobs per second max
    duration: 1000,
  },
};

/**
 * Embeddings queue configuration
 * Dedicated queue for embedding generation jobs
 * Jobs: embed-inbox
 *
 * This queue is intentionally separate from the inbox queue to prevent
 * worker starvation when inbox processing jobs (process-attachment, slack-upload)
 * wait for embedding jobs to complete.
 */
export const embeddingsQueueConfig: QueueConfig = {
  name: "embeddings",
  queueOptions: embeddingsQueueOptions,
  workerOptions: embeddingsWorkerOptions,
  eventHandlers: {
    onCompleted: (job) => {
      logger.info("Job completed", { jobName: job.name, jobId: job.id });
    },
    onFailed: (job, err) => {
      logger.error("Job failed", {
        jobName: job?.name,
        jobId: job?.id,
        error: err.message,
      });
    },
  },
};
