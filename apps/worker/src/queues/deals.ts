import { Queue } from "bullmq";
import { dealsQueueConfig } from "./deals.config";

/**
 * Deals queue instance
 * Used for enqueueing deal notification jobs
 * Configuration is defined in deals.config.ts
 */
export const dealsQueue = new Queue(
  "deals",
  dealsQueueConfig.queueOptions,
);
