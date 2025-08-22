import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import type { Database } from "./client";
import * as schema from "./schema";

/**
 * Creates a new job-optimized database instance with its own connection pool.
 *
 * Each instance is designed for job workflows with:
 * - Single connection per job (max: 1) to avoid flooding Supabase pooler
 * - Quick idle timeout (10s) for efficient connection management
 * - Separate disconnect function for lifecycle management
 */
export const createJobDb = () => {
  const jobPool = postgres(process.env.DATABASE_PRIMARY_POOLER_URL!, {
    prepare: false,
    max: 1, // Critical: only 1 connection per job to avoid flooding Supabase pooler
    idle_timeout: 10, // Free idle clients very quickly (10 seconds)
    max_lifetime: 60 * 30, // Close connections after 30 minutes
    connect_timeout: 10, // 10 second connection timeout
  });

  const db = drizzle(jobPool, {
    schema,
    casing: "snake_case",
  });

  return {
    db: db as Database,
    disconnect: () => jobPool.end(),
  };
};
