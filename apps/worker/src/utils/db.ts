import type { Database } from "@midday/db/client";
import { createJobDb } from "@midday/db/job-client";

/**
 * Get database instance for worker jobs
 * Creates a fresh instance for each job (similar to trigger.dev pattern)
 */
let dbInstance: Database | null = null;

export function getDb(): Database {
  if (!dbInstance) {
    const dbObj = createJobDb();
    dbInstance = dbObj.db;
  }
  return dbInstance;
}
