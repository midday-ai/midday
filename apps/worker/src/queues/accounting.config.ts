import type { QueueOptions, WorkerOptions } from "bullmq";
import { getRedisConnection } from "../config";
import type { QueueConfig } from "../types/queue-config";

/**
 * Queue options for accounting queue
 */
const accountingQueueOptions: QueueOptions = {
  connection: getRedisConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000, // Start with 5 seconds due to API rate limits
    },
    removeOnComplete: {
      age: 24 * 3600, // Keep completed jobs for 24 hours
      count: 500, // Keep max 500 completed jobs
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Keep failed jobs for 7 days
    },
  },
};

/**
 * Worker options for accounting queue
 * Concurrency: 10 (conservative to avoid API rate limits)
 * Lock duration: 5 minutes - API calls can be slow, especially with attachments
 */
const accountingWorkerOptions: WorkerOptions = {
  connection: getRedisConnection(),
  concurrency: 10,
  lockDuration: 300000, // 5 minutes
  stalledInterval: 5 * 60 * 1000, // 5 minutes
  maxStalledCount: 1,
  limiter: {
    max: 20, // Max 20 jobs per second to avoid API rate limits
    duration: 1000,
  },
};

/**
 * Accounting queue configuration
 * For syncing transactions to external accounting software (Xero, QuickBooks, etc.)
 * Jobs: sync-accounting-transactions, sync-accounting-attachments, export-to-accounting
 */
export const accountingQueueConfig: QueueConfig = {
  name: "accounting",
  queueOptions: accountingQueueOptions,
  workerOptions: accountingWorkerOptions,
  eventHandlers: {
    onCompleted: (job) => {
      console.log(`Accounting job completed: ${job.name} (${job.id})`);
    },
    onFailed: (job, err) => {
      console.error(`Accounting job failed: ${job?.name} (${job?.id})`, err);
    },
  },
};

