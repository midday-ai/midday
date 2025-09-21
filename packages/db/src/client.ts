import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { withReplicas } from "./replicas";
import * as schema from "./schema";

// Optimized connection configuration for stateful Fly VMs (3 instances)
const isDevelopment = process.env.NODE_ENV === "development";

const connectionConfig = {
  prepare: false,
  max: isDevelopment ? 3 : 4, // CONSERVATIVE: 2→4 for production (was 8)
  idle_timeout: isDevelopment ? 30 : 90, // Keep longer timeout in prod
  max_lifetime: isDevelopment ? 60 * 2 : 0, // Keep infinite lifetime in prod initially
  connect_timeout: 15, // Longer timeout for better reliability
  // Enhanced connection lifecycle logging
  onnotice: (notice: any) => {
    console.log("🔔 DB Notice:", notice);
  },
  onconnect: (connection: any) => {
    console.log("🔗 Connection opened:", {
      processID: connection.processID,
      timestamp: new Date().toISOString(),
      stack: new Error().stack?.split("\n").slice(1, 4).join("\n"), // Show call stack
    });
  },
  onclose: (connection: any) => {
    console.log("🔒 Connection closed:", {
      processID: connection.processID,
      timestamp: new Date().toISOString(),
    });
  },
  debug:
    process.env.NODE_ENV === "development"
      ? (connection: any, query: string) => {
          if (
            query.includes("SELECT") ||
            query.includes("INSERT") ||
            query.includes("UPDATE")
          ) {
            console.log("🔍 Query executed:", {
              processID: connection.processID,
              query:
                query.substring(0, 100) + (query.length > 100 ? "..." : ""),
              timestamp: new Date().toISOString(),
            });
          }
        }
      : undefined,
};

const primaryPool = postgres(
  process.env.DATABASE_PRIMARY_URL!,
  connectionConfig,
);

const fraPool = postgres(process.env.DATABASE_FRA_URL!, connectionConfig);
const sjcPool = postgres(process.env.DATABASE_SJC_URL!, connectionConfig);
const iadPool = postgres(process.env.DATABASE_IAD_URL!, connectionConfig);

// Connection pool monitoring function
export const getConnectionPoolStats = () => {
  const getPoolStats = (pool: any, name: string) => {
    try {
      return {
        name,
        total: pool.options?.max || 0,
        idle: pool.idle?.length || 0,
        active: (pool.options?.max || 0) - (pool.idle?.length || 0),
        waiting: pool.waiting?.length || 0,
        ended: pool.ended || false,
      };
    } catch (error) {
      return {
        name,
        error: error instanceof Error ? error.message : String(error),
        total: 0,
        idle: 0,
        active: 0,
        waiting: 0,
        ended: true,
      };
    }
  };

  // Only include pools that are actually being used
  const pools: Record<string, any> = {
    primary: getPoolStats(primaryPool, "primary"),
  };

  // Only add replica pools if they're configured
  if (hasReplicas) {
    pools.fra = getPoolStats(fraPool, "fra");
    pools.sjc = getPoolStats(sjcPool, "sjc");
    pools.iad = getPoolStats(iadPool, "iad");
  }

  const poolArray = Object.values(pools);
  const totalActive = poolArray.reduce(
    (sum: number, pool: any) => sum + (pool.active || 0),
    0,
  );
  const totalWaiting = poolArray.reduce(
    (sum: number, pool: any) => sum + (pool.waiting || 0),
    0,
  );
  const hasExhaustedPools = poolArray.some(
    (pool: any) =>
      (pool.active || 0) >= (pool.total || 0) || (pool.waiting || 0) > 0,
  );

  const connectionsPerPool = isDevelopment ? 3 : 4; // Match the actual config
  const totalConnections = hasReplicas
    ? connectionsPerPool * 4
    : connectionsPerPool;

  return {
    timestamp: new Date().toISOString(),
    region: process.env.FLY_REGION || "unknown",
    instance: process.env.FLY_ALLOC_ID || "local",
    pools,
    summary: {
      totalConnections,
      totalActive,
      totalWaiting,
      hasExhaustedPools,
      utilizationPercent: Math.round((totalActive / totalConnections) * 100),
    },
  };
};

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

// For local development, check if we have replica URLs configured
const hasReplicas =
  process.env.DATABASE_FRA_URL &&
  process.env.DATABASE_SJC_URL &&
  process.env.DATABASE_IAD_URL;

export const db = hasReplicas
  ? withReplicas(
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
    )
  : withReplicas(primaryDb, [primaryDb], () => primaryDb); // Always use replicated wrapper for consistent API

// Keep connectDb for backward compatibility, but just return the singleton
export const connectDb = async () => {
  console.log("🔌 Using singleton DB instance");
  return db;
};

// Start periodic monitoring in development
if (process.env.NODE_ENV === "development") {
  console.log("🔍 Starting connection monitoring in development mode");

  setInterval(() => {
    const stats = getConnectionPoolStats();
    const primary = stats.pools.primary;

    // Alert if more than half connections are active
    const halfThreshold = Math.floor(primary.total / 2);
    if (primary.active > halfThreshold) {
      console.warn("⚠️  High connection usage:", {
        active: primary.active,
        idle: primary.idle,
        total: primary.total,
        threshold: halfThreshold,
        utilization: `${Math.round((primary.active / primary.total) * 100)}%`,
      });
    }
  }, 10000); // Every 10 seconds
}

export type Database = Awaited<ReturnType<typeof connectDb>>;

export type DatabaseWithPrimary = Database & {
  $primary?: Database;
  usePrimaryOnly?: () => Database;
};
