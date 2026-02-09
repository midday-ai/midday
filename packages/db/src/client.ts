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

// Supabase dedicated pooler (db.*.supabase.co:6543) requires IPv6
// Supabase shared pooler (*.pooler.supabase.com) works with IPv4
// Use family: 6 for dedicated pooler URLs, family: 0 (auto) for pooler URLs
const isDirectSupabase = (url?: string) =>
  url?.includes("db.") && url?.includes("supabase.co");

const primaryPool = new Pool({
  connectionString: process.env.DATABASE_PRIMARY_URL!,
  ...connectionConfig,
});

const fraPool = new Pool({
  connectionString: process.env.DATABASE_FRA_URL!,
  ...connectionConfig,
  ...(isDirectSupabase(process.env.DATABASE_FRA_URL) && { family: 6 }),
});

const sjcPool = new Pool({
  connectionString: process.env.DATABASE_SJC_URL!,
  ...connectionConfig,
  ...(isDirectSupabase(process.env.DATABASE_SJC_URL) && { family: 6 }),
});

const iadPool = new Pool({
  connectionString: process.env.DATABASE_IAD_URL!,
  ...connectionConfig,
  ...(isDirectSupabase(process.env.DATABASE_IAD_URL) && { family: 6 }),
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
  switch (process.env.RAILWAY_REPLICA_REGION) {
    case "europe-west4-drams3a":
      return 0; // fra replica
    case "us-east4-eqdc4a":
      return 1; // iad replica
    case "us-west2":
      return 2; // sjc replica
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
