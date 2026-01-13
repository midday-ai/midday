import type { QueueOptions, WorkerOptions } from "bullmq";

/**
 * Job-specific timeout configuration
 * These timeouts are enforced at the application level using timeout utilities
 */
export interface JobTimeoutConfig {
  /** Timeout in milliseconds for this job type */
  timeoutMs?: number;
  /** Whether to retry on timeout */
  retryOnTimeout?: boolean;
}

/**
 * Job info with full data access for event handlers
 */
export interface JobInfo {
  name?: string;
  id?: string;
  data?: unknown;
  attemptsMade?: number;
  opts?: { attempts?: number };
}

/**
 * Configuration for a queue and its worker
 */
export interface QueueConfig {
  /** Queue name */
  name: string;
  /** Queue options for BullMQ */
  queueOptions: QueueOptions;
  /** Worker options for BullMQ */
  workerOptions: WorkerOptions;
  /** Optional custom event handlers */
  eventHandlers?: {
    onCompleted?: (job: { name: string; id?: string }) => void;
    onFailed?: (job: JobInfo | null, err: Error) => void | Promise<void>;
  };
  /** Optional job-specific timeout configurations */
  jobTimeouts?: Record<string, JobTimeoutConfig>;
}

/**
 * Processor registry type - maps job names to processor instances
 */
export type ProcessorRegistry = Map<
  string,
  { handle: (job: unknown) => Promise<unknown> }
>;
