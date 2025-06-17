import type { Database } from "@midday/db/client";
import { executeJob } from "@worker/jobs";
import type { Job, Processor } from "bullmq";

export function createWorkerHandlers(db: Database): Record<string, Processor> {
  return {
    email: async (job: Job) => {
      // Use the simplified job executor
      return executeJob(job.name, job, db);
    },
    documents: async (job: Job) => {
      // Document jobs will also use the same system
      return executeJob(job.name, job, db);
    },
    // All handlers use the same executeJob function
    // which routes to the appropriate job based on job.name
  };
}

// Export worker handler types for better type safety
export type WorkerHandlerMap = ReturnType<typeof createWorkerHandlers>;
export type SupportedJobQueue = keyof WorkerHandlerMap;
