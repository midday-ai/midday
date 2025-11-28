/**
 * Job Client - BullMQ queue client for enqueueing jobs from API
 *
 * Usage:
 *   import { jobs } from "@midday/job-client";
 *   await jobs.trigger("batch-process-matching", { teamId, inboxIds });
 */
export {
  inboxQueue,
  inboxProviderQueue,
  transactionsQueue,
  flowProducer,
} from "./config";
export { jobs, createJobFlow, getJobStatus } from "./client";
export { jobRegistry, getQueueForJob, getQueueNameForJob } from "./registry";
export type { JobOptions } from "./client";
export type { Job, InboxJob, TransactionJob } from "./types";
