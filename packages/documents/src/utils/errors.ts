/**
 * Custom error types for document extraction
 */

export class ExtractionError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = "ExtractionError";
  }
}

export class ModelExtractionError extends ExtractionError {
  constructor(
    message: string,
    public readonly model: string,
    public readonly pass: number,
    cause?: Error,
  ) {
    super(message, "MODEL_EXTRACTION_ERROR", cause);
    this.name = "ModelExtractionError";
  }
}

export class QualityValidationError extends ExtractionError {
  constructor(
    message: string,
    public readonly qualityScore: number,
    public readonly threshold: number,
    public readonly missingFields: string[],
  ) {
    super(message, "QUALITY_VALIDATION_ERROR");
    this.name = "QualityValidationError";
  }
}

export class FieldReExtractionError extends ExtractionError {
  constructor(
    message: string,
    public readonly field: string,
    cause?: Error,
  ) {
    super(message, "FIELD_RE_EXTRACTION_ERROR", cause);
    this.name = "FieldReExtractionError";
  }
}

export class DocumentLoadError extends ExtractionError {
  constructor(message: string, cause?: Error) {
    super(message, "DOCUMENT_LOAD_ERROR", cause);
    this.name = "DocumentLoadError";
  }
}

/**
 * Check if an error is retryable (network/timeout errors)
 */
export function isRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const errorMessage = error.message.toLowerCase();
  const errorName = error.name;

  return (
    errorMessage.includes("timeout") ||
    errorMessage.includes("network") ||
    errorMessage.includes("503") ||
    errorMessage.includes("service unavailable") ||
    errorMessage.includes("aborted") ||
    errorName === "AbortError" ||
    errorName === "TimeoutError" ||
    (error instanceof DOMException && error.code === 23)
  );
}

/**
 * Extract error details for logging
 */
export function getErrorDetails(error: unknown): {
  message: string;
  name: string;
  code?: string;
  cause?: string;
  stack?: string;
} {
  if (error instanceof ExtractionError) {
    return {
      message: error.message,
      name: error.name,
      code: error.code,
      cause: error.cause?.message,
      stack: error.stack,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack,
    };
  }

  return {
    message: String(error),
    name: "UnknownError",
  };
}
