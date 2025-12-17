import { Queue } from "bullmq";
import { accountingQueueConfig } from "./accounting.config";

/**
 * Accounting queue instance
 * Used for enqueueing accounting sync jobs from other parts of the codebase
 * Configuration is defined in accounting.config.ts
 */
export const accountingQueue = new Queue(
  "accounting",
  accountingQueueConfig.queueOptions,
);
