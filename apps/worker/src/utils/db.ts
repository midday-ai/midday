import type { Database } from "@midday/db/client";
import { getWorkerDb } from "@midday/db/worker-client";

/**
 * Get database instance for worker jobs
 * Uses a shared connection pool optimized for BullMQ concurrent job processing
 * This is appropriate for a stateful server handling many concurrent jobs
 */
let dbInstance: Database | null = null;

export function getDb(): Database {
  if (!dbInstance) {
    dbInstance = getWorkerDb();
  }
  return dbInstance;
}
