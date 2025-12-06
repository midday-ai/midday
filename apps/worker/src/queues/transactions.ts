import { Queue } from "bullmq";
import { transactionsQueueConfig } from "./transactions.config";

/**
 * Transactions queue instance
 * Used for enqueueing transaction jobs from other parts of the codebase
 * Configuration is defined in transactions.config.ts
 */
export const transactionsQueue = new Queue(
  "transactions",
  transactionsQueueConfig.queueOptions,
);
