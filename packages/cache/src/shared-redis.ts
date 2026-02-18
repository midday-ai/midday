import { createLoggerWithContext } from "@midday/logger";
import { createClient, type RedisClientType } from "redis";

const logger = createLoggerWithContext("redis");

let sharedRedisClient: RedisClientType | null = null;
let connectPromise: Promise<void> | null = null;

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
    // Upstash / Railway intermediaries silently kill idle TLS connections.
    // A 10 s ping shrinks the window where commands queue on a dead socket
    // from ~60 s down to ~10 s, which is the main fix for the "slow after
    // inactivity" symptom.
    pingInterval: 10_000,
    socket: {
      family: 4,
      connectTimeout: isProduction ? 10_000 : 5_000,
      keepAlive: true,
      noDelay: true,
      reconnectStrategy: (retries) => {
        if (retries > 20) {
          logger.error("Max reconnection attempts reached");
          return new Error("Max reconnection attempts reached");
        }
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

  sharedRedisClient.on("end", () => {
    logger.info("Connection closed");
  });

  connectPromise = sharedRedisClient
    .connect()
    .then(() => {
      connectPromise = null;
    })
    .catch((err) => {
      connectPromise = null;
      logger.error("Initial connection error", { error: err.message });
    });

  return sharedRedisClient;
}

/**
 * Wait for the shared client to finish its initial connection.
 * Returns `true` if the client is ready, `false` on timeout.
 */
export async function waitForRedisReady(timeoutMs = 2_000): Promise<boolean> {
  const client = getSharedRedisClient();

  if (client.isReady) return true;
  if (!connectPromise) return false;

  try {
    await Promise.race([
      connectPromise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), timeoutMs),
      ),
    ]);
    return client.isReady;
  } catch {
    return false;
  }
}
