import type { Queue } from "bullmq";
import {
  getInboxProviderQueue,
  getInboxQueue,
  getTransactionsQueue,
} from "./config";

/**
 * Job registry - maps job names to their queue getters
 * Queues are created lazily when accessed
 */
function createJobRegistry(): Map<string, Queue> {
  const inboxQueue = getInboxQueue();
  const inboxProviderQueue = getInboxProviderQueue();
  const transactionsQueue = getTransactionsQueue();

  return new Map<string, Queue>([
    // Inbox jobs
    ["embed-inbox", inboxQueue],
    ["batch-process-matching", inboxQueue],
    ["match-transactions-bidirectional", inboxQueue],
    ["process-attachment", inboxQueue],
    ["slack-upload", inboxQueue],
    ["no-match-scheduler", inboxQueue],

    // Inbox provider jobs
    ["inbox-provider-initial-setup", inboxProviderQueue],
    ["inbox-provider-scheduler", inboxProviderQueue],
    ["inbox-provider-sync-account", inboxProviderQueue],

    // Transaction jobs
    ["export-transactions", transactionsQueue],
    ["process-export", transactionsQueue],
  ]);
}

let _jobRegistry: Map<string, Queue> | null = null;

/**
 * Job registry - maps job names to their queues
 * Lazy initialization: created on first access
 */
export function getJobRegistry(): Map<string, Queue> {
  if (!_jobRegistry) {
    _jobRegistry = createJobRegistry();
  }
  return _jobRegistry;
}

/**
 * Get queue for a job name
 */
export function getQueueForJob(jobName: string): Queue {
  const queue = getJobRegistry().get(jobName);
  if (!queue) {
    throw new Error(`No queue registered for job: ${jobName}`);
  }
  return queue;
}

/**
 * Get queue name for a job (for flows)
 */
export function getQueueNameForJob(jobName: string): string {
  // Check which queue this job belongs to
  const registry = getJobRegistry();
  if (registry.has(jobName)) {
    const queue = registry.get(jobName)!;
    // Get queue name from the queue instance
    return queue.name;
  }
  throw new Error(`No queue registered for job: ${jobName}`);
}
