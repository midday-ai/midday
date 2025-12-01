import type { QueueOptions, WorkerOptions } from "bullmq";
import { getRedisConnection } from "../config";
import type { QueueConfig } from "../types/queue-config";

/**
 * Queue options for documents queue
 */
const documentsQueueOptions: QueueOptions = {
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
 * Worker options for documents queue
 * Concurrency: 50 (matching Trigger.dev's process-document concurrencyLimit)
 * Documents processing can be CPU/memory intensive, so we keep it at 50
 */
const documentsWorkerOptions: WorkerOptions = {
  connection: getRedisConnection(),
  concurrency: 50,
  limiter: {
    max: 100,
    duration: 1000, // 100 jobs per second max
  },
};

/**
 * Documents queue configuration
 * For document processing and classification jobs
 * Jobs: process-document
 */
export const documentsQueueConfig: QueueConfig = {
  name: "documents",
  queueOptions: documentsQueueOptions,
  workerOptions: documentsWorkerOptions,
  eventHandlers: {
    onCompleted: (job) => {
      console.log(`Document job completed: ${job.name} (${job.id})`);
    },
    onFailed: (job, err) => {
      console.error(`Document job failed: ${job?.name} (${job?.id})`, err);
    },
  },
};
