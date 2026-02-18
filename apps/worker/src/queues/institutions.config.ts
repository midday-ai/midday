import { createLoggerWithContext } from "@midday/logger";
import type { QueueOptions, WorkerOptions } from "bullmq";
import { getRedisConnection } from "../config";
import type { QueueConfig } from "../types/queue-config";

const logger = createLoggerWithContext("worker:queue:institutions");

const institutionsQueueOptions: QueueOptions = {
  connection: getRedisConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: {
      age: 24 * 3600,
      count: 100,
    },
    removeOnFail: {
      age: 7 * 24 * 3600,
    },
  },
};

const institutionsWorkerOptions: WorkerOptions = {
  connection: getRedisConnection(),
  concurrency: 1,
  lockDuration: 300000, // 5 minutes - fetching from all providers takes time
};

/**
 * Institutions queue configuration
 * For institution sync jobs
 * Jobs: sync-institutions
 */
export const institutionsQueueConfig: QueueConfig = {
  name: "institutions",
  queueOptions: institutionsQueueOptions,
  workerOptions: institutionsWorkerOptions,
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
