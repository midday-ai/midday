import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import type { Database } from "./client";
import * as schema from "./schema";

const isDevelopment = process.env.NODE_ENV === "development";

/**
 * Creates a new job-optimized database instance.
 *
 * - Single connection per job (max: 1) to avoid flooding Supabase pooler
 * - Separate disconnect function for lifecycle management
 */
export const createJobDb = () => {
  const jobPool = new Pool({
    connectionString: process.env.DATABASE_PRIMARY_POOLER_URL!,
    max: 1,
    idleTimeoutMillis: isDevelopment ? 5000 : 60000,
    connectionTimeoutMillis: 15000,
    maxUses: 0,
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
