import { Queue } from "bullmq";
import { bankingQueueConfig } from "./banking.config";

/**
 * Banking queue instance
 * Used for enqueueing banking jobs from other parts of the codebase
 * Configuration is defined in banking.config.ts
 */
export const bankingQueue = new Queue(
  "banking",
  bankingQueueConfig.queueOptions,
);
