import { Queue } from "bullmq";
import { embeddingsQueueConfig } from "./embeddings.config";

/**
 * Embeddings queue instance
 * Used for enqueueing embedding jobs from other parts of the codebase
 * Configuration is defined in embeddings.config.ts
 *
 * This queue is intentionally separate from the inbox queue to prevent
 * worker starvation when inbox processing jobs (process-attachment, slack-upload)
 * wait for embedding jobs to complete using triggerJobAndWait().
 */
export const embeddingsQueue = new Queue(
  "embeddings",
  embeddingsQueueConfig.queueOptions,
);
