import type { JobsOptions } from "bullmq";

/**
 * Default job options for BullMQ jobs.
 * Standard retry configuration: 3 attempts with exponential backoff.
 */
export const DEFAULT_JOB_OPTIONS: JobsOptions = {
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 1000,
  },
};
