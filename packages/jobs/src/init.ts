import { type Database, jobOnlyDb } from "@midday/db/client";
import { locals, tasks } from "@trigger.dev/sdk";

// Use the type of your database client, Database in this case
const DbLocal = locals.create<Database>("db");

// Helper function to get the database instance from locals
export const getDb = () => locals.get(DbLocal);

// Middleware is run around every run
tasks.middleware("db", async ({ next }) => {
  // Set the database client in locals
  // Using jobOnlyDb with optimized connection pooling for Supabase (600 max connections)
  locals.set(DbLocal, jobOnlyDb);

  // Connection pooling is managed automatically by postgres-js
  // Each job uses max 1 connection, automatically released after 5s idle timeout

  // Other middleware will run
  // After all of them, the run and lifecycle hooks will execute
  await next();
});
