import { getConnectionState, getRedisConnection } from "./config";
import { checkDbHealth } from "./utils/db";

/**
 * Health check endpoint
 * Checks Redis and database connections with enhanced connection state monitoring
 * Includes response time metrics and detailed error information
 */
export async function checkHealth(): Promise<{
  status: "ok" | "error";
  redis: {
    status: "connected" | "disconnected" | "error";
    state: string;
    responseTimeMs?: number;
    error?: string;
  };
  database: {
    status: "connected" | "disconnected" | "error";
    responseTimeMs?: number;
    error?: string;
  };
  timestamp: string;
  responseTimeMs: number;
}> {
  const overallStartTime = Date.now();
  const redis = getRedisConnection();
  const connectionState = getConnectionState();
  let redisStatus: "connected" | "disconnected" | "error" = "disconnected";
  let redisError: string | undefined;
  let redisResponseTimeMs: number | undefined;

  // Check Redis connection state first
  // Only proceed with ping if connection is in a valid state
  if (connectionState === "ready" || connectionState === "connected") {
    const redisStartTime = Date.now();
    try {
      // Use Promise.race to timeout ping after 5 seconds
      const pingPromise = redis.ping();
      const timeoutPromise = new Promise<string>((_, reject) => {
        setTimeout(() => reject(new Error("Redis ping timeout")), 5000);
      });

      const result = await Promise.race([pingPromise, timeoutPromise]);
      redisResponseTimeMs = Date.now() - redisStartTime;
      redisStatus = result === "PONG" ? "connected" : "disconnected";
      if (result !== "PONG") {
        redisError = `Unexpected ping response: ${result}`;
      }
    } catch (error) {
      redisResponseTimeMs = Date.now() - redisStartTime;
      redisStatus = "error";
      redisError = error instanceof Error ? error.message : String(error);
      console.error(
        `[Health Check] Redis ping failed (state: ${connectionState}):`,
        redisError,
      );
    }
  } else {
    // Connection is not ready/connected, mark as disconnected
    redisStatus = "disconnected";
    redisError = `Connection not ready (state: ${connectionState})`;
    console.warn(
      `[Health Check] Redis connection not ready (state: ${connectionState})`,
    );
  }

  // Check Database
  const dbHealthResult = await checkDbHealth();
  const databaseStatus: "connected" | "disconnected" | "error" =
    dbHealthResult.healthy ? "connected" : "error";

  const overallResponseTimeMs = Date.now() - overallStartTime;

  return {
    status:
      redisStatus === "connected" && databaseStatus === "connected"
        ? "ok"
        : "error",
    redis: {
      status: redisStatus,
      state: connectionState,
      responseTimeMs: redisResponseTimeMs,
      error: redisError,
    },
    database: {
      status: databaseStatus,
      responseTimeMs: dbHealthResult.responseTimeMs,
      error: dbHealthResult.error,
    },
    timestamp: new Date().toISOString(),
    responseTimeMs: overallResponseTimeMs,
  };
}
