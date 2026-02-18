import { createLoggerWithContext } from "@midday/logger";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { NodePgQueryResultHKT } from "drizzle-orm/node-postgres";
import { drizzle } from "drizzle-orm/node-postgres";
import type { PgTransaction } from "drizzle-orm/pg-core";
import { Pool } from "pg";
import { withReplicas } from "./replicas";
import * as schema from "./schema";

const logger = createLoggerWithContext("db");

const isDevelopment = process.env.NODE_ENV === "development";

const connectionConfig = {
  max: isDevelopment ? 8 : 12,
  idleTimeoutMillis: isDevelopment ? 5000 : 60000,
  connectionTimeoutMillis: 5000,
  maxUses: isDevelopment ? 100 : 0,
  allowExitOnIdle: true,
  ssl: isDevelopment ? false : { rejectUnauthorized: false },
};

// Primary pool — DATABASE_PRIMARY_URL should point to the Supabase pooler
const primaryPool = new Pool({
  connectionString: process.env.DATABASE_PRIMARY_URL!,
  ...connectionConfig,
});

export const primaryDb = drizzle(primaryPool, {
  schema,
  casing: "snake_case",
});

/**
 * Map Railway region → replica URL (only create the pool this instance needs).
 *
 * RAILWAY_REPLICA_REGION is a system-provided variable injected at runtime
 * by Railway for every deployment (see https://docs.railway.com/variables/reference).
 */
const replicaUrlForRegion: Record<string, string | undefined> = {
  "europe-west4-drams3a": process.env.DATABASE_FRA_URL,
  "us-east4-eqdc4a": process.env.DATABASE_IAD_URL,
  "us-west2": process.env.DATABASE_SJC_URL,
};

const currentRegion = process.env.RAILWAY_REPLICA_REGION;
const replicaUrl = currentRegion
  ? replicaUrlForRegion[currentRegion]
  : undefined;

if (!isDevelopment) {
  if (!currentRegion) {
    logger.warn(
      "RAILWAY_REPLICA_REGION not set — all reads will use the primary database",
    );
  } else if (!replicaUrl) {
    logger.warn(
      `RAILWAY_REPLICA_REGION="${currentRegion}" but no matching DATABASE_*_URL found — falling back to primary`,
    );
  }
}

// Only create ONE replica pool for the current region, fall back to primary
const replicaPool = replicaUrl
  ? new Pool({ connectionString: replicaUrl, ...connectionConfig })
  : null;

const replicaDb = replicaPool
  ? drizzle(replicaPool, { schema, casing: "snake_case" })
  : primaryDb;

export const db = withReplicas(
  primaryDb,
  [replicaDb],
  (replicas) => replicas[0]!,
);

// Keep connectDb for backward compatibility, but just return the singleton
export const connectDb = async () => {
  return db;
};

export type Database = Awaited<ReturnType<typeof connectDb>>;

export type TransactionClient = PgTransaction<
  NodePgQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

/** Use in query functions that should work both standalone and within transactions */
export type DatabaseOrTransaction = Database | TransactionClient;

export type DatabaseWithPrimary = Database & {
  $primary?: Database;
  usePrimaryOnly?: () => Database;
};

/**
 * Close all database pools gracefully.
 * Call during process shutdown to release connections cleanly.
 */
export const closeDb = async (): Promise<void> => {
  await Promise.all([primaryPool.end(), replicaPool?.end()]);
};
