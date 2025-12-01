import type { QueueOptions } from "bullmq";
import { Queue } from "bullmq";
import { getRedisConnection } from "../config";

/**
 * Queue options for transactions queue
 * Concurrency: 10 (matching export-transactions)
 */
const transactionsQueueOptions: QueueOptions = {
  connection: getRedisConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
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
 * Transactions queue - For transaction export and processing jobs
 * Concurrency: 10
 * Jobs: export-transactions, process-export
 */
export const transactionsQueue = new Queue(
  "transactions",
  transactionsQueueOptions,
);
