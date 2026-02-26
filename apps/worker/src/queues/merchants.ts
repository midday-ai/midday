import { Queue } from "bullmq";
import { merchantsQueueConfig } from "./merchants.config";

/**
 * Merchants queue instance
 * Used for enqueueing merchant enrichment jobs
 * Configuration is defined in merchants.config.ts
 */
export const merchantsQueue = new Queue(
  "merchants",
  merchantsQueueConfig.queueOptions,
);
