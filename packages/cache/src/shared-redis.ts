import { createLoggerWithContext } from "@midday/logger";
import { RedisClient } from "bun";

const logger = createLoggerWithContext("redis");

const REGION_URL_MAP: Record<string, string> = {
  "europe-west4-drams3a": "REDIS_URL_EU",
  "us-east4-eqdc4a": "REDIS_URL_US_EAST",
  "us-west2": "REDIS_URL_US_WEST",
};

function resolveRedisUrl(): string {
  const region = process.env.RAILWAY_REPLICA_REGION;
  if (region) {
    const envVar = REGION_URL_MAP[region];
    const url = envVar ? process.env[envVar] : undefined;
    if (url) {
      logger.info(`Using regional Redis: ${envVar} (${region})`);
      return url;
    }
  }
  if (process.env.REDIS_URL) {
    logger.info("Using default REDIS_URL (no region match)");
    return process.env.REDIS_URL;
  }

  throw new Error(
    "No Redis URL configured. Set REDIS_URL or region-specific REDIS_URL_EU / REDIS_URL_US_EAST / REDIS_URL_US_WEST",
  );
}

let sharedClient: RedisClient | null = null;
let resolvedUrl: string | null = null;
let disconnectedAt: number | null = null;
let connectedAt: number | null = null;
let connectStartedAt: number | null = null;
let reconnectCount = 0;
let keepaliveTimer: ReturnType<typeof setInterval> | null = null;
let initialConnectPromise: Promise<void> | null = null;

const isProduction =
  process.env.NODE_ENV === "production" ||
  process.env.RAILWAY_ENVIRONMENT === "production";

const MAX_DISCONNECT_MS = 15_000;

const KEEPALIVE_INTERVAL_MS = 5_000;
const KEEPALIVE_TIMEOUT_MS = 2_000;

function startKeepalive(client: RedisClient): void {
  stopKeepalive();

  keepaliveTimer = setInterval(async () => {
    if (sharedClient !== client) {
      stopKeepalive();
      return;
    }

    if (!client.connected) {
      const downFor = disconnectedAt ? Date.now() - disconnectedAt : 0;
      logger.warn("Keepalive: client disconnected", {
        downForMs: downFor,
        reconnectCount,
      });
      return;
    }

    try {
      const start = performance.now();
      await Promise.race([
        client.send("PING", []),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error("keepalive PING timed out")),
            KEEPALIVE_TIMEOUT_MS,
          ),
        ),
      ]);
      const elapsed = performance.now() - start;
      if (elapsed > 50) {
        logger.warn("Keepalive PING slow", {
          latencyMs: Math.round(elapsed),
          connectedForMs: connectedAt ? Date.now() - connectedAt : null,
        });
      }
    } catch (err) {
      logger.warn("Keepalive PING failed", {
        error: err instanceof Error ? err.message : String(err),
        reconnectCount,
      });
    }
  }, KEEPALIVE_INTERVAL_MS);

  if (
    keepaliveTimer &&
    typeof keepaliveTimer === "object" &&
    "unref" in keepaliveTimer
  ) {
    keepaliveTimer.unref();
  }
}

function stopKeepalive(): void {
  if (keepaliveTimer) {
    clearInterval(keepaliveTimer);
    keepaliveTimer = null;
  }
}

function createClient(): RedisClient {
  if (!resolvedUrl) resolvedUrl = resolveRedisUrl();

  disconnectedAt = null;
  connectedAt = null;
  connectStartedAt = performance.now();

  const client = new RedisClient(resolvedUrl, {
    autoReconnect: true,
    enableOfflineQueue: false,
    maxRetries: 20,
    connectionTimeout: isProduction ? 5_000 : 3_000,
    idleTimeout: 0,
  });

  client.onconnect = () => {
    if (sharedClient !== client) return;
    const wasDown = disconnectedAt;
    const connectDuration = connectStartedAt
      ? Math.round(performance.now() - connectStartedAt)
      : null;
    disconnectedAt = null;
    connectedAt = Date.now();
    connectStartedAt = null;

    if (wasDown) {
      reconnectCount++;
      logger.info("Reconnected", {
        reconnectMs: connectDuration,
        downForMs: Date.now() - wasDown,
        reconnectCount,
      });
    } else {
      logger.info("Connection established", {
        connectMs: connectDuration,
      });
    }
  };

  client.onclose = (err) => {
    if (sharedClient !== client) return;
    const wasConnected = !disconnectedAt;
    if (wasConnected) {
      disconnectedAt = Date.now();
      connectStartedAt = performance.now();
    }
    const uptime = connectedAt ? Date.now() - connectedAt : 0;
    logger.warn("Connection closed", {
      error: err?.message ?? null,
      uptimeMs: uptime,
      reconnectCount,
      firstDisconnect: wasConnected,
    });
  };

  initialConnectPromise = client.connect().catch((err) => {
    logger.error("Initial connection failed", {
      error: err.message,
      connectMs: connectStartedAt
        ? Math.round(performance.now() - connectStartedAt)
        : null,
    });
  });

  startKeepalive(client);

  return client;
}

/**
 * Get or create a shared Bun RedisClient singleton.
 * Automatically selects the correct regional Redis URL based on RAILWAY_REPLICA_REGION.
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
    const downFor = Date.now() - disconnectedAt;
    logger.warn("Client disconnected too long, recreating", {
      downForMs: downFor,
      reconnectCount,
    });
    stopKeepalive();
    try {
      sharedClient.close();
    } catch {
      // ignore — client may already be fully dead
    }
    sharedClient = null;
    disconnectedAt = null;
    connectedAt = null;
    reconnectCount = 0;
  }

  if (sharedClient) return sharedClient;

  logger.info("Creating new Redis client");
  sharedClient = createClient();
  return sharedClient;
}

/**
 * Wait for the initial Redis connection (up to `timeoutMs`).
 * Returns `true` if connected, `false` if timed out or no client exists.
 */
export function waitForRedisReady(timeoutMs = 2_000): Promise<boolean> {
  if (sharedClient?.connected) return Promise.resolve(true);
  if (!initialConnectPromise) return Promise.resolve(false);
  return Promise.race([
    initialConnectPromise.then(() => sharedClient?.connected ?? false),
    new Promise<boolean>((resolve) =>
      setTimeout(() => resolve(false), timeoutMs),
    ),
  ]);
}

/**
 * Close the shared Redis connection and clear the singleton.
 * Called during graceful shutdown.
 */
export function closeSharedRedisClient(): void {
  stopKeepalive();
  if (sharedClient) {
    logger.info("Closing shared Redis client (graceful shutdown)");
    sharedClient.close();
    sharedClient = null;
    disconnectedAt = null;
  }
}
