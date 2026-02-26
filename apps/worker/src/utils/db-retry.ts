import { extractErrorDetails } from "./error-details";

type LoggerLike = {
  warn: (message: string, context?: Record<string, unknown>) => void;
};

type RetryOptions = {
  attempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  operationName: string;
  logger: LoggerLike;
};

function isRetryableConnectionError(error: unknown): boolean {
  const details = extractErrorDetails(error);
  const code =
    details.code ??
    details.cause?.code ??
    (typeof details.errno === "string" ? details.errno : undefined) ??
    (typeof details.cause?.errno === "string"
      ? details.cause.errno
      : undefined);

  const message =
    `${details.message ?? ""} ${details.cause?.message ?? ""}`.toUpperCase();

  if (
    code &&
    [
      "ECONNREFUSED",
      "ETIMEDOUT",
      "ECONNRESET",
      "EHOSTUNREACH",
      "ENETUNREACH",
      "EAI_AGAIN",
      "ENOTFOUND",
      "57P01", // admin_shutdown
      "57P02", // crash_shutdown
      "57P03", // cannot_connect_now
      "08000",
      "08001",
      "08006",
    ].includes(code)
  ) {
    return true;
  }

  return (
    message.includes("ECONNREFUSED") ||
    message.includes("TIMEOUT") ||
    message.includes("CONNECTION TERMINATED") ||
    message.includes("CANNOT_CONNECT_NOW")
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withDbConnectionRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions,
): Promise<T> {
  const maxAttempts = Math.max(1, options.attempts ?? 3);
  const baseDelayMs = options.baseDelayMs ?? 250;
  const maxDelayMs = options.maxDelayMs ?? 2000;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      if (attempt >= maxAttempts || !isRetryableConnectionError(error)) {
        throw error;
      }

      const expoDelay = Math.min(baseDelayMs * 2 ** (attempt - 1), maxDelayMs);
      const jitter = Math.floor(Math.random() * 100);
      const delayMs = expoDelay + jitter;

      options.logger.warn(
        "Transient DB connectivity issue, retrying operation",
        {
          operation: options.operationName,
          attempt,
          maxAttempts,
          retryInMs: delayMs,
          errorDetails: extractErrorDetails(error),
        },
      );

      await sleep(delayMs);
    }
  }

  // The loop always returns or throws in practice; this guards type-checking.
  throw new Error("Retry loop exited unexpectedly");
}
