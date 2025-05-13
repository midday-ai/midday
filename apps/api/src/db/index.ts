import { withReplicas } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const primaryPool = postgres(process.env.DATABASE_PRIMARY_URL!, {
  prepare: false,
});

const euPool = postgres(process.env.DATABASE_PRIMARY_URL!, { prepare: false });
const usPool = postgres(process.env.DATABASE_US_URL!, { prepare: false });
const saPool = postgres(process.env.DATABASE_SA_URL!, { prepare: false });

export const primaryDb = drizzle(primaryPool, { schema, casing: "snake_case" });

const getReplicaIndexForRegion = () => {
  switch (process.env.FLY_REGION) {
    case "fra":
      return 0;
    case "iad":
      return 1;
    case "gru":
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
      drizzle(euPool, { schema, casing: "snake_case" }),
      drizzle(usPool, { schema, casing: "snake_case" }),
      drizzle(saPool, { schema, casing: "snake_case" }),
    ],
    (replicas) => replicas[replicaIndex]!,
  );
};

export type Database = Awaited<ReturnType<typeof connectDb>>;
