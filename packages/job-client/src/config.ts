import type { QueueOptions } from "bullmq";
import { FlowProducer, Queue } from "bullmq";
import Redis from "ioredis";

let redisConnection: Redis | null = null;

/**
 * Create Redis connection - throws if REDIS_QUEUE_URL is not available
 * This ensures queues always have a valid connection
 */
function createRedisConnection(): Redis {
  const redisUrl = process.env.REDIS_QUEUE_URL;

  if (!redisUrl) {
    throw new Error("REDIS_QUEUE_URL environment variable is required");
  }

  const isProduction =
    process.env.NODE_ENV === "production" || process.env.FLY_APP_NAME;

  const connection = new Redis(redisUrl, {
    maxRetriesPerRequest: null, // Required for BullMQ
    enableReadyCheck: false, // BullMQ handles this
    lazyConnect: true, // Don't connect until actually needed
    ...(isProduction && {
      // Production settings
      connectTimeout: 10000,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    }),
  });

  connection.on("error", (err) => {
    console.error("[Job Client Redis] Connection error:", err);
  });

  return connection;
}

/**
 * Get or create Redis connection for BullMQ
 * Uses REDIS_QUEUE_URL (separate from cache Redis)
 */
function getRedisConnection(): Redis {
  if (redisConnection) {
    return redisConnection;
  }
  redisConnection = createRedisConnection();
  return redisConnection;
}

/**
 * Default queue options
 */
const defaultQueueOptions: QueueOptions = {
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

/**
 * Inbox queue - Main queue for inbox processing jobs
 */
export const inboxQueue = new Queue("inbox", defaultQueueOptions);

/**
 * Inbox provider queue - Gmail provider sync jobs
 */
export const inboxProviderQueue = new Queue("inbox-provider", {
  ...defaultQueueOptions,
  defaultJobOptions: {
    ...defaultQueueOptions.defaultJobOptions,
    attempts: 2, // Fewer retries for provider jobs
  },
});

/**
 * Transactions queue - For transaction export and processing jobs
 */
export const transactionsQueue = new Queue("transactions", defaultQueueOptions);

/**
 * FlowProducer for job dependencies
 */
export const flowProducer = new FlowProducer({
  connection: getRedisConnection(),
});
