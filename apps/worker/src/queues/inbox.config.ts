import type { QueueOptions, WorkerOptions } from "bullmq";
import { getRedisConnection } from "../config";
import type { QueueConfig } from "../types/queue-config";

/**
 * Queue options for inbox queue
 */
const inboxQueueOptions: QueueOptions = {
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
 * Worker options for inbox queue
 * Concurrency: 50 (matching process-attachment)
 */
const inboxWorkerOptions: WorkerOptions = {
  connection: getRedisConnection(),
  concurrency: 50,
  limiter: {
    max: 100,
    duration: 1000, // 100 jobs per second max
  },
};

/**
 * Inbox queue configuration
 * Main queue for inbox processing jobs
 * Jobs: embed-inbox, batch-process-matching, match-transactions-bidirectional
 */
export const inboxQueueConfig: QueueConfig = {
  name: "inbox",
  queueOptions: inboxQueueOptions,
  workerOptions: inboxWorkerOptions,
  eventHandlers: {
    onCompleted: (job) => {
      console.log(`Inbox job completed: ${job.name} (${job.id})`);
    },
    onFailed: (job, err) => {
      console.error(`Inbox job failed: ${job?.name} (${job?.id})`, err);
    },
  },
};

/**
 * Queue options for inbox provider queue
 */
const inboxProviderQueueOptions: QueueOptions = {
  ...inboxQueueOptions,
  defaultJobOptions: {
    ...inboxQueueOptions.defaultJobOptions,
    attempts: 2, // Fewer retries for provider jobs
  },
};

/**
 * Worker options for inbox provider queue
 * Concurrency: 10
 */
const inboxProviderWorkerOptions: WorkerOptions = {
  connection: getRedisConnection(),
  concurrency: 10,
};

/**
 * Inbox provider queue configuration
 * Gmail provider sync jobs
 * Jobs: initial-setup, scheduler, sync-account
 */
export const inboxProviderQueueConfig: QueueConfig = {
  name: "inbox-provider",
  queueOptions: inboxProviderQueueOptions,
  workerOptions: inboxProviderWorkerOptions,
  eventHandlers: {
    onCompleted: (job) => {
      console.log(`Inbox provider job completed: ${job.name} (${job.id})`);
    },
    onFailed: (job, err) => {
      console.error(
        `Inbox provider job failed: ${job?.name} (${job?.id})`,
        err,
      );
    },
  },
};
