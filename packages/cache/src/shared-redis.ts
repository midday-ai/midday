import { createLoggerWithContext } from "@midday/logger";
import { RedisClient } from "bun";

const logger = createLoggerWithContext("redis");

const REGION_URL_MAP: Record<string, string> = {
  "europe-west4-drams3a": "REDIS_URL_EU",
  "us-east4-eqdc4a": "REDIS_URL_US_EAST",
  "us-west2": "REDIS_URL_US_WEST",
};

function resolveRedisUrl(): string {
  const region = process.env.RAILWAY_REGION;
  if (region) {
    const envVar = REGION_URL_MAP[region];
    const url = envVar ? process.env[envVar] : undefined;
    if (url) {
      logger.info(`Using regional Redis: ${envVar} (${region})`);
      return url;
    }
  }
  if (process.env.REDIS_URL) return process.env.REDIS_URL;
  throw new Error(
    "No Redis URL configured. Set REDIS_URL or region-specific REDIS_URL_EU / REDIS_URL_US_EAST / REDIS_URL_US_WEST",
  );
}

let sharedClient: RedisClient | null = null;
let resolvedUrl: string | null = null;
let disconnectedAt: number | null = null;

const isProduction =
  process.env.NODE_ENV === "production" ||
  process.env.RAILWAY_ENVIRONMENT === "production";

// Allow auto-reconnect its full window (20 retries × ~2 s cap ≈ 40 s)
// plus buffer for a slow Redis container restart. After this, destroy
// the client and start fresh so the system self-heals.
const MAX_DISCONNECT_MS = 60_000;

function createClient(): RedisClient {
  if (!resolvedUrl) resolvedUrl = resolveRedisUrl();

  disconnectedAt = null;

  const client = new RedisClient(resolvedUrl, {
    autoReconnect: true,
    enableOfflineQueue: false,
    maxRetries: 20,
    connectionTimeout: isProduction ? 10_000 : 5_000,
    idleTimeout: 0,
  });

  client.onconnect = () => {
    disconnectedAt = null;
    logger.info("Connection established");
  };

  // onclose fires on EVERY disconnect (not just when auto-reconnect gives up).
  // Don't clear the singleton here — let auto-reconnect work. We only track
  // the timestamp so getSharedRedisClient() can destroy a permanently-dead
  // client after MAX_DISCONNECT_MS.
  client.onclose = (err) => {
    if (!disconnectedAt) disconnectedAt = Date.now();
    if (err) {
      logger.warn(`Connection closed: ${err.message}`);
    }
  };

  return client;
}

/**
 * Get or create a shared Bun RedisClient singleton.
 * Automatically selects the correct regional Redis URL based on RAILWAY_REGION.
 *
 * Self-healing: if the client has been disconnected for longer than
 * MAX_DISCONNECT_MS (auto-reconnect exhausted), it is destroyed and a
 * fresh client is created so the API never requires a manual restart.
 */
export function getSharedRedisClient(): RedisClient {
  if (
    sharedClient &&
    disconnectedAt &&
    Date.now() - disconnectedAt > MAX_DISCONNECT_MS
  ) {
    logger.warn("Client disconnected too long, recreating");
    try {
      sharedClient.close();
    } catch {
      // ignore — client may already be fully dead
    }
    sharedClient = null;
    disconnectedAt = null;
  }

  if (sharedClient) return sharedClient;

  sharedClient = createClient();
  return sharedClient;
}

/**
 * Close the shared Redis connection and clear the singleton.
 * Called during graceful shutdown.
 */
export function closeSharedRedisClient(): void {
  if (sharedClient) {
    sharedClient.close();
    sharedClient = null;
    disconnectedAt = null;
  }
}
