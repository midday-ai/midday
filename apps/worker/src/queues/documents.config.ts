import { createLoggerWithContext } from "@midday/logger";
import type { QueueOptions, WorkerOptions } from "bullmq";
import { getRedisConnection } from "../config";
import type { QueueConfig } from "../types/queue-config";

const logger = createLoggerWithContext("documents-queue");

const documentsQueueOptions: QueueOptions = {
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

const documentsWorkerOptions: WorkerOptions = {
  connection: getRedisConnection(),
  concurrency: 10,
  lockDuration: 120000,
  stalledInterval: 150000,
};

/**
 * Documents queue configuration
 * Jobs: embed-document-tags
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
    onFailed: (job, err) => {
      logger.error("Document job failed", {
        jobName: job?.name,
        jobId: job?.id,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    },
  },
};
