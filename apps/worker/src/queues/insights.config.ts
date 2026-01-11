import type { QueueOptions, WorkerOptions } from "bullmq";
import { getRedisConnection } from "../config";
import { DEFAULT_JOB_OPTIONS } from "../config/job-options";
import type { QueueConfig } from "../types/queue-config";

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
 * Concurrency: 5 - insights generation involves AI calls and should be rate limited
 */
const insightsWorkerOptions: WorkerOptions = {
  connection: getRedisConnection(),
  concurrency: 5,
  lockDuration: 120000, // 2 minutes - AI generation can take time
  stalledInterval: 180000, // 3 minutes
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
      console.log(`Insights job completed: ${job.name} (${job.id})`);
    },
    onFailed: (job, err) => {
      console.error(`Insights job failed: ${job?.name} (${job?.id})`, err);
    },
  },
};
