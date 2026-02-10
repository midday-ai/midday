let sharedRedisClient: any = null;
let RedisClientClass: any = null;

// Dynamically load Bun's RedisClient to avoid crashing in non-Bun runtimes (e.g. trigger.dev on Node)
try {
  ({ RedisClient: RedisClientClass } = require("bun"));
} catch {
  // Not running in Bun — cache will be unavailable
}

/**
 * Map Railway region identifiers to per-region cache Redis env vars.
 * In Railway, each region has its own Redis cache service. The env vars
 * are set via Railway variable references, e.g.:
 *   REDIS_CACHE_US_WEST=${{cache-us-west.REDIS_URL}}
 *   REDIS_CACHE_US_EAST=${{cache-us-east.REDIS_URL}}
 *   REDIS_CACHE_EU_WEST=${{cache-eu-west.REDIS_URL}}
 */
const REGION_REDIS_MAP: Record<string, string> = {
  "us-west2": "REDIS_CACHE_US_WEST",
  "us-east4-eqdc4a": "REDIS_CACHE_US_EAST",
  "europe-west4-drams3a": "REDIS_CACHE_EU_WEST",
};

/**
 * Resolve the Redis URL for the current replica's region.
 * Falls back to REDIS_URL for local development and non-Railway environments.
 */
function resolveRedisUrl(): string | undefined {
  const region = process.env.RAILWAY_REPLICA_REGION;

  if (region) {
    const envVar = REGION_REDIS_MAP[region];
    const regionUrl = envVar ? process.env[envVar] : undefined;

    if (regionUrl) {
      return regionUrl;
    }
  }

  return process.env.REDIS_URL;
}

/**
 * Get or create a shared Redis client instance.
 * Returns null in non-Bun runtimes where RedisClient is unavailable.
 */
export function getSharedRedisClient(): any {
  if (sharedRedisClient) {
    return sharedRedisClient;
  }

  if (!RedisClientClass) {
    return null;
  }

  const redisUrl = resolveRedisUrl();

  if (!redisUrl) {
    throw new Error(
      "Redis URL not found. Set per-region REDIS_CACHE_* env vars or REDIS_URL.",
    );
  }

  const isProduction =
    process.env.NODE_ENV === "production" ||
    process.env.RAILWAY_ENVIRONMENT === "production";

  sharedRedisClient = new RedisClientClass(redisUrl, {
    connectionTimeout: isProduction ? 10000 : 5000,
    autoReconnect: true,
    maxRetries: 10,
    enableOfflineQueue: true,
    enableAutoPipelining: true,
  });

  sharedRedisClient.onclose = (err: Error) => {
    if (err) {
      console.error("[Redis] Connection closed:", err.message);
    }
  };

  // Connect eagerly so the client is ready for first use
  sharedRedisClient.connect().catch((err: Error) => {
    console.error("[Redis] Initial connection error:", err.message);
  });

  return sharedRedisClient;
}
