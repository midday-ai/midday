import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import type { Database } from "../../client";
import { withReplicas } from "../../replicas";
import * as schema from "../../schema";

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  "postgres://postgres:postgres@localhost:5433/midday_test";

let pool: Pool | null = null;
let db: Database | null = null;

export function getTestDatabase(): Database {
  if (db) return db;

  pool = new Pool({
    connectionString: TEST_DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 5000,
    connectionTimeoutMillis: 10000,
  });

  const primaryDb = drizzle(pool, {
    schema,
    casing: "snake_case",
  });

  db = withReplicas(primaryDb, [primaryDb], (replicas) => replicas[0]!);
  return db;
}

export async function cleanDatabase(): Promise<void> {
  const database = getTestDatabase();
  await database.execute(sql`
    TRUNCATE 
      transactions,
      transaction_categories,
      exchange_rates,
      bank_accounts,
      bank_connections,
      invoices,
      invoice_recurring,
      tracker_entries,
      tracker_projects,
      inbox,
      reports,
      teams,
      users
    CASCADE
  `);
}

export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    db = null;
  }
}

export function isTestDatabaseAvailable(): boolean {
  return !!process.env.TEST_DATABASE_URL;
}
