import { getConnectionState, getRedisConnection } from "./config";
import { checkDbHealth } from "./utils/db";

/**
 * Health check endpoint
 * Checks Redis and database connections with enhanced connection state monitoring
 */
export async function checkHealth(): Promise<{
  status: "ok" | "error";
  redis: "connected" | "disconnected" | "error";
  redisState: string;
  database: "connected" | "disconnected" | "error";
  timestamp: string;
}> {
  const redis = getRedisConnection();
  const connectionState = getConnectionState();
  let redisStatus: "connected" | "disconnected" | "error" = "disconnected";
  let databaseStatus: "connected" | "disconnected" | "error" = "disconnected";

  // Check Redis connection state first
  // Only proceed with ping if connection is in a valid state
  if (connectionState === "ready" || connectionState === "connected") {
    try {
      // Use Promise.race to timeout ping after 5 seconds
      const pingPromise = redis.ping();
      const timeoutPromise = new Promise<string>((_, reject) => {
        setTimeout(() => reject(new Error("Redis ping timeout")), 5000);
      });

      const result = await Promise.race([pingPromise, timeoutPromise]);
      redisStatus = result === "PONG" ? "connected" : "disconnected";
    } catch (error) {
      redisStatus = "error";
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(
        `[Health Check] Redis ping failed (state: ${connectionState}):`,
        errorMessage,
      );
    }
  } else {
    // Connection is not ready/connected, mark as disconnected
    redisStatus =
      connectionState === "reconnecting" ? "disconnected" : "disconnected";
    console.warn(
      `[Health Check] Redis connection not ready (state: ${connectionState})`,
    );
  }

  // Check Database
  try {
    const dbHealthy = await checkDbHealth();
    databaseStatus = dbHealthy ? "connected" : "disconnected";
  } catch (error) {
    databaseStatus = "error";
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[Health Check] Database check failed:", errorMessage);
  }

  return {
    status:
      redisStatus === "connected" && databaseStatus === "connected"
        ? "ok"
        : "error",
    redis: redisStatus,
    redisState: connectionState,
    database: databaseStatus,
    timestamp: new Date().toISOString(),
  };
}
