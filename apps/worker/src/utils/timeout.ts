/**
 * Timeout wrapper utility for external API calls
 * Prevents jobs from hanging indefinitely on slow or unresponsive services
 */

export class TimeoutError extends Error {
  constructor(
    message: string,
    public readonly timeoutMs: number,
  ) {
    super(message);
    this.name = "TimeoutError";
  }
}

/**
 * Wrap a promise with a timeout
 * @param promise The promise to wrap
 * @param timeoutMs Timeout in milliseconds
 * @param errorMessage Optional custom error message
 * @returns The promise result or throws TimeoutError
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage?: string,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(
        new TimeoutError(
          errorMessage || `Operation timed out after ${timeoutMs}ms`,
          timeoutMs,
        ),
      );
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * Default timeout configurations for different operation types
 */
export const TIMEOUTS = {
  EMBEDDING: 30_000, // 30 seconds for embedding generation
  DOCUMENT_PROCESSING: 600_000, // 10 minutes for document processing
  // Multi-pass extraction can take time: Pass 1 (primary), Pass 2 (fallback),
  // Pass 3 (field re-extraction), Pass 4 (consistency validation), plus retries
  FILE_DOWNLOAD: 60_000, // 1 minute for file downloads
  FILE_UPLOAD: 60_000, // 1 minute for file uploads
  DATABASE_QUERY: 15_000, // 15 seconds for database queries
  EXTERNAL_API: 30_000, // 30 seconds for external API calls
} as const;
