/**
 * Processes an array of items in batches using a provided function.
 *
 * @param items - The array of items to process.
 * @param limit - The maximum number of items to process in each batch.
 * @param fn - The async function to apply to each batch. It should accept an array of items and return a processed array.
 * @returns A promise that resolves to an array containing all processed items.
 *
 * @example
 * const items = [1, 2, 3, 4, 5];
 * const limit = 2;
 * const result = await processPromisesBatch(items, limit, async (batch) => {
 *   return batch.map(item => item * 2);
 * });
 * console.log(result); // [2, 4, 6, 8, 10]
 */
export async function processPromisesBatch(items: any[], limit: number, fn: (batch: any[]) => Promise<any[]>): Promise<any[]> {
  const batches = [];
  let result: any[] = [];

  // Split the items into batches
  for (let i = 0; i < items.length; i += limit) {
    batches.push(items.slice(i, i + limit));
  }

  // Process batches serially
  for (const batch of batches) {
    const processedBatch = await fn(batch);
    result = result.concat(processedBatch);
  }

  return result;
}
