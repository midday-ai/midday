import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import type { Database } from "./client";
import * as schema from "./schema";

const isDevelopment = process.env.NODE_ENV === "development";

/**
 * Creates a new job-optimized database instance.
 * Uses postgres.js with prepare: false for Supabase transaction-mode pooler compatibility.
 *
 * - Single connection per job (max: 1) to avoid flooding Supabase pooler
 * - Separate disconnect function for lifecycle management
 */
export const createJobDb = () => {
  const jobClient = postgres(process.env.DATABASE_PRIMARY_POOLER_URL!, {
    max: 1,
    idle_timeout: isDevelopment ? 5 : 60,
    connect_timeout: 15,
    ssl: isDevelopment ? false : { rejectUnauthorized: false },
    prepare: false,
  });

  const db = drizzle(jobClient, {
    schema,
    casing: "snake_case",
  });

  return {
    db: db as unknown as Database,
    disconnect: () => jobClient.end(),
  };
};
