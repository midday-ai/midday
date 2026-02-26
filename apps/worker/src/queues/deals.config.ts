import type { QueueOptions, WorkerOptions } from "bullmq";
import { getRedisConnection } from "../config";
import { DEFAULT_JOB_OPTIONS } from "../config/job-options";
import type { QueueConfig } from "../types/queue-config";

/**
 * Queue options for deals queue
 */
const dealsQueueOptions: QueueOptions = {
  connection: getRedisConnection(),
  defaultJobOptions: {
    ...DEFAULT_JOB_OPTIONS,
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
 * Worker options for deals queue
 * Concurrency: 50 - notifications are lightweight and can run in parallel
 */
const dealsWorkerOptions: WorkerOptions = {
  connection: getRedisConnection(),
  concurrency: 50,
  lockDuration: 30000, // 30 seconds - notifications are quick
  stalledInterval: 60000, // 1 minute
};

/**
 * Deals queue configuration
 * Handles all deal-related notification jobs
 * Jobs: deal-notification
 */
export const dealsQueueConfig: QueueConfig = {
  name: "deals",
  queueOptions: dealsQueueOptions,
  workerOptions: dealsWorkerOptions,
  eventHandlers: {
    onCompleted: (job) => {
      console.log(`Deals job completed: ${job.name} (${job.id})`);
    },
    onFailed: (job, err) => {
      console.error(`Deals job failed: ${job?.name} (${job?.id})`, err);
    },
  },
};
