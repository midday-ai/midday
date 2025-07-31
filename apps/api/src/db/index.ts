import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { withReplicas } from "./replicas";
import * as schema from "./schema";

const primaryPool = postgres(process.env.DATABASE_PRIMARY_URL!, {
  prepare: false,
  max: 10, // Limit primary connections
  idle_timeout: 30, // Keep connections alive longer
  connect_timeout: 5, // Fail faster on connection issues
  max_lifetime: 60 * 10, // Cycle connections every 10 minutes
});

const poolConfig = {
  prepare: false,
  max: 5, // Lower for replicas
  idle_timeout: 20, // Shorter timeout
  connect_timeout: 5, // Same as primary
  max_lifetime: 60 * 10, // Same as primary
};

const fraPool = postgres(process.env.DATABASE_FRA_URL!, poolConfig);
const sjcPool = postgres(process.env.DATABASE_SJC_URL!, poolConfig);
const iadPool = postgres(process.env.DATABASE_IAD_URL!, poolConfig);

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
