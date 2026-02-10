import { createLoggerWithContext } from "@midday/logger";
import type { QueueOptions, WorkerOptions } from "bullmq";
import { getRedisConnection } from "../config";
import type { QueueConfig } from "../types/queue-config";

const logger = createLoggerWithContext("worker:queue:customers");

/**
 * Queue options for customers queue
 */
const customersQueueOptions: QueueOptions = {
  connection: getRedisConnection(),
  defaultJobOptions: {
    attempts: 1,
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
 * Worker options for customers queue
 * Lower concurrency - each enrichment call uses Gemini + Google Search
 * Longer lock duration - search grounding can be slow
 */
const customersWorkerOptions: WorkerOptions = {
  connection: getRedisConnection(),
  concurrency: 5, // Lower concurrency due to external API calls
  lockDuration: 120000, // 2 minutes - search grounding can be slow
  stalledInterval: 2 * 60 * 1000, // 2 minutes
  maxStalledCount: 1,
};

/**
 * Customers queue configuration
 * For customer enrichment jobs using Gemini + Google Search grounding
 * Jobs: enrich-customer
 */
export const customersQueueConfig: QueueConfig = {
  name: "customers",
  queueOptions: customersQueueOptions,
  workerOptions: customersWorkerOptions,
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
