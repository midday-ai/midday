/**
 * Executes a function with retry logic.
 *
 * @template TResult The type of the result returned by the function.
 * @param {(attempt: number) => TResult | Promise<TResult>} fn - The function to execute with retry logic.
 * @param {Object} options - The options for configuring the retry behavior.
 * @param {number} [options.maxRetries=3] - The maximum number of retry attempts.
 * @param {(error: unknown, attempt: number) => boolean | undefined} [options.onError] - A callback function to handle errors and determine if a retry should occur.
 * @param {number} [options.delay] - The delay in milliseconds between retry attempts.
 * @returns {Promise<TResult>} A promise that resolves with the result of the function or rejects with the last error encountered.
 * @throws {unknown} Throws the last error encountered if all retry attempts fail.
 *
 * @example
 * const result = await withRetry(
 *   async (attempt) => {
 *     // Your async operation here
 *   },
 *   {
 *     maxRetries: 5,
 *     delay: 1000,
 *     onError: (error, attempt) => {
 *       console.log(`Attempt ${attempt} failed:`, error);
 *       return true; // Continue retrying
 *     },
 *   }
 * );
 */
export async function withRetry<TResult>(
  fn: (attempt: number) => TResult | Promise<TResult>,
  {
    maxRetries = 3,
    onError,
    delay,
  }: {
    maxRetries?: number;
    onError?(error: unknown, attempt: number): boolean | undefined;
    delay?: number;
  } = {},
) {
  let retries = 0;
  let lastError: unknown;

  while (retries <= maxRetries) {
    if (delay && retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    try {
      const res = await fn(retries);
      return res;
    } catch (err) {
      lastError = err;

      if (onError) {
        const shouldRetry = onError(err, retries);
        if (!shouldRetry) {
          break;
        }
      }

      retries++;
    }
  }

  throw lastError;
}
