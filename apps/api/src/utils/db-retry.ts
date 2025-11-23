import type { Database, DatabaseWithPrimary } from "@midday/db/client";

/**
 * Retry helper for database queries that may fail due to replication lag
 * or transient connection issues. Tries replica first, falls back to primary on failure.
 *
 * This preserves the benefit of fast replicas while handling replication lag gracefully.
 *
 * @param db - The database instance (may be a replica)
 * @param fn - The database query function to execute
 * @param options - Configuration options
 * @param options.maxRetries - Maximum number of retry attempts on primary (default: 1)
 * @param options.baseDelay - Base delay in milliseconds for exponential backoff (default: 100)
 * @param options.retryOnNull - If true, retry on primary when result is null/undefined (default: false)
 * @returns The result of the query function
 */
export async function withRetryOnPrimary<T>(
  db: Database,
  fn: (db: Database) => Promise<T>,
  options?: {
    maxRetries?: number;
    baseDelay?: number;
    retryOnNull?: boolean;
  },
): Promise<T> {
  const {
    maxRetries = 1,
    baseDelay = 100,
    retryOnNull = false,
  } = options || {};
  const dbWithPrimary = db as DatabaseWithPrimary;
  let lastError: unknown;

  // First attempt: try with replica (default behavior)
  try {
    const result = await fn(db);

    // If retryOnNull is enabled and result is null/undefined, retry on primary
    if (retryOnNull && (result === null || result === undefined)) {
      // Check if we can use primary
      if (!dbWithPrimary.usePrimaryOnly) {
        return result;
      }

      // Retry on primary
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const primaryDb = dbWithPrimary.usePrimaryOnly();
          const primaryResult = await fn(primaryDb);
          // Return primary result even if it's still null (user genuinely doesn't exist)
          return primaryResult;
        } catch (error) {
          lastError = error;

          // Don't retry on the last attempt
          if (attempt === maxRetries) {
            break;
          }

          // Exponential backoff with jitter
          const delay = baseDelay * 2 ** attempt + Math.random() * 50;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }

      // If all retries failed, throw the last error
      if (lastError) {
        throw lastError;
      }

      // If no error but still null, return null
      return result;
    }

    return result;
  } catch (error) {
    lastError = error;

    // Check if this is a retryable error
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isRetryableError =
      errorMessage.includes("timeout") ||
      errorMessage.includes("connection") ||
      errorMessage.includes("Failed query") ||
      errorMessage.includes("canceling statement") ||
      errorMessage.includes("cancelled");

    // If not retryable, throw immediately
    if (!isRetryableError) {
      throw error;
    }

    // If we can't use primary, throw the original error
    if (!dbWithPrimary.usePrimaryOnly) {
      throw error;
    }
  }

  // Retry attempts: use primary database
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const primaryDb = dbWithPrimary.usePrimaryOnly();
      return await fn(primaryDb);
    } catch (error) {
      lastError = error;

      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Exponential backoff with jitter
      const delay = baseDelay * 2 ** attempt + Math.random() * 50;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
