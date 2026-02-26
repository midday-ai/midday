import type { QueueOptions, WorkerOptions } from "bullmq";
import { getRedisConnection } from "../config";
import type { QueueConfig } from "../types/queue-config";

/**
 * Queue options for collections queue
 */
const collectionsQueueOptions: QueueOptions = {
  connection: getRedisConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: {
      age: 24 * 3600,
      count: 1000,
    },
    removeOnFail: {
      age: 7 * 24 * 3600,
    },
  },
};

/**
 * Worker options for collections queue
 * Concurrency: 1 (daily crons don't need parallelism)
 * Lock duration: 5 minutes (may iterate many teams/cases)
 */
const collectionsWorkerOptions: WorkerOptions = {
  connection: getRedisConnection(),
  concurrency: 1,
  lockDuration: 300000,
};

/**
 * Collections queue configuration
 * For auto-escalation, SLA breach checks, and follow-up reminders
 */
export const collectionsQueueConfig: QueueConfig = {
  name: "collections",
  queueOptions: collectionsQueueOptions,
  workerOptions: collectionsWorkerOptions,
  eventHandlers: {
    onCompleted: (job) => {
      console.log(`Collections job completed: ${job.name} (${job.id})`);
    },
    onFailed: (job, err) => {
      console.error(
        `Collections job failed: ${job?.name} (${job?.id})`,
        err,
      );
    },
  },
};
