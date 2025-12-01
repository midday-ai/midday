// No imports - using require() to avoid pulling in BullMQ types during typecheck

let redisConnection: any = null;

/**
 * Create Redis connection - throws if REDIS_QUEUE_URL is not available
 * This ensures queues always have a valid connection
 */
function createRedisConnection(): any {
  const redisUrl = process.env.REDIS_QUEUE_URL;

  if (!redisUrl) {
    throw new Error("REDIS_QUEUE_URL environment variable is required");
  }

  const isProduction =
    process.env.NODE_ENV === "production" || process.env.FLY_APP_NAME;

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Redis = require("ioredis");
  const connection = new Redis(redisUrl, {
    maxRetriesPerRequest: null, // Required for BullMQ
    enableReadyCheck: false, // BullMQ handles this
    lazyConnect: true, // Don't connect until actually needed
    ...(isProduction && {
      // Production settings
      connectTimeout: 10000,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    }),
  });

  connection.on("error", (err: any) => {
    console.error("[Job Client Redis] Connection error:", err);
  });

  return connection;
}

/**
 * Get or create Redis connection for BullMQ
 * Uses REDIS_QUEUE_URL (separate from cache Redis)
 */
function getRedisConnection(): any {
  if (redisConnection) {
    return redisConnection;
  }
  redisConnection = createRedisConnection();
  return redisConnection;
}

// Lazy queue instances - created on first access
let _inboxQueue: any = null;
let _inboxProviderQueue: any = null;
let _transactionsQueue: any = null;
let _flowProducer: any = null;

/**
 * Get default queue options (lazy Redis connection)
 */
function getDefaultQueueOptions(): any {
  return {
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
}

/**
 * Inbox queue - Main queue for inbox processing jobs
 * Lazy initialization: created on first access
 */
export function getInboxQueue(): any {
  if (!_inboxQueue) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Queue } = require("bullmq");
    _inboxQueue = new Queue("inbox", getDefaultQueueOptions());
  }
  return _inboxQueue;
}

/**
 * Inbox provider queue - Gmail provider sync jobs
 * Lazy initialization: created on first access
 */
export function getInboxProviderQueue(): any {
  if (!_inboxProviderQueue) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Queue } = require("bullmq");
    _inboxProviderQueue = new Queue("inbox-provider", {
      ...getDefaultQueueOptions(),
      defaultJobOptions: {
        ...getDefaultQueueOptions().defaultJobOptions,
        attempts: 2, // Fewer retries for provider jobs
      },
    });
  }
  return _inboxProviderQueue;
}

/**
 * Transactions queue - For transaction export and processing jobs
 * Lazy initialization: created on first access
 */
export function getTransactionsQueue(): any {
  if (!_transactionsQueue) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Queue } = require("bullmq");
    _transactionsQueue = new Queue("transactions", getDefaultQueueOptions());
  }
  return _transactionsQueue;
}

/**
 * FlowProducer for job dependencies
 * Lazy initialization: created on first access
 */
export function getFlowProducer(): any {
  if (!_flowProducer) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { FlowProducer } = require("bullmq");
    _flowProducer = new FlowProducer({
      connection: getRedisConnection(),
    });
  }
  return _flowProducer;
}
