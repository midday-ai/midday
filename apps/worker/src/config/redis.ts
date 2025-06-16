import Redis, { type RedisOptions } from "ioredis";
import { logger } from "../monitoring/logger";

const redisUrl = process.env.REDIS_WORKER_URL;

if (!redisUrl) {
  throw new Error("REDIS_WORKER_URL environment variable is required");
}

const isDevelopment = process.env.ENVIRONMENT === "development";

const connectionOptions: RedisOptions = {
  enableReadyCheck: true,
  maxRetriesPerRequest: null,
  lazyConnect: false,
  connectTimeout: isDevelopment ? 60000 : 20000,
  commandTimeout: isDevelopment ? 30000 : 15000,
  keepAlive: 30000,
  family: isDevelopment ? 4 : 6,
  autoResendUnfulfilledCommands: true,
  autoResubscribe: true,
  enableOfflineQueue: false,
};

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
