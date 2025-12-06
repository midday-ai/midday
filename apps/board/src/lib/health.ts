import Redis from "ioredis";
import { getQueues } from "./queues";

export interface HealthCheckResult {
  status: "ok" | "degraded" | "error";
  timestamp: string;
  redis: {
    connected: boolean;
    status?: string;
    error?: string;
  };
  queues: {
    initialized: boolean;
    count: number;
    names: string[];
    connectivity: Array<{
      name: string;
      connected: boolean;
      status?: string;
      error?: string;
    }>;
  };
  environment: {
    nodeEnv: string;
    hasRedisUrl: boolean;
  };
}

/**
 * Comprehensive health check for the Queue Board
 * Checks Redis connection and queue connectivity
 */
export async function checkHealth(): Promise<HealthCheckResult> {
  const timestamp = new Date().toISOString();
  const redisUrl = process.env.REDIS_QUEUE_URL;
  const hasRedisUrl = !!redisUrl;

  const result: HealthCheckResult = {
    status: "ok",
    timestamp,
    redis: {
      connected: false,
    },
    queues: {
      initialized: false,
      count: 0,
      names: [],
      connectivity: [],
    },
    environment: {
      nodeEnv: process.env.NODE_ENV || "unknown",
      hasRedisUrl,
    },
  };

  // Check Redis connection
  if (!hasRedisUrl) {
    result.redis.error = "REDIS_QUEUE_URL not configured";
    result.status = "error";
    return result;
  }

  try {
    // Create a temporary Redis connection to test connectivity
    // Use production settings if in production environment
    const isProduction =
      process.env.NODE_ENV === "production" || process.env.FLY_APP_NAME;

    const testRedis = new Redis(redisUrl, {
      family: isProduction ? 6 : 4, // IPv6 for Fly.io production, IPv4 for local
      maxRetriesPerRequest: 1,
      connectTimeout: 5000,
      lazyConnect: true,
      retryStrategy: () => null, // Don't retry for health check
      enableReadyCheck: false,
      ...(isProduction && {
        enableOfflineQueue: false,
      }),
    });

    try {
      await Promise.race([
        testRedis.connect(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Connection timeout")), 5000),
        ),
      ]);

      const pong = await Promise.race([
        testRedis.ping(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Ping timeout")), 3000),
        ),
      ]);

      result.redis.connected = pong === "PONG";
      result.redis.status = testRedis.status || "unknown";

      // Close test connection
      testRedis.disconnect();
    } catch (error) {
      result.redis.error =
        error instanceof Error ? error.message : String(error);
      result.redis.status = testRedis.status || "error";
      testRedis.disconnect();
    }
  } catch (error) {
    result.redis.error = error instanceof Error ? error.message : String(error);
    result.status = "error";
  }

  // Check queues
  const queues = getQueues();
  result.queues.initialized = queues.size > 0;
  result.queues.count = queues.size;
  result.queues.names = Array.from(queues.keys());

  // Check queue connectivity
  if (queues.size > 0) {
    const connectivityChecks = Array.from(queues.values()).map(
      async (queue) => {
        const queueCheck: HealthCheckResult["queues"]["connectivity"][0] = {
          name: queue.name,
          connected: false,
        };

        try {
          const connection = queue.opts?.connection as Redis | undefined;

          if (!connection) {
            queueCheck.error = "No connection configured";
            return queueCheck;
          }

          queueCheck.status = connection.status || "unknown";

          // Try to get queue metrics as a connectivity test
          // Use a timeout to avoid hanging
          await Promise.race([
            Promise.all([queue.getWaitingCount(), queue.getActiveCount()]),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error("Queue check timeout")), 3000),
            ),
          ]);

          queueCheck.connected = true;
        } catch (error) {
          queueCheck.error =
            error instanceof Error ? error.message : String(error);
          queueCheck.connected = false;
        }

        return queueCheck;
      },
    );

    result.queues.connectivity = await Promise.all(connectivityChecks);
  }

  // Determine overall status
  if (!result.redis.connected) {
    result.status = "error";
  } else if (
    result.queues.connectivity.length > 0 &&
    result.queues.connectivity.some((q) => !q.connected)
  ) {
    // Some queues are not connected, but Redis is - degraded state
    result.status = "degraded";
  }

  return result;
}
