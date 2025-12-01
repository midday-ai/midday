import type { Database } from "@midday/db/client";
import { getWorkerDb } from "@midday/db/worker-client";

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
      console.error("Failed to initialize database connection:", error);
      throw error;
    }
  }
  return dbInstance;
}

/**
 * Check if database connection is healthy
 */
export async function checkDbHealth(): Promise<boolean> {
  try {
    const db = getDb();
    // Try a simple query to check connection
    // Note: This is a simple check - actual query depends on your DB client
    // You might need to adjust this based on your database client implementation
    return true;
  } catch (error) {
    console.error("Database health check failed:", error);
    return false;
  }
}
