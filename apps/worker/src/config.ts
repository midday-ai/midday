const isProduction =
  process.env.NODE_ENV === "production" || process.env.FLY_APP_NAME;

/**
 * Parse Redis URL and return connection options for BullMQ
 * BullMQ will create and manage its own Redis connections
 */
function parseRedisUrl() {
  const redisUrl = process.env.REDIS_QUEUE_URL;

  if (!redisUrl) {
    throw new Error("REDIS_QUEUE_URL environment variable is required");
  }

  const url = new URL(redisUrl);

  return {
    host: url.hostname,
    port: Number(url.port) || 6379,
    password: url.password || undefined,
    username: url.username || undefined,
    // TLS for production (rediss://)
    ...(url.protocol === "rediss:" && {
      tls: {},
    }),
  };
}

/**
 * Get Redis connection options for BullMQ queues and workers
 * BullMQ will create its own connection with these options
 */
export function getRedisConnection() {
  const baseOptions = parseRedisUrl();

  return {
    ...baseOptions,
    // BullMQ required settings
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    // Network settings
    lazyConnect: false,
    family: isProduction ? 6 : 4, // IPv6 for Fly.io production, IPv4 for local
    keepAlive: 30000,
    // Production settings
    ...(isProduction && {
      connectTimeout: 15000,
      retryStrategy: (times: number) => Math.min(times * 50, 2000),
      enableOfflineQueue: false,
    }),
  };
}

/**
 * Get Redis connection options for FlowProducer
 * BullMQ best practice: separate connections for Queue, Worker, and FlowProducer
 */
export function getFlowRedisConnection() {
  // Same options - BullMQ will create a separate connection
  return getRedisConnection();
}
