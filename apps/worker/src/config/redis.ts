import Redis, { type RedisOptions } from "ioredis";
import { logger } from "../monitoring/logger";

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error("REDIS_URL environment variable is required");
}

const isDevelopment = process.env.ENVIRONMENT === "development";

// Parse Redis URL for connection options
const connectionOptions: RedisOptions = {
  // BullMQ requires this to be enabled for proper job handling
  enableReadyCheck: true,
  maxRetriesPerRequest: null,

  // Connection settings
  lazyConnect: true,

  // Environment-specific timeouts
  connectTimeout: isDevelopment ? 60000 : 10000, // Longer timeout for local Docker
  commandTimeout: isDevelopment ? 30000 : 5000, // Longer timeout for local Docker

  // Keep-alive settings
  keepAlive: 30000,

  // Network family: IPv6 for Fly.io production, IPv4 for local Docker
  family: isDevelopment ? 4 : 6,

  // Additional settings based on environment
  autoResendUnfulfilledCommands: !isDevelopment,
  autoResubscribe: true,
};

logger.info("Redis connection options", connectionOptions);

// Create Redis connection
export const redisConnection = new Redis(redisUrl, connectionOptions);

// Connection event handlers for debugging
redisConnection.on("connect", () => {
  logger.info("Redis connected");
});

redisConnection.on("ready", () => {
  logger.info("Redis ready");
});

redisConnection.on("error", (error: Error) => {
  logger.error("Redis connection error", error);
});

redisConnection.on("close", () => {
  logger.info("Redis connection closed");
});

redisConnection.on("reconnecting", (delay: number) => {
  logger.info(`Redis reconnecting in ${delay}ms...`);
});

// Graceful shutdown helper
export const closeRedisConnection = async (): Promise<void> => {
  try {
    await redisConnection.quit();
    console.log("Redis connection closed gracefully");
  } catch (error) {
    console.error("Error closing Redis connection:", error);
    redisConnection.disconnect();
  }
};

export default redisConnection;
