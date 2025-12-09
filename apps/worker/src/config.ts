import Redis from "ioredis";

let redisConnection: Redis | null = null;
let keepAliveInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Connection state tracking
 */
let connectionState:
  | "connecting"
  | "connected"
  | "ready"
  | "reconnecting"
  | "disconnected" = "disconnected";

const isProduction =
  process.env.NODE_ENV === "production" || process.env.FLY_APP_NAME;

/**
 * Get or create Redis connection for BullMQ
 * Uses REDIS_QUEUE_URL (separate from cache Redis)
 */
export function getRedisConnection(): Redis {
  if (redisConnection) {
    return redisConnection;
  }

  const redisUrl = process.env.REDIS_QUEUE_URL;

  if (!redisUrl) {
    throw new Error("REDIS_QUEUE_URL environment variable is required");
  }

  redisConnection = new Redis(redisUrl, {
    maxRetriesPerRequest: null, // Required for BullMQ
    enableReadyCheck: false, // BullMQ handles this
    // Connect eagerly for workers - fail fast if Redis is unavailable
    // Workers need Redis immediately to process jobs
    lazyConnect: false,
    family: isProduction ? 6 : 4, // IPv6 for Fly.io production, IPv4 for local
    keepAlive: 30000, // Keep connection alive with 30s keepAlive to prevent idle timeouts
    ...(isProduction && {
      // Production settings for Upstash/Fly.io
      connectTimeout: 15000, // Longer timeout for Upstash
      retryStrategy: (times) => {
        // Always return a number to ensure infinite retries
        // Exponential backoff: 50ms, 100ms, 150ms... up to 2000ms max
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      enableOfflineQueue: false, // Don't queue commands when offline
    }),
  });

  // Connection state event handlers
  redisConnection.on("error", (err) => {
    console.error("[Redis Queue] Connection error:", err);
    connectionState = "disconnected";
  });

  redisConnection.on("connect", () => {
    console.log("[Redis Queue] Connected");
    connectionState = "connected";
  });

  redisConnection.on("ready", () => {
    console.log("[Redis Queue] Ready");
    connectionState = "ready";

    // Start periodic keep-alive ping when connection is ready
    if (keepAliveInterval) {
      clearInterval(keepAliveInterval);
    }

    keepAliveInterval = setInterval(async () => {
      if (redisConnection && connectionState === "ready") {
        try {
          await redisConnection.ping();
        } catch (error) {
          console.error("[Redis Queue] Keep-alive ping failed:", error);
        }
      }
    }, 30000); // Ping every 30 seconds
  });

  redisConnection.on("reconnecting", (delay: number) => {
    console.log(`[Redis Queue] Reconnecting in ${delay}ms...`);
    connectionState = "reconnecting";
  });

  redisConnection.on("close", () => {
    console.log("[Redis Queue] Connection closed");
    connectionState = "disconnected";

    // Clear keep-alive interval when connection closes
    if (keepAliveInterval) {
      clearInterval(keepAliveInterval);
      keepAliveInterval = null;
    }
  });

  redisConnection.on("end", () => {
    console.log("[Redis Queue] Connection ended");
    connectionState = "disconnected";

    // Clear keep-alive interval when connection ends
    if (keepAliveInterval) {
      clearInterval(keepAliveInterval);
      keepAliveInterval = null;
    }
  });

  return redisConnection;
}

/**
 * Create a separate Redis connection for FlowProducer
 * BullMQ best practice: separate connections for Queue, Worker, and FlowProducer
 */
export function getFlowRedisConnection(): Redis {
  const redisUrl = process.env.REDIS_QUEUE_URL;

  if (!redisUrl) {
    throw new Error("REDIS_QUEUE_URL environment variable is required");
  }

  const connection = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: false,
    family: isProduction ? 6 : 4, // IPv6 for Fly.io production, IPv4 for local
    keepAlive: 30000, // Keep connection alive with 30s keepAlive to prevent idle timeouts
    ...(isProduction && {
      connectTimeout: 15000, // Longer timeout for Upstash
      retryStrategy: (times) => {
        // Always return a number to ensure infinite retries
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      enableOfflineQueue: false, // Don't queue commands when offline
    }),
  });

  // Add event handlers for FlowProducer connection monitoring
  connection.on("error", (err) => {
    console.error("[Redis FlowProducer] Connection error:", err);
  });

  connection.on("connect", () => {
    console.log("[Redis FlowProducer] Connected");
  });

  connection.on("ready", () => {
    console.log("[Redis FlowProducer] Ready");
  });

  connection.on("reconnecting", (delay: number) => {
    console.log(`[Redis FlowProducer] Reconnecting in ${delay}ms...`);
  });

  connection.on("close", () => {
    console.log("[Redis FlowProducer] Connection closed");
  });

  return connection;
}
