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

/**
 * Job options for e-invoice delivery via Peppol.
 * More aggressive retry with longer delays before falling back to email.
 * 5 attempts: 5s, 25s, 125s (~2min), 625s (~10min), 3125s (~52min)
 */
export const EINVOICE_JOB_OPTIONS: JobsOptions = {
  attempts: 5,
  backoff: {
    type: "exponential",
    delay: 5000, // 5 seconds initial delay
  },
};
