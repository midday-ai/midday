/**
 * Error classification utility
 * Categorizes errors as retryable or non-retryable for smart retry strategies
 */

export type ErrorCategory =
  | "retryable"
  | "non_retryable"
  | "rate_limit"
  | "timeout"
  | "network"
  | "validation"
  | "not_found"
  | "unauthorized";

export interface ClassifiedError {
  category: ErrorCategory;
  retryable: boolean;
  retryDelay?: number; // Suggested retry delay in ms
  maxRetries?: number; // Suggested max retries for this error type
}

/**
 * Classify an error to determine retry strategy
 */
export function classifyError(error: unknown): ClassifiedError {
  // Handle TimeoutError from timeout utility
  if (error instanceof Error && error.name === "TimeoutError") {
    return {
      category: "timeout",
      retryable: true,
      retryDelay: 2000, // 2 seconds
      maxRetries: 3,
    };
  }

  // Handle AbortError (fetch/timeout)
  if (error instanceof Error && error.name === "AbortError") {
    return {
      category: "timeout",
      retryable: true,
      retryDelay: 2000,
      maxRetries: 3,
    };
  }

  // Handle network errors
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || "";

    // Network errors
    if (
      message.includes("network") ||
      message.includes("econnreset") ||
      message.includes("enotfound") ||
      message.includes("econnrefused") ||
      message.includes("etimedout") ||
      stack.includes("fetch")
    ) {
      return {
        category: "network",
        retryable: true,
        retryDelay: 1000,
        maxRetries: 3,
      };
    }

    // Rate limiting
    if (
      message.includes("rate limit") ||
      message.includes("429") ||
      message.includes("too many requests") ||
      message.includes("quota")
    ) {
      return {
        category: "rate_limit",
        retryable: true,
        retryDelay: 5000, // 5 seconds for rate limits
        maxRetries: 5,
      };
    }

    // Validation errors (non-retryable)
    if (
      message.includes("validation") ||
      message.includes("invalid") ||
      message.includes("malformed") ||
      message.includes("bad request") ||
      message.includes("400")
    ) {
      return {
        category: "validation",
        retryable: false,
      };
    }

    // Not found errors (non-retryable)
    if (
      message.includes("not found") ||
      message.includes("404") ||
      message.includes("does not exist")
    ) {
      return {
        category: "not_found",
        retryable: false,
      };
    }

    // Unauthorized errors (non-retryable without auth fix)
    if (
      message.includes("unauthorized") ||
      message.includes("401") ||
      message.includes("forbidden") ||
      message.includes("403") ||
      message.includes("authentication") ||
      message.includes("permission")
    ) {
      return {
        category: "unauthorized",
        retryable: false,
      };
    }

    // Server errors (retryable)
    if (
      message.includes("500") ||
      message.includes("502") ||
      message.includes("503") ||
      message.includes("504") ||
      message.includes("internal server error") ||
      message.includes("service unavailable") ||
      message.includes("bad gateway") ||
      message.includes("gateway timeout")
    ) {
      return {
        category: "retryable",
        retryable: true,
        retryDelay: 2000,
        maxRetries: 3,
      };
    }
  }

  // Default: treat unknown errors as potentially retryable
  return {
    category: "retryable",
    retryable: true,
    retryDelay: 1000,
    maxRetries: 3,
  };
}

/**
 * Check if an error should be retried
 */
export function isRetryableError(error: unknown): boolean {
  return classifyError(error).retryable;
}

/**
 * Get suggested retry delay for an error
 */
export function getRetryDelay(error: unknown): number {
  const classified = classifyError(error);
  return classified.retryDelay || 1000;
}
