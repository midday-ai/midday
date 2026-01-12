import { createClient } from "redis";

type RedisClient = ReturnType<typeof createClient>;

let sharedRedisClient: RedisClient | null = null;
let isReconnecting = false;
let consecutiveHighLatencyCount = 0;

const PING_TIMEOUT_MS = 5000; // Consider connection unhealthy if ping takes > 5s
const HIGH_LATENCY_THRESHOLD_MS = 2000; // Log warning if ping takes > 2s
const HIGH_LATENCY_RECONNECT_COUNT = 3; // Reconnect after 3 consecutive high latency pings
const HEALTH_CHECK_INTERVAL_MS = 30 * 1000; // Check health every 30s

/**
 * Get or create a shared Redis client instance
 * This ensures we reuse the same connection for both cache and memory providers
 * Includes health monitoring and automatic reconnection for degraded connections
 */
export function getSharedRedisClient(): RedisClient {
  if (sharedRedisClient) {
    return sharedRedisClient;
  }

  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    throw new Error("REDIS_URL environment variable is required");
  }

  sharedRedisClient = createRedisClient(redisUrl);
  startHealthMonitor();

  return sharedRedisClient;
}

function createRedisClient(redisUrl: string): RedisClient {
  const isProduction =
    process.env.NODE_ENV === "production" || process.env.FLY_APP_NAME;

  const client = createClient({
    url: redisUrl,
    pingInterval: 60 * 1000, // 1-minute ping interval (reduced from 4 min)
    socket: {
      family: isProduction ? 6 : 4, // IPv6 for Fly.io production, IPv4 for local
      connectTimeout: isProduction ? 10000 : 5000,
      reconnectStrategy: (retries) => {
        // Exponential backoff: 100ms, 200ms, 400ms... max 3s
        const delay = Math.min(100 * 2 ** retries, 3000);
        console.log(
          `[Redis] Reconnecting in ${delay}ms (attempt ${retries + 1})`,
        );
        return delay;
      },
    },
  });

  client.on("error", (err) => {
    console.error("[Redis] Error:", err.message);
  });

  client.on("connect", () => {
    console.log("[Redis] Connected");
  });

  client.on("reconnecting", () => {
    console.log("[Redis] Reconnecting...");
  });

  // Start connection
  client.connect().catch((err) => {
    console.error("[Redis] Initial connection error:", err.message);
  });

  return client;
}

/**
 * Monitor connection health and force reconnect if degraded
 */
function startHealthMonitor() {
  setInterval(async () => {
    if (!sharedRedisClient || isReconnecting) return;

    try {
      const start = Date.now();
      await Promise.race([
        sharedRedisClient.ping(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Ping timeout")), PING_TIMEOUT_MS),
        ),
      ]);
      const latency = Date.now() - start;

      // Track consecutive high latency occurrences
      if (latency > HIGH_LATENCY_THRESHOLD_MS) {
        consecutiveHighLatencyCount++;
        console.warn(
          `[Redis] High latency: ${latency}ms (${consecutiveHighLatencyCount}/${HIGH_LATENCY_RECONNECT_COUNT})`,
        );

        // Reconnect after sustained high latency
        if (consecutiveHighLatencyCount >= HIGH_LATENCY_RECONNECT_COUNT) {
          console.warn("[Redis] Sustained high latency detected, reconnecting");
          consecutiveHighLatencyCount = 0;
          await forceReconnect();
        }
      } else {
        // Reset counter on good ping
        consecutiveHighLatencyCount = 0;
      }
    } catch (err) {
      console.error("[Redis] Health check failed:", err);
      consecutiveHighLatencyCount = 0;
      await forceReconnect();
    }
  }, HEALTH_CHECK_INTERVAL_MS);
}

/**
 * Force a fresh connection when the current one is degraded
 */
async function forceReconnect() {
  if (isReconnecting) return;
  isReconnecting = true;

  console.log("[Redis] Forcing reconnection due to degraded connection");

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    isReconnecting = false;
    return;
  }

  const oldClient = sharedRedisClient;

  try {
    // Create fresh client first (before disconnecting old one)
    const newClient = createRedisClient(redisUrl);

    // Wait for new client to be ready (with timeout)
    await Promise.race([
      new Promise<void>((resolve) => {
        if (newClient.isReady) {
          resolve();
        } else {
          newClient.once("ready", resolve);
        }
      }),
      new Promise<void>((_, reject) =>
        setTimeout(() => reject(new Error("Connection timeout")), 10000),
      ),
    ]);

    // Swap to new client
    sharedRedisClient = newClient;
    console.log("[Redis] Reconnection successful");

    // Disconnect old client in background
    if (oldClient) {
      oldClient.disconnect().catch(() => {});
    }
  } catch (err) {
    console.error("[Redis] Reconnection failed:", err);
    // Keep old client if reconnection fails
  } finally {
    isReconnecting = false;
  }
}
