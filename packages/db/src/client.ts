import { createLoggerWithContext } from "@midday/logger";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { NodePgQueryResultHKT } from "drizzle-orm/node-postgres";
import { drizzle } from "drizzle-orm/node-postgres";
import type { PgTransaction } from "drizzle-orm/pg-core";
import { Pool } from "pg";
import { createDrizzleLogger, instrumentPool } from "./instrument";
import { withReplicas } from "./replicas";
import * as schema from "./schema";

const logger = createLoggerWithContext("db");

const isDevelopment = process.env.NODE_ENV === "development";
const isProduction = process.env.RAILWAY_ENVIRONMENT_NAME === "production";
const DEBUG_PERF = process.env.DEBUG_PERF === "true";

const connectionConfig = {
  max: isDevelopment ? 8 : isProduction ? 40 : 6,
  min: isDevelopment ? 0 : isProduction ? 8 : 1,
  idleTimeoutMillis: isDevelopment ? 5000 : isProduction ? 30000 : 10000,
  connectionTimeoutMillis: 5000,
  maxUses: isDevelopment ? 100 : 7500,
  allowExitOnIdle: !isProduction,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10_000,
  ssl: isDevelopment ? false : { rejectUnauthorized: false },
};

const drizzleLogger = DEBUG_PERF ? createDrizzleLogger() : undefined;

// Primary pool — DATABASE_PRIMARY_URL
const primaryPool = new Pool({
  connectionString: process.env.DATABASE_PRIMARY_URL!,
  ...connectionConfig,
});

if (DEBUG_PERF) instrumentPool(primaryPool, "primary");

primaryPool.on("error", (err) => {
  logger.error("Primary pool: idle client error", { error: err.message });
});

export const primaryDb = drizzle(primaryPool, {
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

const replicaPool = replicaUrl
  ? new Pool({ connectionString: replicaUrl, ...connectionConfig })
  : null;

if (DEBUG_PERF && replicaPool) instrumentPool(replicaPool, "replica");

replicaPool?.on("error", (err) => {
  logger.error("Replica pool: idle client error", { error: err.message });
});

const replicaDb = replicaPool
  ? drizzle(replicaPool, {
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

export function getPoolStats() {
  return {
    primary: {
      total: primaryPool.totalCount,
      idle: primaryPool.idleCount,
      waiting: primaryPool.waitingCount,
    },
    replica: replicaPool
      ? {
          total: replicaPool.totalCount,
          idle: replicaPool.idleCount,
          waiting: replicaPool.waitingCount,
        }
      : null,
  };
}

/**
 * Close all database pools gracefully
 */
export const closeDb = async (): Promise<void> => {
  await Promise.all([primaryPool.end(), replicaPool?.end()]);
};
