import { createLoggerWithContext } from "@midday/logger";
import type { QueueOptions, WorkerOptions } from "bullmq";
import { getRedisConnection } from "../config";
import { DEFAULT_JOB_OPTIONS } from "../config/job-options";
import type { QueueConfig } from "../types/queue-config";

const logger = createLoggerWithContext("worker:queue:notifications");

/**
 * Queue options for notifications queue
 */
const notificationsQueueOptions: QueueOptions = {
  connection: getRedisConnection(),
  defaultJobOptions: {
    ...DEFAULT_JOB_OPTIONS,
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
 * Rate limited to 5 notifications per second to prevent overwhelming
 * email providers, push notification services, and external integrations
 */
const notificationsWorkerOptions: WorkerOptions = {
  connection: getRedisConnection(),
  concurrency: 5,
  lockDuration: 30000, // 30 seconds - notifications are quick
  stalledInterval: 60000, // 1 minute
  limiter: {
    max: 5, // 5 notifications per second
    duration: 1000,
  },
};

/**
 * Notifications queue configuration
 * Unified queue for all notification types:
 * - insight_ready
 * - inbox_new
 * - document_uploaded, document_processed
 * - invoice_paid, invoice_overdue, invoice_sent, etc.
 * - recurring_series_completed, recurring_series_paused
 */
export const notificationsQueueConfig: QueueConfig = {
  name: "notifications",
  queueOptions: notificationsQueueOptions,
  workerOptions: notificationsWorkerOptions,
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
