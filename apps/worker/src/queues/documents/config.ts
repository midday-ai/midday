import { createBaseQueueOptions } from "@worker/queues/base";
import type { QueueOptions } from "bullmq";

// Document queue specific configuration
export const documentQueueConfig: QueueOptions = createBaseQueueOptions({
  defaultJobOptions: {
    removeOnComplete: { count: 30, age: 24 * 3600 }, // Keep fewer document jobs
    removeOnFail: { count: 50, age: 7 * 24 * 3600 }, // Keep failed jobs for a week
    attempts: 2, // Fewer attempts for document processing
    backoff: {
      type: "exponential",
      delay: 5000, // Longer delay for document processing
    },
    // Document-specific job options
    delay: 0,
  },
});

// Document queue concurrency settings
export const DOCUMENT_CONCURRENCY = 3; // Lower concurrency for resource-intensive tasks

// Document queue name
export const DOCUMENT_QUEUE_NAME = "documents" as const;
