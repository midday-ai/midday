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
  AI_CLASSIFICATION: 90_000, // 90 seconds for AI document/image classification
  // AI classification can be slow for complex documents with OCR, multiple pages,
  // or when the model is under load. 90s provides sufficient buffer.
  CLASSIFICATION_JOB_WAIT: 180_000, // 3 minutes for waiting on classification jobs
  // Must be >= AI_CLASSIFICATION (90s) + FILE_DOWNLOAD (60s for images) + job overhead
  // Using 180s to ensure parent job doesn't timeout while child classification is valid
  // This prevents race conditions where parent marks "failed" but child completes "completed"
} as const;

/**
 * Image size configurations for processing
 * Based on research: 2048px is optimal for vision models + OCR
 * - Preserves text legibility (x-height >= 20px for receipts)
 * - Within all major AI model limits (Gemini, GPT-4V, Claude)
 * - Good balance between OCR quality and processing speed
 */
export const IMAGE_SIZES = {
  MAX_DIMENSION: 2048, // Max width/height for image processing
} as const;
