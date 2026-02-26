import { createLoggerWithContext } from "@midday/logger";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import type { Database } from "./client";
import * as schema from "./schema";

const isDevelopment = process.env.NODE_ENV === "development";
const logger = createLoggerWithContext("db:worker");
const DB_POOL_EVENT_LOGGING = process.env.DB_POOL_EVENT_LOGGING === "true";

const connectionString =
  process.env.DATABASE_PRIMARY_POOLER_URL ?? process.env.DATABASE_PRIMARY_URL;

if (!connectionString) {
  throw new Error(
    "Missing database connection string: set DATABASE_PRIMARY_POOLER_URL or DATABASE_PRIMARY_URL",
  );
}

/**
 * Worker database client with connection pool optimized for BullMQ concurrent jobs
 */
const workerPool = new Pool({
  connectionString,
  max: isDevelopment ? 10 : 50,
  idleTimeoutMillis: isDevelopment ? 5000 : 60000,
  connectionTimeoutMillis: 15000,
  maxUses: isDevelopment ? 200 : 3000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10_000,
  ssl: isDevelopment ? false : { rejectUnauthorized: false },
  allowExitOnIdle: true,
});

function getPgErrorDetails(error: unknown) {
  const details: Record<string, unknown> = {};

  if (error && typeof error === "object") {
    const err = error as Record<string, unknown>;
    const fields = [
      "name",
      "message",
      "code",
      "errno",
      "syscall",
      "address",
      "port",
      "stack",
    ];

    for (const field of fields) {
      if (err[field] !== undefined) {
        details[field] = err[field];
      }
    }
  } else {
    details.message = String(error);
  }

  return details;
}

function getPoolStatsSnapshot() {
  return {
    total: workerPool.totalCount,
    idle: workerPool.idleCount,
    waiting: workerPool.waitingCount,
  };
}

workerPool.on("error", (err) => {
  logger.error("Worker pool: idle client error", {
    ...getPgErrorDetails(err),
    stats: getPoolStatsSnapshot(),
  });
});

if (DB_POOL_EVENT_LOGGING) {
  workerPool.on("connect", () => {
    logger.info("Worker pool: client connected", {
      stats: getPoolStatsSnapshot(),
    });
  });

  workerPool.on("acquire", () => {
    logger.info("Worker pool: client acquired", {
      stats: getPoolStatsSnapshot(),
    });
  });

  workerPool.on("remove", () => {
    logger.info("Worker pool: client removed", {
      stats: getPoolStatsSnapshot(),
    });
  });
}

const workerDb = drizzle(workerPool, {
  schema,
  casing: "snake_case",
});

/**
 * Get the shared worker database instance
 */
export const getWorkerDb = (): Database => {
  return workerDb as Database;
};

export const getWorkerPoolStats = () => {
  return getPoolStatsSnapshot();
};

/**
 * Cleanup function to close database connections gracefully
 */
export const closeWorkerDb = async (): Promise<void> => {
  await workerPool.end();
};
