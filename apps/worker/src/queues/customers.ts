import { Queue } from "bullmq";
import { customersQueueConfig } from "./customers.config";

/**
 * Customers queue instance
 * Used for enqueueing customer enrichment jobs
 * Configuration is defined in customers.config.ts
 */
export const customersQueue = new Queue(
  "customers",
  customersQueueConfig.queueOptions,
);
