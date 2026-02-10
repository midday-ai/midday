import type { ExtractTablesWithRelations } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import type { NodePgQueryResultHKT } from "drizzle-orm/node-postgres";
import type { PgTransaction } from "drizzle-orm/pg-core";
import { Pool } from "pg";
import { withReplicas } from "./replicas";
import * as schema from "./schema";

const isDevelopment = process.env.NODE_ENV === "development";

const connectionConfig = {
  max: isDevelopment ? 8 : 12,
  idleTimeoutMillis: isDevelopment ? 5000 : 60000,
  connectionTimeoutMillis: 15000,
  maxUses: isDevelopment ? 100 : 0,
  allowExitOnIdle: true,
  ssl: isDevelopment ? false : { rejectUnauthorized: false },
};

// Drizzle query cache (Railway Redis, private network)
// Uses explicit strategy — only queries with .$withCache() are cached.
// Mutations auto-invalidate cached queries for affected tables.
let cacheInstance: any;

try {
  const { BunRedisCache } = require("@midday/cache/drizzle-cache");
  cacheInstance = new BunRedisCache();
} catch {
  // Cache unavailable (non-Bun runtime or missing dependency)
}

// Primary pool — DATABASE_PRIMARY_URL should point to the Supabase pooler
const primaryPool = new Pool({
  connectionString: process.env.DATABASE_PRIMARY_URL!,
  ...connectionConfig,
});

export const primaryDb = drizzle(primaryPool, {
  schema,
  casing: "snake_case",
  ...(cacheInstance ? { cache: cacheInstance } : {}),
});

// Map Railway region → replica URL (only create the pool this instance needs)
const replicaUrlForRegion: Record<string, string | undefined> = {
  "europe-west4-drams3a": process.env.DATABASE_FRA_URL,
  "us-east4-eqdc4a": process.env.DATABASE_IAD_URL,
  "us-west2": process.env.DATABASE_SJC_URL,
};

const currentRegion = process.env.RAILWAY_REPLICA_REGION;
const replicaUrl = currentRegion
  ? replicaUrlForRegion[currentRegion]
  : undefined;

// Only create ONE replica pool for the current region, fall back to primary
const replicaDb = replicaUrl
  ? drizzle(new Pool({ connectionString: replicaUrl, ...connectionConfig }), {
      schema,
      casing: "snake_case",
      ...(cacheInstance ? { cache: cacheInstance } : {}),
    })
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
