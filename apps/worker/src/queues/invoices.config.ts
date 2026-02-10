import { createLoggerWithContext } from "@midday/logger";
import type { QueueOptions, WorkerOptions } from "bullmq";
import { getRedisConnection } from "../config";
import { DEFAULT_JOB_OPTIONS } from "../config/job-options";
import type { QueueConfig } from "../types/queue-config";

const logger = createLoggerWithContext("worker:queue:invoices");

/**
 * Queue options for invoices queue
 */
const invoicesQueueOptions: QueueOptions = {
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
 * Worker options for invoices queue
 * Concurrency: 50 - notifications are lightweight and can run in parallel
 */
const invoicesWorkerOptions: WorkerOptions = {
  connection: getRedisConnection(),
  concurrency: 50,
  lockDuration: 30000, // 30 seconds - notifications are quick
  stalledInterval: 60000, // 1 minute
};

/**
 * Invoices queue configuration
 * Handles invoice generation, scheduling, email sending, and recurring invoices
 * Jobs: generate-invoice, send-invoice-email, send-invoice-reminder, schedule-invoice,
 *       invoice-recurring-scheduler, invoice-upcoming-notification
 */
export const invoicesQueueConfig: QueueConfig = {
  name: "invoices",
  queueOptions: invoicesQueueOptions,
  workerOptions: invoicesWorkerOptions,
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
