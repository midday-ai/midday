import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { withReplicas } from "./replicas";
import * as schema from "./schema";

// Optimized connection configuration for stateful Fly VMs (3 instances)
const connectionConfig = {
  prepare: false,
  max: 2, // Very conservative - 2 connections per pool per VM
  idle_timeout: 90, // fewer disconnects
  max_lifetime: 0, // disable forced recycling
  connect_timeout: 10, // Quick connection timeout
};

const primaryPool = postgres(
  process.env.DATABASE_PRIMARY_URL!,
  connectionConfig,
);

const fraPool = postgres(process.env.DATABASE_FRA_URL!, connectionConfig);
const sjcPool = postgres(process.env.DATABASE_SJC_URL!, connectionConfig);
const iadPool = postgres(process.env.DATABASE_IAD_URL!, connectionConfig);

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
