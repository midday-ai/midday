import { createLoggerWithContext } from "@midday/logger";

const logger = createLoggerWithContext("worker:batch");

/**
 * Process items in batches with error isolation
 * Each batch is processed independently - failures in one batch don't stop others
 */
export async function processBatch<T, R>(
  items: T[],
  batchSize: number,
  processor: (batch: T[]) => Promise<R[]>,
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    try {
      const batchResults = await processor(batch);
      results.push(...batchResults);
    } catch (error) {
      // Log error but continue processing remaining batches
      // This provides error isolation - one failed batch doesn't stop the rest
      logger.error(`Batch processing failed at index ${i}`, {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error; // Re-throw to allow caller to decide how to handle
    }
  }

  return results;
}

/**
 * Process items in batches with error isolation using Promise.allSettled
 * Returns results and errors separately for better error handling
 */
export async function processBatchWithErrorIsolation<T, R>(
  items: T[],
  batchSize: number,
  processor: (batch: T[]) => Promise<R[]>,
): Promise<{
  results: R[];
  errors: Array<{ index: number; error: unknown }>;
}> {
  const results: R[] = [];
  const errors: Array<{ index: number; error: unknown }> = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchIndex = Math.floor(i / batchSize);

    try {
      const batchResults = await processor(batch);
      results.push(...batchResults);
    } catch (error) {
      errors.push({ index: batchIndex, error });
      // Continue processing remaining batches
    }
  }

  return { results, errors };
}

/**
 * Process items in parallel batches with concurrency limit
 * Useful for I/O-bound operations where you want parallelism but need to limit concurrency
 */
export async function processBatchParallel<T, R>(
  items: T[],
  batchSize: number,
  concurrency: number,
  processor: (batch: T[]) => Promise<R[]>,
): Promise<R[]> {
  const results: R[] = [];
  const batches: T[][] = [];

  // Split items into batches
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }

  // Process batches with concurrency limit
  for (let i = 0; i < batches.length; i += concurrency) {
    const concurrentBatches = batches.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      concurrentBatches.map((batch) => processor(batch)),
    );
    results.push(...batchResults.flat());
  }

  return results;
}
