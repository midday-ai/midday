import { createLoggerWithContext } from "@midday/logger";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { PgTransaction } from "drizzle-orm/pg-core";
import type { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { createDrizzleLogger } from "./instrument";
import { withReplicas } from "./replicas";
import * as schema from "./schema";

const logger = createLoggerWithContext("db");

const isDevelopment = process.env.NODE_ENV === "development";
const isProduction = process.env.RAILWAY_ENVIRONMENT_NAME === "production";
const DEBUG_PERF = process.env.DEBUG_PERF === "true";

const connectionConfig = {
  max: isDevelopment ? 8 : isProduction ? 40 : 6,
  idle_timeout: isDevelopment ? 5 : isProduction ? 30 : 10,
  connect_timeout: 5,
  ssl: isDevelopment ? false : { rejectUnauthorized: false },
  prepare: false, // Required for Supabase transaction-mode pooler
};

const drizzleLogger = DEBUG_PERF ? createDrizzleLogger() : undefined;

// Primary — DATABASE_PRIMARY_URL
const primaryClient = postgres(process.env.DATABASE_PRIMARY_URL!, {
  ...connectionConfig,
});

export const primaryDb = drizzle(primaryClient, {
  schema,
  casing: "snake_case",
  logger: drizzleLogger,
});

/**
 * Map Railway region → replica URL
 */
const replicaUrlForRegion: Record<string, string | undefined> = {
  "europe-west4-drams3a": process.env.DATABASE_FRA_URL,
  "us-east4-eqdc4a": process.env.DATABASE_IAD_URL,
  "us-west2": process.env.DATABASE_SJC_URL,
};

const currentRegion = process.env.RAILWAY_REPLICA_REGION;
const rawReplicaUrl = currentRegion
  ? replicaUrlForRegion[currentRegion]
  : undefined;

const replicaUrl =
  rawReplicaUrl && rawReplicaUrl !== process.env.DATABASE_PRIMARY_URL
    ? rawReplicaUrl
    : undefined;

if (!isDevelopment) {
  if (!currentRegion) {
    logger.warn(
      "RAILWAY_REPLICA_REGION not set — all reads will use the primary database",
    );
  } else if (!rawReplicaUrl) {
    logger.warn(
      `RAILWAY_REPLICA_REGION="${currentRegion}" but no matching DATABASE_*_URL found — falling back to primary`,
    );
  } else if (!replicaUrl) {
    logger.info(
      `Region "${currentRegion}" replica URL matches primary — sharing pool`,
    );
  }
}

const replicaClient = replicaUrl
  ? postgres(replicaUrl, { ...connectionConfig })
  : null;

const replicaDb = replicaClient
  ? drizzle(replicaClient, {
      schema,
      casing: "snake_case",
      logger: drizzleLogger,
    })
  : primaryDb;

export const db = withReplicas(
  primaryDb,
  [replicaDb],
  (replicas) => replicas[0]!,
);

export const connectDb = async () => {
  return db;
};

export type Database = Awaited<ReturnType<typeof connectDb>>;

export type TransactionClient = PgTransaction<
  PostgresJsQueryResultHKT,
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
 * Pool stats — postgres.js does not expose pool stats like pg.
 * Returns placeholder for compatibility with health/DEBUG_PERF logging.
 */
export function getPoolStats() {
  return {
    primary: {
      total: 0,
      idle: 0,
      waiting: 0,
    },
    replica: replicaClient
      ? {
          total: 0,
          idle: 0,
          waiting: 0,
        }
      : null,
  };
}

/**
 * Close all database connections gracefully
 */
export const closeDb = async (): Promise<void> => {
  await Promise.all([
    primaryClient.end(),
    replicaClient ? replicaClient.end() : Promise.resolve(),
  ]);
};
