import { createLoggerWithContext } from "@midday/logger";
import type { QueueOptions, WorkerOptions } from "bullmq";
import { getRedisConnection } from "../config";
import type { QueueConfig } from "../types/queue-config";

const logger = createLoggerWithContext("worker:queue:inbox");

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
 * Concurrency: 50
 * Optimized to reduce duplicate downloads and overhead
 * Lock duration: 660000ms (11 minutes) for long-running process-attachment jobs
 * Document processing timeout is 10 minutes, plus buffer for other operations
 * Stalled interval: 720000ms (12 minutes) to allow jobs to complete before marking as stalled
 */
const inboxWorkerOptions: WorkerOptions = {
  connection: getRedisConnection(),
  concurrency: 50,
  lockDuration: 660000, // 11 minutes - document processing can take up to 10 minutes (multi-pass extraction + retries), plus buffer
  stalledInterval: 720000, // 12 minutes - longer than lockDuration to avoid false stalls
  limiter: {
    max: 100,
    duration: 1000, // 100 jobs per second max
  },
};

/**
 * Inbox queue configuration
 * Main queue for inbox processing jobs
 * Jobs: batch-process-matching, match-transactions-bidirectional, process-attachment, slack-upload, whatsapp-upload
 */
export const inboxQueueConfig: QueueConfig = {
  name: "inbox",
  queueOptions: inboxQueueOptions,
  workerOptions: inboxWorkerOptions,
  eventHandlers: {
    onCompleted: (job) => {
      logger.info("Job completed", { jobName: job.name, jobId: job.id });
    },
    onFailed: (job, err) => {
      logger.error("Job failed", {
        jobName: job?.name,
        jobId: job?.id,
        error: err.message,
      });
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
 * Concurrency: 5 (each sync job hits external Gmail/Outlook APIs)
 * No global rate limiter -- BullMQ limiters are priority-blind, so a global
 * limiter would let background scheduler traffic block user-initiated manual
 * syncs even when they have higher priority. Concurrency alone is sufficient
 * to cap external API pressure; priority ordering ensures manual syncs are
 * picked up ahead of background work as soon as a slot opens.
 * Lock/stalled intervals support batch extraction jobs (up to 35 min)
 */
const inboxProviderWorkerOptions: WorkerOptions = {
  connection: getRedisConnection(),
  concurrency: 5,
  lockDuration: 1800000, // 30 minutes -- batch extraction can poll for up to 30 min
  stalledInterval: 2100000, // 35 minutes -- longer than lockDuration to avoid false stalls
};

/**
 * Inbox provider queue configuration
 * Jobs: initial-setup, sync-scheduler, sync-accounts-scheduler, batch-extract-inbox
 */
export const inboxProviderQueueConfig: QueueConfig = {
  name: "inbox-provider",
  queueOptions: inboxProviderQueueOptions,
  workerOptions: inboxProviderWorkerOptions,
  eventHandlers: {
    onCompleted: (job) => {
      logger.info("Job completed", { jobName: job.name, jobId: job.id });
    },
    onFailed: (job, err) => {
      logger.error("Job failed", {
        jobName: job?.name,
        jobId: job?.id,
        error: err.message,
      });
    },
  },
};
