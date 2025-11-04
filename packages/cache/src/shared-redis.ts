import { type RedisClientType, createClient } from "redis";

let sharedRedisClient: RedisClientType | null = null;

/**
 * Get or create a shared Redis client instance
 * This ensures we reuse the same connection for both cache and memory providers
 * The client will auto-connect when methods are called, so it's safe to use immediately
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
    process.env.NODE_ENV === "production" || process.env.FLY_APP_NAME;

  sharedRedisClient = createClient({
    url: redisUrl,
    pingInterval: 4 * 60 * 1000, // 4-minute ping interval
    socket: {
      family: isProduction ? 6 : 4, // IPv6 for Fly.io production, IPv4 for local
      connectTimeout: isProduction ? 15000 : 5000,
    },
  });

  // Event listeners
  sharedRedisClient.on("error", (err) => {
    console.error("[Shared Redis] Error:", err);
  });

  // Start connection in background (don't await)
  // The client will auto-connect when methods are called
  sharedRedisClient.connect().catch((err) => {
    console.error("[Shared Redis] Connection error:", err);
  });

  return sharedRedisClient;
}
