import { type RedisClientType, createClient } from "redis";

let sharedRedisClient: RedisClientType | null = null;

/**
 * Get or create a shared Redis client instance
 * This ensures we reuse the same connection for both cache and memory providers
 */
export async function getSharedRedisClient(): Promise<RedisClientType> {
  if (sharedRedisClient?.isOpen) {
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

  await sharedRedisClient.connect();
  return sharedRedisClient;
}

/**
 * Get the shared Redis client synchronously (may return null if not connected)
 * Use this when you need the client but don't want to await connection
 */
export function getSharedRedisClientSync(): RedisClientType | null {
  return sharedRedisClient?.isOpen ? sharedRedisClient : null;
}
