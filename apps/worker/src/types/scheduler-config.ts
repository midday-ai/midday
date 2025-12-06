/**
 * Configuration for static schedulers (fixed schedule, registered on startup)
 */
export interface StaticSchedulerConfig {
  /** Unique name for the scheduler */
  name: string;
  /** Queue name where the job will be enqueued */
  queue: string;
  /** Cron pattern (e.g., "0 2 * * *" for daily at 2 AM) */
  cron: string;
  /** Job name to trigger */
  jobName: string;
  /** Default payload for the job */
  payload?: unknown;
  /** Optional BullMQ repeat options */
  options?: {
    tz?: string; // Timezone (default: UTC)
    startDate?: Date | number; // Start date
    endDate?: Date | number; // End date
    limit?: number; // Maximum number of repetitions
  };
}

/**
 * Template for dynamic schedulers (per-account, registered dynamically)
 */
export interface DynamicSchedulerTemplate {
  /** Template identifier */
  template: string;
  /** Queue name where the job will be enqueued */
  queue: string;
  /** Function to generate cron pattern based on account ID */
  cronGenerator: (accountId: string) => string;
  /** Job name to trigger */
  jobName: string;
  /** Function to generate payload based on account ID */
  payloadGenerator: (accountId: string) => unknown;
  /** Function to generate unique job key based on account ID */
  jobKey: (accountId: string) => string;
  /** Optional BullMQ repeat options */
  options?: {
    tz?: string;
    startDate?: Date | number;
    endDate?: Date | number;
    limit?: number;
  };
}

/**
 * Parameters for registering a dynamic scheduler
 */
export interface RegisterDynamicSchedulerParams {
  /** Template identifier */
  template: string;
  /** Account ID */
  accountId: string;
  /** Cron pattern */
  cronPattern: string;
}
