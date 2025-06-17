import { setQueueResolver } from "@worker/jobs";
import { logger } from "@worker/monitoring/logger";
import { queueRegistry } from "@worker/queues/base";
import { initializeDocumentQueue } from "@worker/queues/documents";
import { initializeEmailQueue } from "@worker/queues/email";

// Initialize all queues
export async function initializeAllQueues(): Promise<void> {
  logger.info("Initializing all queues...");

  // Initialize each queue type
  initializeEmailQueue();
  initializeDocumentQueue();

  // Set up metadata-based queue resolver - always uses job queue metadata
  setQueueResolver((jobId: string, jobQueue: string) => {
    if (!jobQueue) {
      throw new Error(
        `No queue specified for job "${jobId}". All jobs must have a queue property.`,
      );
    }

    const queue = queueRegistry.getQueue(jobQueue);
    if (!queue) {
      throw new Error(
        `Queue "${jobQueue}" not found for job "${jobId}". Make sure the queue is initialized.`,
      );
    }

    return queue;
  });

  logger.info("All queues initialized", {
    queueCount: queueRegistry.getAllQueues().length,
    queueNames: queueRegistry.getAllQueues().map((q) => q.name),
  });
}

// Export commonly used functions
export const getAllQueues = () => queueRegistry.getAllQueues();
export const getQueue = (name: string) => queueRegistry.getQueue(name);
export const closeQueues = async () => queueRegistry.closeAll();

export * from "@worker/queues/base";
export * from "@worker/queues/documents";
export * from "@worker/queues/email";
