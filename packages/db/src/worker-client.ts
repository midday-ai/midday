import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import type { Database } from "./client";
import * as schema from "./schema";

const isDevelopment = process.env.NODE_ENV === "development";

/**
 * Worker database client using postgres.js with prepare: false.
 * Required for Supabase Dedicated Pooler in transaction mode (port 6543),
 * which does NOT support prepared statements.
 *
 * @see https://supabase.com/docs/guides/troubleshooting/disabling-prepared-statements
 */
const workerClient = postgres(process.env.DATABASE_PRIMARY_POOLER_URL!, {
  max: 100, // Sized for total worker concurrency (120 jobs) with buffer
  idle_timeout: isDevelopment ? 5 : 60,
  connect_timeout: 15,
  ssl: isDevelopment ? false : { rejectUnauthorized: false },
  prepare: false,
});

const workerDb = drizzle(workerClient, {
  schema,
  casing: "snake_case",
});

/**
 * Get the shared worker database instance
 */
export const getWorkerDb = (): Database => {
  return workerDb as unknown as Database;
};

/**
 * Cleanup function to close database connections gracefully
 */
export const closeWorkerDb = async (): Promise<void> => {
  await workerClient.end();
};
