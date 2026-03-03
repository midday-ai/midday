import { Queue } from "bullmq";
import { extractionQueueConfig } from "./extraction.config";

/**
 * Extraction queue instance
 * Rate-limited queue for all Mistral OCR extraction jobs
 */
export const extractionQueue = new Queue(
  "extraction",
  extractionQueueConfig.queueOptions,
);
