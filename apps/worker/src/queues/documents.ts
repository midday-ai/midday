import { Queue } from "bullmq";
import { documentsQueueConfig } from "./documents.config";

/**
 * Documents queue instance
 * Used for enqueueing document processing jobs from other parts of the codebase
 * Configuration is defined in documents.config.ts
 */
export const documentsQueue = new Queue(
  "documents",
  documentsQueueConfig.queueOptions,
);
