import type { Database } from "@midday/db/client";
import { getWorkerDb } from "@midday/db/worker-client";
import { sql } from "drizzle-orm";

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
 * Executes a simple SELECT 1 query with timeout protection
 */
export async function checkDbHealth(): Promise<{
  healthy: boolean;
  error?: string;
  responseTimeMs?: number;
}> {
  const startTime = Date.now();
  try {
    const db = getDb();
    // Execute a simple query to verify database connectivity
    // Use Promise.race to timeout after 5 seconds
    const queryPromise = db.execute(sql`SELECT 1`);
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Database query timeout")), 5000);
    });

    await Promise.race([queryPromise, timeoutPromise]);
    const responseTimeMs = Date.now() - startTime;

    return {
      healthy: true,
      responseTimeMs,
    };
  } catch (error) {
    const responseTimeMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[Health Check] Database check failed:", errorMessage);
    return {
      healthy: false,
      error: errorMessage,
      responseTimeMs,
    };
  }
}
