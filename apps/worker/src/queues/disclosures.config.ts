import type { QueueOptions, WorkerOptions } from "bullmq";
import { getRedisConnection } from "../config";
import { DEFAULT_JOB_OPTIONS } from "../config/job-options";
import type { QueueConfig } from "../types/queue-config";

const disclosuresQueueOptions: QueueOptions = {
  connection: getRedisConnection(),
  defaultJobOptions: {
    ...DEFAULT_JOB_OPTIONS,
    removeOnComplete: {
      age: 24 * 3600,
      count: 500,
    },
    removeOnFail: {
      age: 7 * 24 * 3600,
    },
  },
};

/**
 * Worker options for disclosures queue
 * Concurrency: 10 — PDF generation is heavier than notifications
 */
const disclosuresWorkerOptions: WorkerOptions = {
  connection: getRedisConnection(),
  concurrency: 10,
  lockDuration: 60000, // 60 seconds — PDF rendering can take time
  stalledInterval: 120000,
};

export const disclosuresQueueConfig: QueueConfig = {
  name: "disclosures",
  queueOptions: disclosuresQueueOptions,
  workerOptions: disclosuresWorkerOptions,
  eventHandlers: {
    onCompleted: (job) => {
      console.log(`Disclosures job completed: ${job.name} (${job.id})`);
    },
    onFailed: (job, err) => {
      console.error(
        `Disclosures job failed: ${job?.name} (${job?.id})`,
        err,
      );
    },
  },
};
