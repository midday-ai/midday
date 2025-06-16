import type { Database } from "@midday/db/client";
import type { Job, Processor } from "bullmq";
import { emailTaskHandler } from "../processors/email";

export function createWorkerHandlers(db: Database): Record<string, Processor> {
  return {
    email: async (job: Job) => {
      await emailTaskHandler(job, db);
    },
    // Future job handlers can be added here
    // documents: async (job: Job) => {
    //   await documentTaskHandler(job, db);
    // },
    // transactions: async (job: Job) => {
    //   await transactionTaskHandler(job, db);
    // },
  };
}

// Export worker handler types for better type safety
export type WorkerHandlerMap = ReturnType<typeof createWorkerHandlers>;
export type SupportedJobQueue = keyof WorkerHandlerMap;
