import type { Database } from "@midday/db/client";
import { getWorkerDb } from "@midday/db/worker-client";
import { createLoggerWithContext } from "@midday/logger";

const logger = createLoggerWithContext("worker:db");

/**
 * Get database instance for worker jobs
 * Uses a shared connection pool optimized for BullMQ concurrent job processing
 * This is appropriate for a stateful server handling many concurrent jobs
 */
let dbInstance: Database | null = null;

/**
 * Get database instance with reconnection handling
 */
export function getDb(): Database {
  if (!dbInstance) {
    try {
      dbInstance = getWorkerDb();
    } catch (error) {
      // If connection fails, log and rethrow
      logger.error("Failed to initialize database connection", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
  return dbInstance;
}
