import { type RedisClientType, createClient } from "redis";

let sharedRedisClient: RedisClientType | null = null;

/**
 * Get or create a shared Redis client instance
 * This ensures we reuse the same connection for both cache and memory providers
 */
export function getSharedRedisClient(): RedisClientType {
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

  sharedRedisClient = createClient({
    url: redisUrl,
    pingInterval: 60 * 1000, // 1-minute ping to detect stale connections
    socket: {
      family: 4,
      connectTimeout: isProduction ? 10000 : 5000,
      keepAlive: true, // TCP keepalive for connection health
      noDelay: true, // Disable Nagle's algorithm for lower latency
      reconnectStrategy: (retries) => {
        // Exponential backoff: 100ms, 200ms, 400ms... max 3s
        const delay = Math.min(100 * 2 ** retries, 3000);
        console.log(
          `[Redis] Reconnecting in ${delay}ms (attempt ${retries + 1})`,
        );
        return delay;
      },
    },
  });

  sharedRedisClient.on("error", (err) => {
    console.error("[Redis] Error:", err.message);
  });

  sharedRedisClient.on("reconnecting", () => {
    console.log("[Redis] Reconnecting...");
  });

  // Connect immediately - redis v4+ requires explicit connect()
  sharedRedisClient.connect().catch((err) => {
    console.error("[Redis] Initial connection error:", err.message);
  });

  return sharedRedisClient;
}
