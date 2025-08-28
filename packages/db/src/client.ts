import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { withReplicas } from "./replicas";
import * as schema from "./schema";

// Optimized connection configuration for stateful Fly VMs (3 instances)
const connectionConfig = {
  prepare: false,
  max: 10, // Connection pool size per VM
  idle_timeout: 20, // Close idle connections after 20 seconds
  max_lifetime: 60 * 30, // 30 minutes - prevent long-lived connection issues
  connect_timeout: 10, // 10 second connection timeout
  connection_timeout_millis: 10000, // Alternative timeout format
  // Add error handling
  onnotice: (notice: any) => {
    console.warn("[DB Notice]", notice);
  },
  // Connection validation
  connection: {
    application_name: `midday-api-${process.env.FLY_REGION || "local"}`,
  },
};

const primaryPool = postgres(
  process.env.DATABASE_PRIMARY_URL!,
  connectionConfig,
);

const fraPool = postgres(process.env.DATABASE_FRA_URL!, connectionConfig);
const sjcPool = postgres(process.env.DATABASE_SJC_URL!, connectionConfig);
const iadPool = postgres(process.env.DATABASE_IAD_URL!, connectionConfig);

// Add error handling for connection pools
[primaryPool, fraPool, sjcPool, iadPool].forEach((pool, index) => {
  const poolName = ["primary", "fra", "sjc", "iad"][index];

  // Handle connection errors
  pool.listen("error", (error: any) => {
    const isErrorObject =
      error && typeof error === "object" && "message" in error;
    console.error(`[DB Pool Error - ${poolName}]:`, {
      error: isErrorObject ? (error as Error).message : String(error),
      stack: isErrorObject ? (error as Error).stack : undefined,
      timestamp: new Date().toISOString(),
    });
  });

  // Handle notices (including timeout warnings)
  pool.listen("notice", (notice) => {
    console.warn(`[DB Pool Notice - ${poolName}]:`, notice);
  });
});

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

export const connectDb = async () => {
  const replicaIndex = getReplicaIndexForRegion();

  return withReplicas(
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
};

export type Database = Awaited<ReturnType<typeof connectDb>>;

export type DatabaseWithPrimary = Database & {
  $primary?: Database;
  usePrimaryOnly?: () => Database;
};
