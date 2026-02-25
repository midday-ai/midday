import { createLoggerWithContext } from "@midday/logger";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import type { Database } from "./client";
import * as schema from "./schema";

const isDevelopment = process.env.NODE_ENV === "development";
const logger = createLoggerWithContext("db:worker");

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

workerPool.on("error", (err) => {
  logger.error("Worker pool: idle client error", {
    error: err.message,
    code: (err as { code?: string }).code,
  });
});

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
  return {
    total: workerPool.totalCount,
    idle: workerPool.idleCount,
    waiting: workerPool.waitingCount,
  };
};

/**
 * Cleanup function to close database connections gracefully
 */
export const closeWorkerDb = async (): Promise<void> => {
  await workerPool.end();
};
