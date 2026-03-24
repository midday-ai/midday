import { createLoggerWithContext } from "@midday/logger";
import type { QueueOptions, WorkerOptions } from "bullmq";
import { getRedisConnection } from "../config";
import { DEFAULT_JOB_OPTIONS } from "../config/job-options";
import type { QueueConfig } from "../types/queue-config";

const logger = createLoggerWithContext("worker:queue:insights");

/**
 * Job timeout in milliseconds (5 minutes)
 * Jobs exceeding this will be marked as failed to prevent hung workers
 */
const JOB_TIMEOUT_MS = 5 * 60 * 1000;

/**
 * Queue options for insights queue
 */
const insightsQueueOptions: QueueOptions = {
  connection: getRedisConnection(),
  defaultJobOptions: {
    ...DEFAULT_JOB_OPTIONS,
    removeOnComplete: {
      age: 7 * 24 * 3600, // Keep completed jobs for 7 days
      count: 500, // Keep max 500 completed jobs
    },
    removeOnFail: {
      age: 30 * 24 * 3600, // Keep failed jobs for 30 days
    },
  },
};

/**
 * Worker options for insights queue
 * Rate limited to prevent overwhelming external APIs (ElevenLabs, AI providers)
 *
 * With 15s dispatch delay + 15s rate limiter:
 * - 100 teams in same timezone = ~28 minutes total processing time
 * - Insights arrive between 7:00 AM - 7:28 AM local time
 *
 * Timeout: Jobs exceeding 5 minutes are automatically failed to prevent hung workers
 */
const insightsWorkerOptions: WorkerOptions = {
  connection: getRedisConnection(),
  concurrency: 2, // Only 2 jobs at once
  lockDuration: JOB_TIMEOUT_MS, // 5 minutes - must cover full job duration
  stalledInterval: 60000, // Check for stalled jobs every minute
  limiter: {
    max: 1, // 1 job per 15 seconds
    duration: 15000,
  },
};

/**
 * Insights queue configuration
 * Handles all insight generation jobs
 * Jobs: dispatch-insights, generate-team-insights
 */
export const insightsQueueConfig: QueueConfig = {
  name: "insights",
  queueOptions: insightsQueueOptions,
  workerOptions: insightsWorkerOptions,
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
