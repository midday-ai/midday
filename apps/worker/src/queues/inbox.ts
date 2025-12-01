import type { QueueOptions } from "bullmq";
import { Queue } from "bullmq";
import { getRedisConnection } from "../config";

/**
 * Queue options for inbox queue
 * Concurrency: 50 (matching process-attachment)
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
 * Inbox queue - Main queue for inbox processing jobs
 * Jobs: process-attachment, embed-inbox, batch-process-matching, match-transactions-bidirectional, slack-upload
 */
export const inboxQueue = new Queue("inbox", inboxQueueOptions);

/**
 * Inbox provider queue - Gmail provider sync jobs
 * Concurrency: 10
 * Jobs: initial-setup, scheduler, sync-account
 */
export const inboxProviderQueue = new Queue("inbox-provider", {
  ...inboxQueueOptions,
  defaultJobOptions: {
    ...inboxQueueOptions.defaultJobOptions,
    attempts: 2, // Fewer retries for provider jobs
  },
});
