import { createBaseQueueOptions } from "@worker/queues/base";

export const queues = {
  email: {
    name: "email" as const,
    concurrency: 5,
    options: createBaseQueueOptions({
      defaultJobOptions: {
        removeOnComplete: { count: 100, age: 24 * 3600 }, // Keep more email jobs for audit
        attempts: 3,
        priority: 1, // High priority for emails
      },
    }),
  },
  documents: {
    name: "documents" as const,
    concurrency: 3, // Lower for resource-intensive tasks
    options: createBaseQueueOptions({
      defaultJobOptions: {
        removeOnComplete: { count: 30, age: 24 * 3600 }, // Keep fewer document jobs
        attempts: 2, // Fewer attempts for document processing
        backoff: { type: "exponential", delay: 5000 }, // Longer delay
      },
    }),
  },
} as const;
