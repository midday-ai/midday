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
 *
 * Based on BullMQ recommended settings:
 * - maxRetriesPerRequest: null (required for Workers)
 * - retryStrategy: exponential backoff (min 1s, max 20s)
 * - enableOfflineQueue: true (Workers need to wait for reconnection)
 * - reconnectOnError: auto-reconnect on READONLY (cluster failover)
 *
 * @see https://docs.bullmq.io/guide/going-to-production
 */
export function getRedisConnection() {
  const baseOptions = parseRedisUrl();

  return {
    ...baseOptions,
    // BullMQ required settings for Workers
    maxRetriesPerRequest: null, // Required: retry indefinitely for Workers
    enableReadyCheck: false,
    // Network settings
    lazyConnect: false,
    family: isProduction ? 6 : 4, // IPv6 for Fly.io production, IPv4 for local
    keepAlive: 30000, // TCP keep-alive every 30s
    connectTimeout: isProduction ? 15000 : 5000,
    // BullMQ recommended retry strategy: exponential backoff
    // min 1 second, max 20 seconds (matches BullMQ default)
    retryStrategy: (times: number) => {
      const delay = Math.max(Math.min(Math.exp(times), 20000), 1000);
      if (times > 5) {
        console.log(
          `[Redis/Worker] Reconnecting in ${delay}ms (attempt ${times})`,
        );
      }
      return delay;
    },
    // Auto-reconnect on errors that indicate failover/upgrade
    // READONLY: Redis is in replica mode during failover/upgrade
    // ETIMEDOUT/timed out: Connection or script timed out (can happen during failover)
    reconnectOnError: (err: Error) => {
      const msg = err.message;
      if (msg.includes("READONLY")) {
        console.log(
          "[Redis/Worker] READONLY error detected (server upgrade/failover), reconnecting",
        );
        return true;
      }
      if (msg.includes("timed out") || msg.includes("ETIMEDOUT")) {
        console.log("[Redis/Worker] Timeout error detected, reconnecting");
        return true;
      }
      return false;
    },
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
