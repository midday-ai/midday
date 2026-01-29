import { logger } from "@midday/logger";
import type { QueueOptions, WorkerOptions } from "bullmq";
import { getRedisConnection } from "../config";
import type { QueueConfig } from "../types/queue-config";

/**
 * Queue options for institutions queue
 */
const institutionsQueueOptions: QueueOptions = {
  connection: getRedisConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000, // 5 seconds initial delay
    },
    removeOnComplete: {
      age: 24 * 3600, // Keep completed jobs for 24 hours
      count: 100, // Keep max 100 completed jobs
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Keep failed jobs for 7 days
    },
  },
};

/**
 * Worker options for institutions queue
 * Concurrency: 1 (institutions sync runs once per schedule)
 * Lock duration: 300000ms (5 minutes) for API calls and batch operations
 */
const institutionsWorkerOptions: WorkerOptions = {
  connection: getRedisConnection(),
  concurrency: 1, // Only one sync job runs at a time
  lockDuration: 300000, // 5 minutes - sync can take time with all providers
};

/**
 * Institutions queue configuration
 * For institution sync scheduler jobs
 * Jobs: sync-institutions
 */
export const institutionsQueueConfig: QueueConfig = {
  name: "institutions",
  queueOptions: institutionsQueueOptions,
  workerOptions: institutionsWorkerOptions,
  eventHandlers: {
    onCompleted: (job) => {
      logger.info(`Institutions job completed: ${job.name} (${job.id})`);
    },
    onFailed: (job, err) => {
      logger.error(`Institutions job failed: ${job?.name} (${job?.id})`, { error: err });
    },
  },
};
