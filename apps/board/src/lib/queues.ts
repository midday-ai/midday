import type { Queue } from "bullmq";
import { Queue as BullMQQueue } from "bullmq";
import { getAdminConfig } from "./config";

const queues: Map<string, Queue> = new Map();

export function registerQueues(queueInstances: Queue[]) {
  for (const queue of queueInstances) {
    queues.set(queue.name, queue);
  }
}

export async function initializeQueuesFromNames(
  queueNames: string[],
  redisOptions: any,
) {
  for (const name of queueNames) {
    if (!queues.has(name)) {
      // Handle both URL string and options object
      const connection =
        typeof redisOptions === "string"
          ? redisOptions
          : redisOptions?.url
            ? redisOptions.url
            : redisOptions;
      const queue = new BullMQQueue(name, {
        connection,
      });
      queues.set(name, queue);
    }
  }
}

export function getQueues(): Map<string, Queue> {
  return queues;
}

export function getQueue(name: string): Queue | undefined {
  return queues.get(name);
}

export async function getQueueMetrics(queue: Queue) {
  const [waiting, active, completed, failed, delayed, paused] =
    await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
      queue.isPaused(),
    ]);

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    paused,
    total: waiting + active + completed + failed + delayed,
  };
}

export async function getAllQueueMetrics() {
  const allQueues = Array.from(queues.values());
  const metrics = await Promise.all(
    allQueues.map(async (queue) => ({
      name: queue.name,
      metrics: await getQueueMetrics(queue),
    })),
  );

  return metrics;
}
