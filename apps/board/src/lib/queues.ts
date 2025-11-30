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

      // Connect to Redis if lazyConnect is enabled
      const currentStatus = redisConnection.status || "unknown";
      if (currentStatus !== "ready" && currentStatus !== "connecting") {
        try {
          console.log(
            `[Board Redis Queue ${name}] Connecting to Redis (current status: ${currentStatus})...`,
          );
          await redisConnection.connect();

          // Verify connection by doing a simple ping
          try {
            const pong = await redisConnection.ping();
            console.log(
              `[Board Redis Queue ${name}] Successfully connected and verified (ping: ${pong}, status: ${redisConnection.status})`,
            );
          } catch (pingError) {
            console.warn(
              `[Board Redis Queue ${name}] Connected but ping failed:`,
              pingError,
            );
          }
        } catch (error) {
          console.error(
            `[Board Redis Queue ${name}] Failed to connect:`,
            error,
          );
          // Continue anyway - connection might be established later
        }
      } else {
        console.log(
          `[Board Redis Queue ${name}] Redis connection already ${currentStatus}`,
        );
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
