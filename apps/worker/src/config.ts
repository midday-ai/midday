import { createLoggerWithContext } from "@midday/logger";

const logger = createLoggerWithContext("worker:config");

const isProduction =
  process.env.NODE_ENV === "production" ||
  process.env.RAILWAY_ENVIRONMENT === "production";

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
    family: 4,
    keepAlive: 30000, // TCP keep-alive every 30s
    connectTimeout: isProduction ? 15000 : 5000,
    // BullMQ recommended retry strategy: exponential backoff
    // 1s, 2s, 4s, 8s, 16s, then capped at 20s
    retryStrategy: (times: number) => {
      const delay = Math.min(1000 * 2 ** times, 20000);
      if (times > 5) {
        logger.info(
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
        logger.info(
          "[Redis/Worker] READONLY error detected (server upgrade/failover), reconnecting",
        );
        return true;
      }
      if (msg.includes("timed out") || msg.includes("ETIMEDOUT")) {
        logger.info("[Redis/Worker] Timeout error detected, reconnecting");
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
