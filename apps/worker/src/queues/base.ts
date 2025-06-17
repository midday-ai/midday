import { redisConnection } from "@worker/config/redis";
import { logger } from "@worker/monitoring/logger";
import type { Queue, QueueOptions } from "bullmq";

// Base queue configuration that can be extended
export const createBaseQueueOptions = (
  overrides: Partial<QueueOptions> = {},
): QueueOptions => ({
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: { count: 50, age: 24 * 3600 }, // Keep 50 jobs or 24 hours
    removeOnFail: { count: 50, age: 7 * 24 * 3600 }, // Keep 50 failed jobs or 7 days
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  },
  ...overrides,
});

// Simple queue registry for managing queues
export class QueueRegistry {
  private static instance: QueueRegistry;
  private queues: Map<string, Queue> = new Map();

  static getInstance(): QueueRegistry {
    if (!QueueRegistry.instance) {
      QueueRegistry.instance = new QueueRegistry();
    }
    return QueueRegistry.instance;
  }

  registerQueue(name: string, queue: Queue): void {
    this.queues.set(name, queue);
  }

  getQueue(name: string): Queue | undefined {
    return this.queues.get(name);
  }

  getAllQueues(): Queue[] {
    return Array.from(this.queues.values());
  }

  // Graceful shutdown for all queues
  async closeAll(): Promise<void> {
    logger.info("Closing all queues...");
    const queues = this.getAllQueues();
    await Promise.all(queues.map((queue) => queue.close()));
    logger.info("All queues closed");
  }
}

// Export singleton instance
export const queueRegistry = QueueRegistry.getInstance();
