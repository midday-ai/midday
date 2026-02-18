import { createLoggerWithContext } from "@midday/logger";
import type { QueueOptions, WorkerOptions } from "bullmq";
import { getRedisConnection } from "../config";
import type { QueueConfig } from "../types/queue-config";

const logger = createLoggerWithContext("worker:queue:teams");

/**
 * Queue options for teams queue
 */
const teamsQueueOptions: QueueOptions = {
  connection: getRedisConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
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
 * Worker options for teams queue
 * Lower concurrency - involves external API calls (Polar, banking providers)
 * Longer lock duration for cleanup operations
 */
const teamsWorkerOptions: WorkerOptions = {
  connection: getRedisConnection(),
  concurrency: 5,
  lockDuration: 120000, // 2 minutes
  stalledInterval: 2 * 60 * 1000, // 2 minutes
  maxStalledCount: 1,
};

/**
 * Teams queue configuration
 * For team lifecycle jobs (deletion, cleanup)
 * Jobs: delete-team
 */
export const teamsQueueConfig: QueueConfig = {
  name: "teams",
  queueOptions: teamsQueueOptions,
  workerOptions: teamsWorkerOptions,
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
