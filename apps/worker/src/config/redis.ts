import Redis, { type RedisOptions } from "ioredis";

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error("REDIS_URL environment variable is required");
}

// Parse Redis URL for connection options
const connectionOptions: RedisOptions = {
  // Enable retries
  enableReadyCheck: false,
  maxRetriesPerRequest: 3,

  // Connection pool settings
  lazyConnect: true,

  // Timeouts
  connectTimeout: 10000,
  commandTimeout: 5000,

  // Keep-alive
  keepAlive: 30000,

  // Use IPv6
  family: 6,
};

// Create Redis connection
export const redisConnection = new Redis(redisUrl, connectionOptions);

// Connection event handlers
redisConnection.on("connect", () => {
  console.log("Redis connected");
});

redisConnection.on("ready", () => {
  console.log("Redis ready");
});

redisConnection.on("error", (error: Error) => {
  console.error("Redis connection error:", error);
});

redisConnection.on("close", () => {
  console.log("Redis connection closed");
});

redisConnection.on("reconnecting", () => {
  console.log("Redis reconnecting...");
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
