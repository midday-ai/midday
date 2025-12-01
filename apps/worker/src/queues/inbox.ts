import { Queue } from "bullmq";
import { inboxProviderQueueConfig, inboxQueueConfig } from "./inbox.config";

/**
 * Inbox queue instance
 * Used for enqueueing jobs from other parts of the codebase
 * Configuration is defined in inbox.config.ts
 */
export const inboxQueue = new Queue("inbox", inboxQueueConfig.queueOptions);

/**
 * Inbox provider queue instance
 * Used for enqueueing provider sync jobs
 * Configuration is defined in inbox.config.ts
 */
export const inboxProviderQueue = new Queue(
  "inbox-provider",
  inboxProviderQueueConfig.queueOptions,
);
