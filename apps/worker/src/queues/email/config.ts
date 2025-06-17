import { createBaseQueueOptions } from "@worker/queues/base";

export const EMAIL_QUEUE_NAME = "email";

export const emailQueueConfig = createBaseQueueOptions({
  defaultJobOptions: {
    removeOnComplete: { count: 100, age: 24 * 3600 }, // Keep more email jobs for audit
    removeOnFail: { count: 50, age: 7 * 24 * 3600 },
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    // Email-specific defaults
    priority: 1, // Default priority for emails
  },
});
