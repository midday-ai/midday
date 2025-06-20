import type { Database } from "@midday/db/client";
import { executeJob } from "@worker/jobs";
import { queues } from "@worker/queues/queues";
import type { Job, Processor } from "bullmq";

export function createWorkerHandlers(db: Database): Record<string, Processor> {
  // Automatically generate handlers for all queues defined in config
  const handlers: Record<string, Processor> = {};

  for (const [_, queueConfig] of Object.entries(queues)) {
    handlers[queueConfig.name] = async (job: Job) => {
      // All handlers use the same executeJob function
      // which routes to the appropriate job based on job.name
      return executeJob(job.name, job, db);
    };
  }

  return handlers;
}

// Export worker handler types for better type safety
export type WorkerHandlerMap = ReturnType<typeof createWorkerHandlers>;
export type SupportedJobQueue = keyof WorkerHandlerMap;
