import { drizzle } from "drizzle-orm/node-postgres";
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
};

const primaryPool = new Pool({
  connectionString: process.env.DATABASE_PRIMARY_URL!,
  ...connectionConfig,
});

const fraPool = new Pool({
  connectionString: process.env.DATABASE_FRA_URL!,
  ...connectionConfig,
});

const sjcPool = new Pool({
  connectionString: process.env.DATABASE_SJC_URL!,
  ...connectionConfig,
});

const iadPool = new Pool({
  connectionString: process.env.DATABASE_IAD_URL!,
  ...connectionConfig,
});

const hasReplicas = Boolean(
  process.env.DATABASE_FRA_URL &&
    process.env.DATABASE_SJC_URL &&
    process.env.DATABASE_IAD_URL,
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

export type DatabaseWithPrimary = Database & {
  $primary?: Database;
  usePrimaryOnly?: () => Database;
};
