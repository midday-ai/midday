let sharedRedisClient: any = null;
let RedisClientClass: any = null;

// Dynamically load Bun's RedisClient to avoid crashing in non-Bun runtimes (e.g. trigger.dev on Node)
try {
  ({ RedisClient: RedisClientClass } = require("bun"));
} catch {
  // Not running in Bun — cache will be unavailable
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

  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    throw new Error("REDIS_URL environment variable is required");
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
      console.error("[Redis] Connection closed:", err.message);
    }
  };

  // Connect eagerly so the client is ready for first use
  sharedRedisClient.connect().catch((err: Error) => {
    console.error("[Redis] Initial connection error:", err.message);
  });

  return sharedRedisClient;
}
