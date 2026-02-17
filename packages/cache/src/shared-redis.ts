import { createLoggerWithContext } from "@midday/logger";

const logger = createLoggerWithContext("redis");

let sharedRedisClient: any = null;
let clientIsConnected = false;
let RedisClientClass: any = null;

// Dynamically load Bun's RedisClient to avoid crashing in non-Bun runtimes (e.g. trigger.dev on Node)
try {
  ({ RedisClient: RedisClientClass } = require("bun"));
} catch {
  // Not running in Bun — cache will be unavailable
}

/**
 * Resolve the Redis URL.
 *
 * All regions share a single Upstash Redis instance via REDIS_URL.
 */
function resolveRedisUrl(): string | undefined {
  return process.env.REDIS_URL;
}

/**
 * Bun's RedisClient has a known bug where autoReconnect does not work
 * (https://github.com/oven-sh/bun/issues/24019). When the connection
 * drops, the client never reconnects and commands hang or fail silently.
 *
 * To work around this we:
 *  1. Disable enableOfflineQueue so commands fail fast instead of queuing
 *  2. Track connection state via onconnect / onclose callbacks
 *  3. Discard the dead singleton on close so the next call creates a fresh client
 */
function createClient(): any {
  const redisUrl = resolveRedisUrl();

  if (!redisUrl) {
    throw new Error(
      "Redis URL not found. Set per-region REDIS_CACHE_* env vars or REDIS_URL.",
    );
  }

  const isProduction =
    process.env.NODE_ENV === "production" ||
    process.env.RAILWAY_ENVIRONMENT === "production";

  const client = new RedisClientClass(redisUrl, {
    connectionTimeout: isProduction ? 10000 : 5000,
    autoReconnect: true,
    maxRetries: 10,
    // Disabled: Bun's autoReconnect is broken, so queued commands would
    // hang forever. Failing fast lets RedisCache catch errors and fall
    // back to the database instead of blocking the request.
    enableOfflineQueue: false,
    enableAutoPipelining: true,
  });

  client.onconnect = () => {
    clientIsConnected = true;
    logger.info("Connection established");
  };

  client.onclose = (err: Error) => {
    clientIsConnected = false;

    if (err) {
      logger.error("Connection closed", { error: err.message });
    } else {
      logger.warn("Connection closed (no error)");
    }

    // Discard the dead singleton so the next getSharedRedisClient() call
    // creates a fresh client with a new TCP connection.
    if (sharedRedisClient === client) {
      sharedRedisClient = null;
    }
  };

  // Connect eagerly so the client is ready for first use
  client.connect().catch((err: Error) => {
    logger.error("Initial connection error", { error: err.message });
    // Discard on failed initial connect so we retry next time
    if (sharedRedisClient === client) {
      sharedRedisClient = null;
    }
  });

  return client;
}

/**
 * Get or create a shared Redis client instance.
 * Returns null in non-Bun runtimes where RedisClient is unavailable.
 *
 * If the previous client disconnected it will have been discarded,
 * so this will transparently create a new one.
 */
export function getSharedRedisClient(): any {
  if (sharedRedisClient) {
    return sharedRedisClient;
  }

  if (!RedisClientClass) {
    return null;
  }

  sharedRedisClient = createClient();
  return sharedRedisClient;
}

/**
 * Check whether the shared Redis client is currently connected.
 * Useful for callers that want to skip Redis entirely when it's down.
 */
export function isRedisConnected(): boolean {
  return clientIsConnected;
}
