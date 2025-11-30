import type { Queue } from "bullmq";
import { Queue as BullMQQueue } from "bullmq";
import Redis from "ioredis";
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
  const isProduction =
    process.env.NODE_ENV === "production" || process.env.FLY_APP_NAME;

  for (const name of queueNames) {
    if (!queues.has(name)) {
      // Create Redis connection with Upstash/Fly.io compatible settings
      let redisConnection: Redis;

      if (typeof redisOptions === "string") {
        // URL string - create Redis instance with proper options for Upstash
        redisConnection = new Redis(redisOptions, {
          family: isProduction ? 6 : 4, // IPv6 for Fly.io production, IPv4 for local
          maxRetriesPerRequest: null, // Required for BullMQ
          enableReadyCheck: false, // BullMQ handles this
          lazyConnect: true,
          ...(isProduction && {
            connectTimeout: 15000, // Longer timeout for Upstash
            retryStrategy: (times: number) => {
              const delay = Math.min(times * 50, 2000);
              return delay;
            },
            enableOfflineQueue: false, // Don't queue commands when offline
          }),
        });

        // Add error handlers
        redisConnection.on("error", (err) => {
          console.error(`[Board Redis Queue ${name}] Connection error:`, err);
        });

        redisConnection.on("connect", () => {
          console.log(`[Board Redis Queue ${name}] Connected`);
        });
      } else if (redisOptions instanceof Redis) {
        // Already a Redis instance
        redisConnection = redisOptions;
      } else {
        // Options object - create Redis instance
        redisConnection = new Redis({
          ...redisOptions,
          family: redisOptions.family || (isProduction ? 6 : 4), // IPv6 for production, IPv4 for local
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
          lazyConnect: true,
        });
      }

      const queue = new BullMQQueue(name, {
        connection: redisConnection,
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
