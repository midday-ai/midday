import { Queue } from "bullmq";
import { disclosuresQueueConfig } from "./disclosures.config";

/**
 * Disclosures queue instance
 * Used for enqueueing disclosure PDF generation jobs
 */
export const disclosuresQueue = new Queue(
  "disclosures",
  disclosuresQueueConfig.queueOptions,
);
