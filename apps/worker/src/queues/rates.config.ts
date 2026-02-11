import { createLoggerWithContext } from "@midday/logger";
import type { QueueOptions, WorkerOptions } from "bullmq";
import { getRedisConnection } from "../config";
import type { QueueConfig } from "../types/queue-config";

const logger = createLoggerWithContext("worker:queue:rates");

/**
 * Queue options for rates queue
 */
const ratesQueueOptions: QueueOptions = {
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
 * Worker options for rates queue
 * Concurrency: 1 (rates scheduler runs once per schedule)
 * Lock duration: 120000ms (2 minutes) for API calls and batch upserts
 */
const ratesWorkerOptions: WorkerOptions = {
  connection: getRedisConnection(),
  concurrency: 1, // Only one rates scheduler job runs at a time
  lockDuration: 120000, // 2 minutes - API calls and batch upserts can take time
};

/**
 * Rates queue configuration
 * For exchange rates scheduler jobs
 * Jobs: rates-scheduler
 */
export const ratesQueueConfig: QueueConfig = {
  name: "rates",
  queueOptions: ratesQueueOptions,
  workerOptions: ratesWorkerOptions,
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
