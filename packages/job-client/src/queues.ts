import type { QueueOptions } from "bullmq";
import { Queue } from "bullmq";
import Redis from "ioredis";

const queues: Map<string, Queue> = new Map();
let redisConnection: Redis | null = null;

/**
 * Get or create Redis connection for BullMQ
 * Uses REDIS_QUEUE_URL (separate from cache Redis)
 */
function getRedisConnection(): Redis {
  if (redisConnection) {
    return redisConnection;
  }

  const redisUrl = process.env.REDIS_QUEUE_URL;

  if (!redisUrl) {
    throw new Error("REDIS_QUEUE_URL environment variable is required");
  }

  const isProduction =
    process.env.NODE_ENV === "production" || process.env.FLY_APP_NAME;

  redisConnection = new Redis(redisUrl, {
    maxRetriesPerRequest: null, // Required for BullMQ
    enableReadyCheck: false, // BullMQ handles this
    lazyConnect: true,
    family: isProduction ? 6 : 4, // IPv6 for Fly.io production, IPv4 for local
    keepAlive: 30000, // Keep connection alive with 30s keepAlive to prevent idle timeouts
    ...(isProduction && {
      // Production settings for Upstash/Fly.io
      connectTimeout: 15000, // Longer timeout for Upstash
      retryStrategy: (times) => {
        // Always return a number to ensure infinite retries
        // Exponential backoff: 50ms, 100ms, 150ms... up to 2000ms max
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      enableOfflineQueue: false, // Don't queue commands when offline
    }),
  });

  redisConnection.on("error", (err) => {
    console.error("[Job Client Redis] Connection error:", err);
  });

  redisConnection.on("connect", () => {
    console.log("[Job Client Redis] Connected");
  });

  redisConnection.on("ready", () => {
    console.log("[Job Client Redis] Ready");
  });

  redisConnection.on("reconnecting", (delay: number) => {
    console.log(`[Job Client Redis] Reconnecting in ${delay}ms...`);
  });

  redisConnection.on("close", () => {
    console.log("[Job Client Redis] Connection closed");
  });

  redisConnection.on("end", () => {
    console.log("[Job Client Redis] Connection ended");
  });

  return redisConnection;
}

/**
 * Get or create a BullMQ Queue instance
 */
export function getQueue(queueName: string): Queue {
  if (queues.has(queueName)) {
    return queues.get(queueName)!;
  }

  const queueOptions: QueueOptions = {
    connection: getRedisConnection(),
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 1000,
      },
      removeOnComplete: {
        age: 24 * 3600, // Keep completed jobs for 24 hours
        count: 1000, // Keep max 1000 completed jobs
      },
      removeOnFail: {
        age: 7 * 24 * 3600, // Keep failed jobs for 7 days
      },
    },
  };

  const queue = new Queue(queueName, queueOptions);
  queues.set(queueName, queue);

  return queue;
}

/**
 * Get all registered queue names
 */
export function getQueueNames(): string[] {
  return Array.from(queues.keys());
}
