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

/**
 * Extract the delay (in ms) to wait before retrying a rate-limited request.
 *
 * Checks for:
 * - Retry-After header (seconds or HTTP-date)
 * - X-RateLimit-Reset / HTTP_X_RATELIMIT_ACCOUNT_SUCCESS_RESET (seconds until reset)
 *
 * Falls back to exponential backoff with jitter if no header is found.
 */
function getRateLimitDelay(error: unknown, attempt: number): number {
  // Try to extract headers from common HTTP error shapes (xior, axios, fetch)
  const headers =
    (error as any)?.response?.headers ?? (error as any)?.headers ?? null;

  if (headers) {
    // GoCardless: HTTP_X_RATELIMIT_ACCOUNT_SUCCESS_RESET (seconds)
    const gcReset =
      headers?.http_x_ratelimit_account_success_reset ??
      headers?.[`x-ratelimit-account-success-reset`];
    if (gcReset) {
      return Number(gcReset) * 1000;
    }

    // Standard Retry-After header (seconds)
    const retryAfter = headers?.["retry-after"];
    if (retryAfter) {
      const seconds = Number(retryAfter);
      if (!Number.isNaN(seconds)) {
        return seconds * 1000;
      }
    }
  }

  // Exponential backoff with jitter: 1s, 2s, 4s + random 0-1s
  const baseDelay = Math.min(1000 * 2 ** attempt, 8000);
  const jitter = Math.random() * 1000;
  return baseDelay + jitter;
}

/**
 * Check if an error is an HTTP 429 (rate limited) response.
 */
function isRateLimitError(error: unknown): boolean {
  const status =
    (error as any)?.response?.status ??
    (error as any)?.status ??
    (error as any)?.statusCode;

  if (status === 429) return true;

  // Plaid uses error_type instead of HTTP status in some cases
  const errorType =
    (error as any)?.response?.data?.error_type ?? (error as any)?.error_type;

  return errorType === "RATE_LIMIT_EXCEEDED";
}

/**
 * Wraps an async function with automatic rate limit retry handling.
 * On HTTP 429: reads provider headers for delay, falls back to exponential backoff.
 * Non-429 errors are thrown immediately.
 */
export async function withRateLimitRetry<TResult>(
  fn: () => TResult | Promise<TResult>,
  { maxRetries = 3 }: { maxRetries?: number } = {},
): Promise<TResult> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      if (!isRateLimitError(err) || attempt === maxRetries) {
        throw err;
      }

      const delayMs = getRateLimitDelay(err, attempt);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
}
