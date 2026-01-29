import { logger } from "@midday/logger";
import type { QueueOptions, WorkerOptions } from "bullmq";
import { getRedisConnection } from "../config";
import type { QueueConfig } from "../types/queue-config";

/**
 * Queue options for banking queue
 */
const bankingQueueOptions: QueueOptions = {
  connection: getRedisConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000, // 5 seconds initial delay
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
 * Worker options for banking queue
 * - Concurrency: 5 to avoid overwhelming banking APIs
 * - Lock duration: 30 minutes for long-running sync jobs
 * - Stall interval: 5 minutes to allow for API delays
 */
const bankingWorkerOptions: WorkerOptions = {
  connection: getRedisConnection(),
  concurrency: 5, // Conservative to respect API rate limits
  lockDuration: 30 * 60 * 1000, // 30 minutes
  stalledInterval: 5 * 60 * 1000, // 5 minutes
  maxStalledCount: 1,
};

/**
 * Banking queue configuration
 * For bank sync, connection management, and notifications
 *
 * Jobs:
 * - sync-connection: Syncs a bank connection (fan-out to accounts)
 * - sync-account: Syncs balance + transactions for one account
 * - upsert-transactions: Batch upsert transactions to DB
 * - initial-bank-setup: Setup scheduler + initial sync
 * - bank-sync-scheduler: Daily per-team sync trigger
 * - delete-connection: Delete connection from provider
 * - reconnect-connection: Handle reconnect account matching
 * - transaction-notifications: Notify users of new transactions
 */
export const bankingQueueConfig: QueueConfig = {
  name: "banking",
  queueOptions: bankingQueueOptions,
  workerOptions: bankingWorkerOptions,
  eventHandlers: {
    onFailed: (job, err) => {
      logger.error(`Banking job failed: ${job?.name} (${job?.id})`, {
        error: err,
      });
    },
  },
};
