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
  | "unauthorized"
  | "ai_content_blocked"
  | "ai_quota"
  | "unsupported_file_type";

export interface ClassifiedError {
  category: ErrorCategory;
  retryable: boolean;
  retryDelay?: number; // Suggested retry delay in ms
  maxRetries?: number; // Suggested max retries for this error type
}

/**
 * Custom error class for non-retryable errors
 * When thrown, this error signals that the job should not be retried
 */
export class NonRetryableError extends Error {
  constructor(
    message: string,
    public readonly originalError?: unknown,
    public readonly category: ErrorCategory = "non_retryable",
  ) {
    super(message);
    this.name = "NonRetryableError";
    // Maintain stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NonRetryableError);
    }
  }
}

/**
 * Error for unsupported file types (ZIP, etc.)
 * Not a failure - file is stored but can't be classified
 */
export class UnsupportedFileTypeError extends NonRetryableError {
  constructor(
    public readonly mimetype: string,
    public readonly fileName: string,
  ) {
    super(
      `File type ${mimetype} is not supported for processing`,
      undefined,
      "unsupported_file_type",
    );
    this.name = "UnsupportedFileTypeError";
  }
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

    // AI content moderation/safety errors (non-retryable - content won't pass)
    // These errors indicate the content was blocked by the AI's safety filters
    if (
      message.includes("content filtered") ||
      message.includes("content_filter") ||
      message.includes("safety") ||
      message.includes("blocked") ||
      message.includes("harm_category") ||
      message.includes("finish_reason") ||
      message.includes("recitation")
    ) {
      return {
        category: "ai_content_blocked",
        retryable: false, // Content won't pass, don't waste retries
      };
    }

    // AI quota/resource exhausted errors (retryable with longer delay)
    // These indicate temporary capacity issues or billing problems
    if (
      message.includes("quota exceeded") ||
      message.includes("resource_exhausted") ||
      message.includes("overloaded") ||
      message.includes("model_overloaded") ||
      message.includes("capacity")
    ) {
      return {
        category: "ai_quota",
        retryable: true,
        retryDelay: 60_000, // 60 seconds for quota/capacity issues
        maxRetries: 3,
      };
    }

    // Rate limiting (including AI rate limits)
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

    // Expired signed URL errors (retryable - can regenerate URL)
    // Check for download errors with 400 status on signed URLs
    if (
      (message.includes("download") || message.includes("downloaderror")) &&
      (message.includes("400") || message.includes("bad request")) &&
      (message.includes("token") ||
        message.includes("sign") ||
        message.includes("signed"))
    ) {
      return {
        category: "network",
        retryable: true,
        retryDelay: 1000,
        maxRetries: 3,
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

/**
 * Get suggested max retries for an error
 */
export function getMaxRetries(error: unknown): number {
  const classified = classifyError(error);
  return classified.maxRetries ?? 3;
}

/**
 * Check if error is a NonRetryableError
 */
export function isNonRetryableError(error: unknown): boolean {
  return error instanceof NonRetryableError;
}

/**
 * Get BullMQ job options based on error classification
 * Use this when enqueueing jobs that might fail with specific error types
 */
export function getJobRetryOptions(errorCategory?: ErrorCategory): {
  attempts: number;
  backoff: {
    type: "exponential" | "fixed";
    delay: number;
  };
  removeOnFail: boolean | { age: number; count?: number };
} {
  switch (errorCategory) {
    case "rate_limit":
      return {
        attempts: 5,
        backoff: {
          type: "exponential",
          delay: 5000, // 5 seconds for rate limits
        },
        removeOnFail: {
          age: 7 * 24 * 3600, // Keep for 7 days
        },
      };
    case "timeout":
    case "network":
      return {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
        removeOnFail: {
          age: 7 * 24 * 3600,
        },
      };
    case "validation":
    case "not_found":
    case "unauthorized":
    case "ai_content_blocked":
      return {
        attempts: 1, // Don't retry non-retryable errors
        backoff: {
          type: "fixed",
          delay: 0,
        },
        removeOnFail: {
          age: 24 * 3600, // Keep for 1 day only
        },
      };
    case "ai_quota":
      return {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 60000, // Start with 60 seconds for AI quota issues
        },
        removeOnFail: {
          age: 7 * 24 * 3600,
        },
      };
    default:
      return {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
        removeOnFail: {
          age: 7 * 24 * 3600,
        },
      };
  }
}
