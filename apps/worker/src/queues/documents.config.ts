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
 * Concurrency: 100 (increased from 50 for faster processing)
 * Documents processing optimized to reduce duplicate downloads and overhead
 * Lock duration: 120000ms (2 minutes) to handle long-running classification jobs
 */
const documentsWorkerOptions: WorkerOptions = {
  connection: getRedisConnection(),
  concurrency: 100, // Increased from 50 for better throughput
  lockDuration: 120000, // 2 minutes - jobs can take up to 60s, add buffer for safety
  limiter: {
    max: 200, // Increased from 100 for higher throughput
    duration: 1000, // 200 jobs per second max
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
