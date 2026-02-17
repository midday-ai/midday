import { createLoggerWithContext } from "@midday/logger";
import { createClient, type RedisClientType } from "redis";

const logger = createLoggerWithContext("redis");

let sharedRedisClient: RedisClientType | null = null;

/**
 * Get or create a shared Redis client instance.
 * Uses the `redis` (node-redis) package which works on both Bun and Node runtimes.
 * Reuses the same connection for both cache and memory providers.
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
    pingInterval: 60_000,
    socket: {
      family: 4,
      connectTimeout: isProduction ? 10_000 : 5_000,
      keepAlive: true,
      noDelay: true,
      reconnectStrategy: (retries) => {
        const delay = Math.min(100 * 2 ** retries, 3_000);
        logger.info(`Reconnecting in ${delay}ms (attempt ${retries + 1})`);
        return delay;
      },
    },
  });

  sharedRedisClient.on("error", (err) => {
    logger.error("Client error", { error: err.message });
  });

  sharedRedisClient.on("reconnecting", () => {
    logger.info("Reconnecting...");
  });

  sharedRedisClient.on("ready", () => {
    logger.info("Connection established");
  });

  sharedRedisClient.connect().catch((err) => {
    logger.error("Initial connection error", { error: err.message });
  });

  return sharedRedisClient;
}
