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
  // Statement timeout to prevent long-running queries from blocking connections
  statement_timeout: 30000, // 30 seconds
};

// Helper to set up pool error handling
const setupPoolErrorHandling = (pool: Pool, name: string) => {
  pool.on("error", (err) => {
    console.error(`[DB Pool ${name}] Unexpected error:`, err.message);
  });

  pool.on("connect", (client) => {
    // Set statement timeout on each new connection
    client.query("SET statement_timeout = '30s'").catch(() => {
      // Ignore errors - some poolers don't support this
    });
  });

  return pool;
};

const primaryPool = setupPoolErrorHandling(
  new Pool({
    connectionString: process.env.DATABASE_PRIMARY_URL!,
    ...connectionConfig,
  }),
  "primary",
);

const fraPool = setupPoolErrorHandling(
  new Pool({
    connectionString: process.env.DATABASE_FRA_URL!,
    ...connectionConfig,
  }),
  "fra",
);

const sjcPool = setupPoolErrorHandling(
  new Pool({
    connectionString: process.env.DATABASE_SJC_URL!,
    ...connectionConfig,
  }),
  "sjc",
);

const iadPool = setupPoolErrorHandling(
  new Pool({
    connectionString: process.env.DATABASE_IAD_URL!,
    ...connectionConfig,
  }),
  "iad",
);

export const primaryDb = drizzle(primaryPool, {
  schema,
  casing: "snake_case",
});

const getReplicaIndexForRegion = () => {
  switch (process.env.FLY_REGION) {
    case "fra":
      return 0;
    case "iad":
      return 1;
    case "sjc":
      return 2;
    default:
      return 0;
  }
};

// Create the database instance once and export it
const replicaIndex = getReplicaIndexForRegion();

export const db = withReplicas(
  primaryDb,
  [
    // Order of replicas is important
    drizzle(fraPool, {
      schema,
      casing: "snake_case",
    }),
    drizzle(iadPool, {
      schema,
      casing: "snake_case",
    }),
    drizzle(sjcPool, {
      schema,
      casing: "snake_case",
    }),
  ],
  (replicas) => replicas[replicaIndex]!,
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

// Health check and pool stats for monitoring
export const dbHealthCheck = async () => {
  const checkPool = async (pool: Pool, name: string) => {
    const start = Date.now();
    try {
      const client = await pool.connect();
      await client.query("SELECT 1");
      client.release();
      return {
        name,
        healthy: true,
        latencyMs: Date.now() - start,
        totalConnections: pool.totalCount,
        idleConnections: pool.idleCount,
        waitingRequests: pool.waitingCount,
      };
    } catch (error) {
      return {
        name,
        healthy: false,
        latencyMs: Date.now() - start,
        error: error instanceof Error ? error.message : "Unknown error",
        totalConnections: pool.totalCount,
        idleConnections: pool.idleCount,
        waitingRequests: pool.waitingCount,
      };
    }
  };

  const [primary, fra, sjc, iad] = await Promise.all([
    checkPool(primaryPool, "primary"),
    checkPool(fraPool, "fra"),
    checkPool(sjcPool, "sjc"),
    checkPool(iadPool, "iad"),
  ]);

  return {
    primary,
    replicas: { fra, sjc, iad },
    currentRegion: process.env.FLY_REGION || "unknown",
    activeReplicaIndex: replicaIndex,
  };
};

// Get pool stats without health check (faster, no query)
export const getPoolStats = () => ({
  primary: {
    total: primaryPool.totalCount,
    idle: primaryPool.idleCount,
    waiting: primaryPool.waitingCount,
  },
  replicas: {
    fra: {
      total: fraPool.totalCount,
      idle: fraPool.idleCount,
      waiting: fraPool.waitingCount,
    },
    sjc: {
      total: sjcPool.totalCount,
      idle: sjcPool.idleCount,
      waiting: sjcPool.waitingCount,
    },
    iad: {
      total: iadPool.totalCount,
      idle: iadPool.idleCount,
      waiting: iadPool.waitingCount,
    },
  },
  currentRegion: process.env.FLY_REGION || "unknown",
});
