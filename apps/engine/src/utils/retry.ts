export async function withRetry<TResult>(
  fn: (attempt: number) => TResult | Promise<TResult>,
  {
    maxRetries = 1,
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
