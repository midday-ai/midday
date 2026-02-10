import { createLoggerWithContext } from "@midday/logger";
import type { QueueOptions, WorkerOptions } from "bullmq";
import { getRedisConnection } from "../config";
import type { QueueConfig } from "../types/queue-config";

const logger = createLoggerWithContext("worker:queue:accounting");

/**
 * Queue options for accounting queue
 * Uses BullMQ native retries with exponential backoff:
 *   Attempt 1: immediate
 *   Attempt 2: 5 min delay
 *   Attempt 3: 10 min delay
 *   Attempt 4: 20 min delay
 */
const accountingQueueOptions: QueueOptions = {
  connection: getRedisConnection(),
  defaultJobOptions: {
    attempts: 4,
    backoff: {
      type: "exponential",
      delay: 5 * 60 * 1000, // 5 minutes initial delay for API recovery
    },
    removeOnComplete: {
      age: 24 * 3600, // Keep completed jobs for 24 hours
      count: 100, // Keep max 100 completed jobs
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Keep failed jobs for 7 days for debugging
      count: 500, // Keep max 500 failed jobs
    },
  },
};

/**
 * Worker options for accounting queue
 *
 * Rate limiting strategy:
 * - concurrency: 10 - High parallelism
 * - Jobs have calculated delays at creation time (see export-transactions.ts)
 * - Delayed jobs don't compete - they start at their scheduled time
 *
 * Different teams can run in parallel without blocking each other.
 */
const accountingWorkerOptions: WorkerOptions = {
  connection: getRedisConnection(),
  concurrency: 10, // High parallelism - delays prevent rate limit issues
  lockDuration: 600000, // 10 minutes - allows ~2000 transactions at 250ms throttle
  stalledInterval: 10 * 60 * 1000, // 10 minutes
  maxStalledCount: 1,
};

/**
 * Accounting queue configuration
 * For syncing transactions to external accounting software (Xero, QuickBooks, etc.)
 * Jobs: sync-accounting-transactions, sync-accounting-attachments, export-to-accounting
 */
export const accountingQueueConfig: QueueConfig = {
  name: "accounting",
  queueOptions: accountingQueueOptions,
  workerOptions: accountingWorkerOptions,
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
