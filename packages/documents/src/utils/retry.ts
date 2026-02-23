/**
 * Check if an error is a rate limit error (429, quota exceeded, etc.)
 */
export function isRateLimitError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();
  return (
    message.includes("rate limit") ||
    message.includes("rate_limit") ||
    message.includes("too many requests") ||
    message.includes("quota") ||
    message.includes("429") ||
    message.includes("resource_exhausted")
  );
}

/**
 * Retry wrapper for calls with exponential backoff.
 * Retries on timeout, network, and rate limit errors.
 */
export async function retryCall<T>(
  operation: () => Promise<T>,
  maxRetries = 2,
  baseDelay = 1000,
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorName = error instanceof Error ? error.name : "";
      const isRetryableError =
        errorMessage.includes("timeout") ||
        errorMessage.includes("TimeoutError") ||
        errorMessage.includes("aborted") ||
        errorMessage.includes("network") ||
        errorMessage.includes("503") ||
        errorMessage.includes("503 Service Unavailable") ||
        errorMessage.includes("goaway") ||
        errorName === "AbortError" ||
        errorName === "TimeoutError" ||
        (error instanceof DOMException && error.code === 23) ||
        isRateLimitError(error);

      if (!isRetryableError) {
        throw error;
      }

      const delay = baseDelay * 2 ** attempt + Math.random() * 1000;
      console.log(
        `AI call failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${Math.round(delay)}ms:`,
        errorMessage,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error("All retry attempts failed");
}
