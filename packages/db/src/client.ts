import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { withReplicas } from "./replicas";
import * as schema from "./schema";

const primaryPool = postgres(process.env.DATABASE_PRIMARY_URL!, {
  prepare: false,
});

const fraPool = postgres(process.env.DATABASE_FRA_URL!, {
  prepare: false,
});

const sjcPool = postgres(process.env.DATABASE_SJC_URL!, {
  prepare: false,
});

const iadPool = postgres(process.env.DATABASE_IAD_URL!, {
  prepare: false,
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
