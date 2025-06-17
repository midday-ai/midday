import { setQueueResolver } from "@worker/jobs";
import { logger } from "@worker/monitoring/logger";
import { queueRegistry } from "@worker/queues/base";
import { queues } from "@worker/queues/config";
import { Queue } from "bullmq";

// Generic function to initialize all queues from config
export async function initializeAllQueues(): Promise<void> {
  logger.info("Initializing all queues...");

  // Initialize all queues from config
  for (const [_, config] of Object.entries(queues)) {
    const queue = new Queue(config.name, config.options);
    queueRegistry.registerQueue(config.name, queue);
    logger.info("Queue initialized", { queueName: config.name });
  }

  // Set up metadata-based queue resolver
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

// Export queue config for worker concurrency
export { queues } from "@worker/queues/config";
export * from "@worker/queues/base";
