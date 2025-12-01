import { getRedisConnection } from "./config";
import { checkDbHealth } from "./utils/db";

/**
 * Health check endpoint
 * Checks Redis and database connections
 */
export async function checkHealth(): Promise<{
  status: "ok" | "error";
  redis: "connected" | "disconnected" | "error";
  database: "connected" | "disconnected" | "error";
  timestamp: string;
}> {
  const redis = getRedisConnection();
  let redisStatus: "connected" | "disconnected" | "error" = "disconnected";
  let databaseStatus: "connected" | "disconnected" | "error" = "disconnected";

  // Check Redis
  try {
    const result = await redis.ping();
    redisStatus = result === "PONG" ? "connected" : "disconnected";
  } catch (error) {
    redisStatus = "error";
    console.error("Health check Redis error:", error);
  }

  // Check Database
  try {
    const dbHealthy = await checkDbHealth();
    databaseStatus = dbHealthy ? "connected" : "disconnected";
  } catch (error) {
    databaseStatus = "error";
    console.error("Health check Database error:", error);
  }

  return {
    status:
      redisStatus === "connected" && databaseStatus === "connected"
        ? "ok"
        : "error",
    redis: redisStatus,
    database: databaseStatus,
    timestamp: new Date().toISOString(),
  };
}
