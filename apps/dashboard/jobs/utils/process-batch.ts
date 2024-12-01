export async function processBatch<T, R>(
  items: T[],
  limit: number,
  fn: (batch: T[]) => Promise<R[]>,
): Promise<R[]> {
  const batches: T[][] = [];
  let result: R[] = [];

  // Split the items into batches
  for (let i = 0; i < items?.length; i += limit) {
    batches.push(items.slice(i, i + limit));
  }

  // Process batches serially
  for (const batch of batches) {
    const processedBatch = await fn(batch);
    result = result.concat(processedBatch);
  }

  return result;
}
