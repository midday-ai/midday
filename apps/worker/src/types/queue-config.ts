import type { QueueOptions, WorkerOptions } from "bullmq";

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
    onFailed?: (job: { name?: string; id?: string } | null, err: Error) => void;
  };
}

/**
 * Processor registry type - maps job names to processor instances
 */
export type ProcessorRegistry = Map<
  string,
  { handle: (job: unknown) => Promise<unknown> }
>;
