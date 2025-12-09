import type { Queue } from "bullmq";
import type { QueueConfig } from "../types/queue-config";
import { documentsQueue } from "./documents";
import { documentsQueueConfig } from "./documents.config";
import { inboxProviderQueue, inboxQueue } from "./inbox";
import { inboxProviderQueueConfig, inboxQueueConfig } from "./inbox.config";
import { notificationsQueue } from "./notifications";
import { notificationsQueueConfig } from "./notifications.config";
import { ratesQueue } from "./rates";
import { ratesQueueConfig } from "./rates.config";
import { transactionsQueue } from "./transactions";
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
  notificationsQueueConfig,
  ratesQueueConfig,
];

/**
 * Get all Queue instances for BullBoard
 * Returns all queue instances that are used for job enqueueing
 */
export function getAllQueues(): Queue[] {
  return [
    inboxQueue,
    inboxProviderQueue,
    transactionsQueue,
    documentsQueue,
    notificationsQueue,
    ratesQueue,
  ];
}
