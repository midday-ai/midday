/**
 * Minimal Queue interface - only includes methods we actually use
 * This avoids pulling in the full BullMQ Queue type during typecheck
 */
interface MinimalQueue {
  add: (
    name: string,
    data: unknown,
    options?: Record<string, unknown>,
  ) => Promise<{ id: string | number | undefined }>;
  name: string;
  client: Promise<{
    hgetall: (key: string) => Promise<Record<string, string>>;
    zscore: (key: string, member: string) => Promise<number | null>;
    lpos: (key: string, element: string) => Promise<number | null>;
  }>;
}

/**
 * Job registry - maps job names to their queue types
 * Queues are created lazily when accessed (only at runtime, not during typecheck)
 */
const JOB_QUEUE_MAP: Record<
  string,
  "inbox" | "inbox-provider" | "transactions"
> = {
  // Inbox jobs
  "embed-inbox": "inbox",
  "batch-process-matching": "inbox",
  "match-transactions-bidirectional": "inbox",
  "process-attachment": "inbox",
  "slack-upload": "inbox",
  "no-match-scheduler": "inbox",

  // Inbox provider jobs
  "inbox-provider-initial-setup": "inbox-provider",
  "inbox-provider-scheduler": "inbox-provider",
  "inbox-provider-sync-account": "inbox-provider",

  // Transaction jobs
  "export-transactions": "transactions",
  "process-export": "transactions",
} as const;

/**
 * Get queue for a job name - lazy evaluation to avoid typecheck issues
 * Uses dynamic import to prevent TypeScript from resolving BullMQ types during typecheck
 * Returns MinimalQueue to avoid pulling in full BullMQ types
 */
export function getQueueForJob(jobName: string): MinimalQueue {
  const queueType = JOB_QUEUE_MAP[jobName];
  if (!queueType) {
    throw new Error(`No queue registered for job: ${jobName}`);
  }

  // Use dynamic import to avoid pulling in BullMQ types during typecheck
  // This is evaluated at runtime, not during TypeScript compilation
  switch (queueType) {
    case "inbox": {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getInboxQueue } = require("./config");
      return getInboxQueue();
    }
    case "inbox-provider": {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getInboxProviderQueue } = require("./config");
      return getInboxProviderQueue();
    }
    case "transactions": {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getTransactionsQueue } = require("./config");
      return getTransactionsQueue();
    }
    default:
      throw new Error(`Unknown queue type: ${queueType}`);
  }
}

/**
 * Get queue name for a job (for flows)
 */
export function getQueueNameForJob(jobName: string): string {
  const queueType = JOB_QUEUE_MAP[jobName];
  if (!queueType) {
    throw new Error(`No queue registered for job: ${jobName}`);
  }
  return queueType;
}
