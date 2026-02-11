import { createLoggerWithContext } from "@midday/logger";

const logger = createLoggerWithContext("redis");

let sharedRedisClient: any = null;
let RedisClientClass: any = null;

// Dynamically load Bun's RedisClient to avoid crashing in non-Bun runtimes (e.g. trigger.dev on Node)
try {
  ({ RedisClient: RedisClientClass } = require("bun"));
} catch {
  // Not running in Bun — cache will be unavailable
}

/**
 * Resolve the Redis URL.
 *
 * All regions share a single Upstash Redis instance via REDIS_URL.
 */
function resolveRedisUrl(): string | undefined {
  return process.env.REDIS_URL;
}

/**
 * Get or create a shared Redis client instance.
 * Returns null in non-Bun runtimes where RedisClient is unavailable.
 */
export function getSharedRedisClient(): any {
  if (sharedRedisClient) {
    return sharedRedisClient;
  }

  if (!RedisClientClass) {
    return null;
  }

  const redisUrl = resolveRedisUrl();

  if (!redisUrl) {
    throw new Error(
      "Redis URL not found. Set per-region REDIS_CACHE_* env vars or REDIS_URL.",
    );
  }

  const isProduction =
    process.env.NODE_ENV === "production" ||
    process.env.RAILWAY_ENVIRONMENT === "production";

  sharedRedisClient = new RedisClientClass(redisUrl, {
    connectionTimeout: isProduction ? 10000 : 5000,
    autoReconnect: true,
    maxRetries: 10,
    enableOfflineQueue: true,
    enableAutoPipelining: true,
  });

  sharedRedisClient.onclose = (err: Error) => {
    if (err) {
      logger.error("Connection closed", { error: err.message });
    }
  };

  // Connect eagerly so the client is ready for first use
  sharedRedisClient.connect().catch((err: Error) => {
    logger.error("Initial connection error", { error: err.message });
  });

  return sharedRedisClient;
}
