import { createLoggerWithContext } from "@midday/logger";
import type { QueueOptions, WorkerOptions } from "bullmq";
import { getRedisConnection } from "../config";
import type { QueueConfig } from "../types/queue-config";

const logger = createLoggerWithContext("worker:queue:transactions");

/**
 * Queue options for transactions queue
 */
const transactionsQueueOptions: QueueOptions = {
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
 * Worker options for transactions queue
 * Concurrency: 10 (matching export-transactions)
 * Increased stall interval for long-running export jobs
 * Lock duration: 300000ms (5 minutes) for long-running export jobs
 */
const transactionsWorkerOptions: WorkerOptions = {
  connection: getRedisConnection(),
  concurrency: 10,
  lockDuration: 300000, // 5 minutes - export jobs can be long-running
  stalledInterval: 5 * 60 * 1000, // 5 minutes - allow jobs to run longer before considering them stalled
  maxStalledCount: 1, // Only retry once if stalled
};

/**
 * Transactions queue configuration
 * For transaction export and processing jobs
 * Jobs: export-transactions, process-export
 */
export const transactionsQueueConfig: QueueConfig = {
  name: "transactions",
  queueOptions: transactionsQueueOptions,
  workerOptions: transactionsWorkerOptions,
  eventHandlers: {
    onFailed: (job, err) => {
      logger.error("Job failed", {
        jobName: job?.name,
        jobId: job?.id,
        error: err.message,
      });
    },
  },
};
