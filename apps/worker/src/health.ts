import { getRedisConnection } from "./config";

/**
 * Health check endpoint
 * Checks Redis connection and returns status
 */
export async function checkHealth(): Promise<{
  status: "ok" | "error";
  redis: "connected" | "disconnected" | "error";
  timestamp: string;
}> {
  const redis = getRedisConnection();
  let redisStatus: "connected" | "disconnected" | "error" = "disconnected";

  try {
    const result = await redis.ping();
    redisStatus = result === "PONG" ? "connected" : "disconnected";
  } catch (error) {
    redisStatus = "error";
    console.error("Health check Redis error:", error);
  }

  return {
    status: redisStatus === "connected" ? "ok" : "error",
    redis: redisStatus,
    timestamp: new Date().toISOString(),
  };
}
