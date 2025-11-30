import Redis from "ioredis";

let redisConnection: Redis | null = null;

/**
 * Get or create Redis connection for BullMQ
 * Uses REDIS_QUEUE_URL (separate from cache Redis)
 */
export function getRedisConnection(): Redis {
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
    // Force IPv4 for Upstash (Fly.io IPv6 can cause connection issues)
    family: 4,
    ...(isProduction && {
      // Production settings for Upstash/Fly.io
      connectTimeout: 15000, // Longer timeout for Upstash
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      enableOfflineQueue: false, // Don't queue commands when offline
    }),
  });

  redisConnection.on("error", (err) => {
    console.error("[Redis Queue] Connection error:", err);
  });

  redisConnection.on("connect", () => {
    console.log("[Redis Queue] Connected");
  });

  redisConnection.on("ready", () => {
    console.log("[Redis Queue] Ready");
  });

  return redisConnection;
}

/**
 * Create a separate Redis connection for FlowProducer
 * BullMQ best practice: separate connections for Queue, Worker, and FlowProducer
 */
export function getFlowRedisConnection(): Redis {
  const redisUrl = process.env.REDIS_QUEUE_URL;

  if (!redisUrl) {
    throw new Error("REDIS_QUEUE_URL environment variable is required");
  }

  const isProduction =
    process.env.NODE_ENV === "production" || process.env.FLY_APP_NAME;

  const connection = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
    // Force IPv4 for Upstash (Fly.io IPv6 can cause connection issues)
    family: 4,
    ...(isProduction && {
      connectTimeout: 15000, // Longer timeout for Upstash
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      enableOfflineQueue: false, // Don't queue commands when offline
    }),
  });

  return connection;
}
