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
};

const primaryPool = new Pool({
  connectionString: process.env.DATABASE_PRIMARY_URL!,
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
  prepare: false, // Required for Supabase Session Pooler (PgBouncer transaction mode)
});

// Only create replica pools if all replica URLs are available
const createReplicaDb = () => {
  if (!hasReplicas) {
    // In development or when replicas aren't configured, use primary for everything
    // but still provide the executeOnReplica method for compatibility
    const executeOnReplica = async <
      TRow extends Record<string, unknown> = Record<string, unknown>,
    >(
      query: string | ReturnType<typeof import("drizzle-orm").sql>,
    ): Promise<TRow[]> => {
      const result = await primaryDb.execute(query);
      if (Array.isArray(result)) {
        return result as TRow[];
      }
      return (result as { rows: TRow[] }).rows;
    };

    return {
      ...primaryDb,
      executeOnReplica,
      transactionOnReplica: primaryDb.transaction,
      usePrimaryOnly: () => primaryDb,
      $primary: primaryDb,
    } as ReturnType<typeof withReplicas>;
  }

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

  const replicaIndex = getReplicaIndexForRegion();

  return withReplicas(
    primaryDb,
    [
      // Order of replicas is important
      drizzle(fraPool, {
        schema,
        casing: "snake_case",
        prepare: false, // Required for Supabase Session Pooler (PgBouncer transaction mode)
      }),
      drizzle(iadPool, {
        schema,
        casing: "snake_case",
        prepare: false, // Required for Supabase Session Pooler (PgBouncer transaction mode)
      }),
      drizzle(sjcPool, {
        schema,
        casing: "snake_case",
        prepare: false, // Required for Supabase Session Pooler (PgBouncer transaction mode)
      }),
    ],
    (replicas) => replicas[replicaIndex]!,
  );
};

// Create the database instance once and export it
export const db = createReplicaDb();

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
