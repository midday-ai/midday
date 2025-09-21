import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
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
  const jobPool = new Pool({
    connectionString: process.env.DATABASE_PRIMARY_URL!,
    max: 1, // Critical: only 1 connection per job to avoid flooding Supabase pooler
    idleTimeoutMillis: 10000, // Free idle clients very quickly (10 seconds)
    connectionTimeoutMillis: 10000, // 10 second connection timeout
    maxUses: 0, // No limit on connection reuse for jobs
    allowExitOnIdle: true,
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
