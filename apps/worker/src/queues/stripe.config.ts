import type { QueueOptions, WorkerOptions } from "bullmq";
import { getRedisConnection } from "../config";
import type { QueueConfig } from "../types/queue-config";

/**
 * Queue options for stripe queue
 */
const stripeQueueOptions: QueueOptions = {
  connection: getRedisConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000, // Start with 5s delay for rate limit handling
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
 * Worker options for stripe queue
 * Concurrency: 5 (multiple Stripe accounts can sync in parallel)
 * Lock duration: 300000ms (5 minutes) for API calls and batch upserts
 */
const stripeWorkerOptions: WorkerOptions = {
  connection: getRedisConnection(),
  concurrency: 5, // Allow parallel processing of different Stripe accounts
  lockDuration: 300000, // 5 minutes - Stripe API calls can take time for historical sync
};

/**
 * Stripe queue configuration
 * For Stripe transaction sync jobs
 * Jobs: sync-stripe, initial-sync-stripe
 */
export const stripeQueueConfig: QueueConfig = {
  name: "stripe",
  queueOptions: stripeQueueOptions,
  workerOptions: stripeWorkerOptions,
  eventHandlers: {
    onCompleted: (job) => {
      console.log(`Stripe job completed: ${job.name} (${job.id})`);
    },
    onFailed: (job, err) => {
      console.error(`Stripe job failed: ${job?.name} (${job?.id})`, err);
    },
  },
};
