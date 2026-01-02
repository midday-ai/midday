import { Queue } from "bullmq";
import { invoicesQueueConfig } from "./invoices.config";

/**
 * Invoices queue instance
 * Used for enqueueing invoice notification jobs
 * Configuration is defined in invoices.config.ts
 */
export const invoicesQueue = new Queue(
  "invoices",
  invoicesQueueConfig.queueOptions,
);
