import type { QueueOptions, WorkerOptions } from "bullmq";
import { getRedisConnection } from "../config";
import type { QueueConfig } from "../types/queue-config";

/**
 * Queue options for merchants queue
 */
const merchantsQueueOptions: QueueOptions = {
  connection: getRedisConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
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
 * Worker options for merchants queue
 * Lower concurrency - each enrichment call uses Gemini + Google Search
 * Longer lock duration - search grounding can be slow
 */
const merchantsWorkerOptions: WorkerOptions = {
  connection: getRedisConnection(),
  concurrency: 5, // Lower concurrency due to external API calls
  lockDuration: 120000, // 2 minutes - search grounding can be slow
  stalledInterval: 2 * 60 * 1000, // 2 minutes
  maxStalledCount: 1,
};

/**
 * Merchants queue configuration
 * For merchant enrichment jobs using Gemini + Google Search grounding
 * Jobs: enrich-merchant
 */
export const merchantsQueueConfig: QueueConfig = {
  name: "merchants",
  queueOptions: merchantsQueueOptions,
  workerOptions: merchantsWorkerOptions,
  eventHandlers: {
    onCompleted: (job) => {
      console.log(`Merchant job completed: ${job.name} (${job.id})`);
    },
    onFailed: (job, err) => {
      console.error(`Merchant job failed: ${job?.name} (${job?.id})`, err);
    },
  },
};
