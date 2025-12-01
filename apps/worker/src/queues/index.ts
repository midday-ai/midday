import type { QueueConfig } from "../types/queue-config";
import { documentsQueueConfig } from "./documents.config";
import { inboxProviderQueueConfig, inboxQueueConfig } from "./inbox.config";
import { transactionsQueueConfig } from "./transactions.config";

/**
 * All queue configurations
 * Add new queue configs here to automatically create workers
 */
export const queueConfigs: QueueConfig[] = [
  inboxQueueConfig,
  inboxProviderQueueConfig,
  transactionsQueueConfig,
  documentsQueueConfig,
];
