import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import type { Database } from "./client";
import * as schema from "./schema";

const isDevelopment = process.env.NODE_ENV === "development";

/**
 * Worker database client with connection pool optimized for BullMQ concurrent jobs
 */
const workerPool = new Pool({
  connectionString: process.env.DATABASE_PRIMARY_POOLER_URL!,
  max: 100, // Sized for total worker concurrency (120 jobs) with buffer
  idleTimeoutMillis: isDevelopment ? 5000 : 60000, // Match main client config
  connectionTimeoutMillis: 15000, // Match main client config
  maxUses: 0, // No limit on connection reuse for long-lived worker
  allowExitOnIdle: true,
});

const workerDb = drizzle(workerPool, {
  schema,
  casing: "snake_case",
});

/**
 * Get the shared worker database instance
 * This is a singleton optimized for concurrent job processing
 */
export const getWorkerDb = (): Database => {
  return workerDb as Database;
};

/**
 * Cleanup function to close database connections gracefully
 * Should be called on worker shutdown
 */
export const closeWorkerDb = async (): Promise<void> => {
  await workerPool.end();
};
