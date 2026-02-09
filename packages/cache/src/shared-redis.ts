import { RedisClient } from "bun";

let sharedRedisClient: RedisClient | null = null;

/**
 * Get or create a shared Redis client instance
 * This ensures we reuse the same connection for both cache and memory providers
 */
export function getSharedRedisClient(): RedisClient {
  if (sharedRedisClient) {
    return sharedRedisClient;
  }

  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    throw new Error("REDIS_URL environment variable is required");
  }

  const isProduction =
    process.env.NODE_ENV === "production" ||
    process.env.RAILWAY_ENVIRONMENT === "production";

  sharedRedisClient = new RedisClient(redisUrl, {
    connectionTimeout: isProduction ? 10000 : 5000,
    autoReconnect: true,
    maxRetries: 10,
    enableOfflineQueue: true,
    enableAutoPipelining: true,
  });

  sharedRedisClient.onclose = (err) => {
    if (err) {
      console.error("[Redis] Connection closed:", err.message);
    }
  };

  // Connect eagerly so the client is ready for first use
  sharedRedisClient.connect().catch((err) => {
    console.error("[Redis] Initial connection error:", err.message);
  });

  return sharedRedisClient;
}
