import { resolve } from "node:path";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Client } from "pg";
import {
  assertLocalMigrationMode,
  assertLocalMigrationTarget,
} from "./migration-target";
import { getSslConfig } from "./ssl";

const LOCK_KEY = 907_907;

export async function runMigrations(
  connectionString = process.env.DATABASE_MIGRATION_URL ??
    process.env.DATABASE_PRIMARY_URL,
) {
  assertLocalMigrationMode();
  if (!connectionString) {
    throw new Error("Set DATABASE_MIGRATION_URL or DATABASE_PRIMARY_URL");
  }
  const client = new Client({ connectionString, ssl: getSslConfig() });
  await client.connect();
  try {
    await assertLocalMigrationTarget(client);
    await client.query("SELECT pg_advisory_lock($1)", [LOCK_KEY]);
    await migrate(drizzle(client), {
      migrationsFolder: resolve(__dirname, "../migrations"),
      migrationsSchema: "drizzle",
      migrationsTable: "__drizzle_migrations",
    });
  } finally {
    await client
      .query("SELECT pg_advisory_unlock($1)", [LOCK_KEY])
      .catch(() => {});
    await client.end();
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log("migrations applied");
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
