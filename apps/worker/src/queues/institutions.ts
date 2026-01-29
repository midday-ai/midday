import { Queue, Worker } from "bullmq";
import { institutionsProcessorMap } from "../processors/institutions";
import { institutionsQueueConfig } from "./institutions.config";

// Create the queue
export const institutionsQueue = new Queue(
  institutionsQueueConfig.name,
  institutionsQueueConfig.queueOptions,
);

// Create the worker
export const institutionsWorker = new Worker(
  institutionsQueueConfig.name,
  async (job) => {
    const processor =
      institutionsProcessorMap[
        job.name as keyof typeof institutionsProcessorMap
      ];

    if (!processor) {
      throw new Error(`Unknown job name: ${job.name}`);
    }

    return processor.handle(job);
  },
  institutionsQueueConfig.workerOptions,
);

// Attach event handlers
if (institutionsQueueConfig.eventHandlers?.onCompleted) {
  institutionsWorker.on(
    "completed",
    institutionsQueueConfig.eventHandlers.onCompleted,
  );
}

if (institutionsQueueConfig.eventHandlers?.onFailed) {
  institutionsWorker.on("failed", async (job, err) => {
    await institutionsQueueConfig.eventHandlers?.onFailed?.(
      job
        ? {
            name: job.name,
            id: job.id,
            data: job.data,
            attemptsMade: job.attemptsMade,
            opts: job.opts,
          }
        : null,
      err,
    );
  });
}
