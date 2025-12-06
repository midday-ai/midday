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

      // Register the queue FIRST (before connection attempt)
      // This ensures queues are available even if connection takes time
      const queue = new BullMQQueue(name, {
        connection: redisConnection,
      });
      queues.set(name, queue);
      console.log(
        `[Board Redis Queue ${name}] Queue registered (connection status: ${redisConnection.status || "unknown"})`,
      );

      // Connect to Redis in background (don't block queue registration)
      // Only connect if not already connecting or ready
      const currentStatus = redisConnection.status || "unknown";
      if (
        currentStatus !== "ready" &&
        currentStatus !== "connecting" &&
        currentStatus !== "wait"
      ) {
        // Start connection in background with timeout
        const connectionTimeout = isProduction ? 20000 : 10000; // 20s for production, 10s for dev

        Promise.race([
          redisConnection.connect(),
          new Promise<never>((_, reject) =>
            setTimeout(
              () =>
                reject(
                  new Error(
                    `Redis connection timeout after ${connectionTimeout / 1000}s`,
                  ),
                ),
              connectionTimeout,
            ),
          ),
        ])
          .then(() => {
            // Verify connection with ping
            return redisConnection.ping();
          })
          .then((pong) => {
            console.log(
              `[Board Redis Queue ${name}] Successfully connected and verified (ping: ${pong})`,
            );
          })
          .catch((error) => {
            console.error(
              `[Board Redis Queue ${name}] Connection error (will retry on first use):`,
              error.message || error,
            );
            // Don't throw - queue is registered and will connect when needed
          });
      } else {
        console.log(
          `[Board Redis Queue ${name}] Redis connection already ${currentStatus}`,
        );
      }
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
  try {
    // Ensure Redis connection is established
    const connection = queue.opts?.connection as Redis | undefined;
    if (connection && connection.status !== "ready") {
      if (connection.status === "end" || connection.status === "close") {
        // Connection was closed, try to reconnect
        try {
          await connection.connect();
        } catch (error) {
          console.error(`[Queue ${queue.name}] Failed to reconnect:`, error);
          throw new Error(`Redis connection failed for queue ${queue.name}`);
        }
      } else if (connection.status === "wait") {
        // Connection is waiting, wait a bit for it to connect
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

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
  } catch (error) {
    console.error(`[Queue ${queue.name}] Error getting metrics:`, error);
    // Return zero metrics if there's an error
    return {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
      paused: false,
      total: 0,
    };
  }
}

export async function getAllQueueMetrics() {
  const allQueues = Array.from(queues.values());

  if (allQueues.length === 0) {
    console.warn(
      "[getAllQueueMetrics] No queues registered. Queues map is empty.",
    );
    return [];
  }

  console.log(
    `[getAllQueueMetrics] Fetching metrics for ${allQueues.length} queues:`,
    allQueues.map((q) => q.name).join(", "),
  );

  const metrics = await Promise.all(
    allQueues.map(async (queue) => {
      try {
        const queueMetrics = await getQueueMetrics(queue);
        return {
          name: queue.name,
          metrics: queueMetrics,
        };
      } catch (error) {
        console.error(
          `[getAllQueueMetrics] Error getting metrics for queue ${queue.name}:`,
          error,
        );
        return {
          name: queue.name,
          metrics: {
            waiting: 0,
            active: 0,
            completed: 0,
            failed: 0,
            delayed: 0,
            paused: false,
            total: 0,
          },
        };
      }
    }),
  );

  return metrics;
}
