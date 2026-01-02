import type { Queue } from "bullmq";
import type { QueueConfig } from "../types/queue-config";
import { accountingQueue } from "./accounting";
import { accountingQueueConfig } from "./accounting.config";
import { documentsQueue } from "./documents";
import { documentsQueueConfig } from "./documents.config";
import { embeddingsQueue } from "./embeddings";
import { embeddingsQueueConfig } from "./embeddings.config";
import { inboxProviderQueue, inboxQueue } from "./inbox";
import { inboxProviderQueueConfig, inboxQueueConfig } from "./inbox.config";
import { invoicesQueue } from "./invoices";
import { invoicesQueueConfig } from "./invoices.config";
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
  embeddingsQueueConfig,
  ratesQueueConfig,
  accountingQueueConfig,
  invoicesQueueConfig,
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
    embeddingsQueue,
    ratesQueue,
    accountingQueue,
    invoicesQueue,
  ];
}
