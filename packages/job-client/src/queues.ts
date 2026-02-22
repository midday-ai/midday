import { createLoggerWithContext } from "@midday/logger";
import type { QueueOptions } from "bullmq";
import { Queue } from "bullmq";

const queues: Map<string, Queue> = new Map();

// Create logger for queue events
const logger = createLoggerWithContext("job-client");

/**
 * Parse Redis URL into connection options for BullMQ
 * BullMQ will create and manage its own Redis connection
 */
function getConnectionOptions() {
  const redisUrl = process.env.REDIS_QUEUE_URL;

  if (!redisUrl) {
    throw new Error("REDIS_QUEUE_URL environment variable is required");
  }

  const url = new URL(redisUrl);
  const isProduction =
    process.env.NODE_ENV === "production" ||
    process.env.RAILWAY_ENVIRONMENT === "production";

  return {
    host: url.hostname,
    port: Number(url.port) || 6379,
    password: url.password || undefined,
    username: url.username || undefined,
    // BullMQ required settings
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    // Network settings — Railway private networking is IPv4 only
    family: 4,
    keepAlive: 30000,
    lazyConnect: false,
    // TLS for production (rediss://)
    ...(url.protocol === "rediss:" && {
      tls: {},
    }),
    // Production settings
    ...(isProduction && {
      connectTimeout: 15000,
      retryStrategy: (times: number) => Math.min(times * 50, 2000),
      enableOfflineQueue: false,
    }),
  };
}

/**
 * Get or create a BullMQ Queue instance
 */
export function getQueue(queueName: string): Queue {
  if (queues.has(queueName)) {
    return queues.get(queueName)!;
  }

  const queueOptions: QueueOptions = {
    connection: getConnectionOptions(),
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

  // Always attach error handler to prevent unhandled errors
  // See: https://docs.bullmq.io/guide/going-to-production#log-errors
  queue.on("error", (err) => {
    logger.error("Queue error", { queueName, error: err.message });
  });

  queues.set(queueName, queue);
  logger.info("Queue created", { queueName });

  return queue;
}

/**
 * Get all registered queue names
 */
export function getQueueNames(): string[] {
  return Array.from(queues.keys());
}

/**
 * Export connection options for use by workers
 */
export { getConnectionOptions };
