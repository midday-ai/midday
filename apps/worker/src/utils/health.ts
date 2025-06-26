import { redisConnection } from "@worker/config/redis";

// Simple in-memory cache to reduce Redis calls
let healthCheckCache: {
  result: { status: string } | null;
  timestamp: number;
} = {
  result: null,
  timestamp: 0,
};

const CACHE_TTL = 45000; // 45 seconds cache (half the health check interval)

export async function getHealthCheck() {
  const now = Date.now();

  // Return cached result if still valid
  if (healthCheckCache.result && now - healthCheckCache.timestamp < CACHE_TTL) {
    return healthCheckCache.result;
  }

  try {
    await redisConnection.ping();

    const result = {
      status: "ok",
    };

    // Update cache
    healthCheckCache = {
      result,
      timestamp: now,
    };

    return result;
  } catch (error) {
    // Don't cache errors, always retry
    throw new Error(
      `Queue health check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
