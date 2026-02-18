import { Queue } from "bullmq";
import { institutionsQueueConfig } from "./institutions.config";

/**
 * Institutions queue instance
 * Used for enqueueing institution sync jobs
 * Configuration is defined in institutions.config.ts
 */
export const institutionsQueue = new Queue(
  "institutions",
  institutionsQueueConfig.queueOptions,
);
