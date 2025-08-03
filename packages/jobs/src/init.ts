import type { Database } from "@midday/db/client";
import { createJobDb } from "@midday/db/job-client";
import { locals, tasks } from "@trigger.dev/sdk";

// Store the database instance
const DbLocal = locals.create<{
  db: Database;
  disconnect: () => Promise<void>;
}>("db");

// Helper function to get the database instance from locals
export const getDb = (): Database => {
  const dbObj = locals.get(DbLocal);
  if (!dbObj) throw new Error("Database not initialized in middleware");
  return dbObj.db;
};

// Helper function to get the disconnect function from locals
const getDisconnect = () => {
  const dbObj = locals.get(DbLocal);
  if (!dbObj) throw new Error("Database not initialized in middleware");
  return dbObj.disconnect();
};

// Middleware is run around every run
tasks.middleware("db", async ({ next }) => {
  // Create a fresh database instance for each job run
  // This ensures consistent connection pooling with optimized settings for Supabase
  const dbObj = createJobDb();
  locals.set(DbLocal, dbObj);

  await next();
});

// This lifecycle hook is called when a `wait` is hit
// In cloud this can result in the machine being suspended until later
tasks.onWait("db", async () => {
  // Close the connection pool to free database connections
  await getDisconnect();
});

// This lifecycle hook is called when a run is resumed after a `wait`
tasks.onResume("db", async () => {
  // Create a new database instance since the old pool was closed
  const db = createJobDb();
  locals.set(DbLocal, db);
});
