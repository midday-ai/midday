import type { QueueOptions, WorkerOptions } from "bullmq";
import { getRedisConnection } from "../config";
import type { QueueConfig } from "../types/queue-config";

/**
 * Queue options for notifications queue
 */
const notificationsQueueOptions: QueueOptions = {
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
 * Worker options for notifications queue
 * Concurrency: 5 (matching Trigger.dev notification task concurrency)
 * Notifications are lightweight operations
 */
const notificationsWorkerOptions: WorkerOptions = {
  connection: getRedisConnection(),
  concurrency: 5, // Matching Trigger.dev notification task concurrency
  lockDuration: 60000, // 1 minute - notifications should be quick
  limiter: {
    max: 50, // 50 jobs per second max
    duration: 1000,
  },
};

/**
 * Notifications queue configuration
 * For notification and activity creation jobs
 * Jobs: notification
 */
export const notificationsQueueConfig: QueueConfig = {
  name: "notifications",
  queueOptions: notificationsQueueOptions,
  workerOptions: notificationsWorkerOptions,
  eventHandlers: {
    onCompleted: (job) => {
      console.log(`Notification job completed: ${job.name} (${job.id})`);
    },
    onFailed: (job, err) => {
      console.error(`Notification job failed: ${job?.name} (${job?.id})`, err);
    },
  },
};
