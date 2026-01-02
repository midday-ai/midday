import type { QueueOptions, WorkerOptions } from "bullmq";
import { getRedisConnection } from "../config";
import type { QueueConfig } from "../types/queue-config";

/**
 * Queue options for invoices queue
 */
const invoicesQueueOptions: QueueOptions = {
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
 * Worker options for invoices queue
 * Concurrency: 50 - notifications are lightweight and can run in parallel
 */
const invoicesWorkerOptions: WorkerOptions = {
  connection: getRedisConnection(),
  concurrency: 50,
  lockDuration: 30000, // 30 seconds - notifications are quick
  stalledInterval: 60000, // 1 minute
};

/**
 * Invoices queue configuration
 * Handles all invoice-related notification jobs
 * Jobs: invoice-notification
 */
export const invoicesQueueConfig: QueueConfig = {
  name: "invoices",
  queueOptions: invoicesQueueOptions,
  workerOptions: invoicesWorkerOptions,
  eventHandlers: {
    onCompleted: (job) => {
      console.log(`Invoices job completed: ${job.name} (${job.id})`);
    },
    onFailed: (job, err) => {
      console.error(`Invoices job failed: ${job?.name} (${job?.id})`, err);
    },
  },
};
