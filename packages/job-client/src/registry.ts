import type { Queue } from "bullmq";
import { inboxProviderQueue, inboxQueue, transactionsQueue } from "./config";

/**
 * Job registry - maps job names to their queues
 * As we add more queues, we'll add them here
 */
export const jobRegistry = new Map<string, Queue>([
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

/**
 * Get queue for a job name
 */
export function getQueueForJob(jobName: string): Queue {
  const queue = jobRegistry.get(jobName);
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
  if (jobRegistry.has(jobName)) {
    const queue = jobRegistry.get(jobName)!;
    // Get queue name from the queue instance
    return queue.name;
  }
  throw new Error(`No queue registered for job: ${jobName}`);
}
