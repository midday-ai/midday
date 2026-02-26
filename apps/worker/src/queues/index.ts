import type { Queue } from "bullmq";
import type { QueueConfig } from "../types/queue-config";
import { accountingQueue } from "./accounting";
import { accountingQueueConfig } from "./accounting.config";
import { merchantsQueue } from "./merchants";
import { merchantsQueueConfig } from "./merchants.config";
import { documentsQueue } from "./documents";
import { documentsQueueConfig } from "./documents.config";
import { embeddingsQueue } from "./embeddings";
import { embeddingsQueueConfig } from "./embeddings.config";
import { inboxProviderQueue, inboxQueue } from "./inbox";
import { inboxProviderQueueConfig, inboxQueueConfig } from "./inbox.config";
import { dealsQueue } from "./deals";
import { dealsQueueConfig } from "./deals.config";
import { ratesQueue } from "./rates";
import { ratesQueueConfig } from "./rates.config";
import { teamsQueue } from "./teams";
import { teamsQueueConfig } from "./teams.config";
import { transactionsQueue } from "./transactions";
import { transactionsQueueConfig } from "./transactions.config";
import { collectionsQueue } from "./collections";
import { collectionsQueueConfig } from "./collections.config";
import { disclosuresQueue } from "./disclosures";
import { disclosuresQueueConfig } from "./disclosures.config";

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
  dealsQueueConfig,
  merchantsQueueConfig,
  teamsQueueConfig,
  disclosuresQueueConfig,
  collectionsQueueConfig,
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
    dealsQueue,
    merchantsQueue,
    teamsQueue,
    disclosuresQueue,
    collectionsQueue,
  ];
}
