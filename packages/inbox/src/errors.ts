/**
 * Error codes for authentication-related errors
 */
export type InboxAuthErrorCode =
  | "token_expired"
  | "token_invalid"
  | "refresh_token_expired"
  | "refresh_token_invalid"
  | "unauthorized"
  | "forbidden"
  | "consent_required"
  | "mfa_required";

/**
 * Error codes for sync-related errors
 */
export type InboxSyncErrorCode =
  | "fetch_failed"
  | "rate_limited"
  | "network_error"
  | "provider_error";

export type InboxProvider = "gmail" | "outlook";

interface InboxAuthErrorOptions {
  code: InboxAuthErrorCode;
  provider: InboxProvider;
  message: string;
  requiresReauth: boolean;
  cause?: Error;
}

/**
 * Structured error for authentication/authorization issues.
 * Use `requiresReauth` to determine if user intervention is needed.
 */
export class InboxAuthError extends Error {
  readonly code: InboxAuthErrorCode;
  readonly provider: InboxProvider;
  readonly requiresReauth: boolean;

  constructor(options: InboxAuthErrorOptions) {
    super(options.message);
    this.name = "InboxAuthError";
    this.code = options.code;
    this.provider = options.provider;
    this.requiresReauth = options.requiresReauth;

    // Preserve the original error stack if available
    if (options.cause) {
      this.cause = options.cause;
    }

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, InboxAuthError.prototype);
  }

  /**
   * Check if this error indicates the user needs to reconnect their account
   */
  isReauthRequired(): boolean {
    return this.requiresReauth;
  }
}

interface InboxSyncErrorOptions {
  code: InboxSyncErrorCode;
  provider: InboxProvider;
  message: string;
  cause?: Error;
}

/**
 * Structured error for sync-related issues (non-auth).
 * These are typically transient and may resolve on retry.
 */
export class InboxSyncError extends Error {
  readonly code: InboxSyncErrorCode;
  readonly provider: InboxProvider;

  constructor(options: InboxSyncErrorOptions) {
    super(options.message);
    this.name = "InboxSyncError";
    this.code = options.code;
    this.provider = options.provider;

    if (options.cause) {
      this.cause = options.cause;
    }

    Object.setPrototypeOf(this, InboxSyncError.prototype);
  }

  /**
   * Check if this error is likely transient and worth retrying
   */
  isRetryable(): boolean {
    return this.code === "network_error" || this.code === "rate_limited";
  }
}

/**
 * Type guard to check if an error is an InboxAuthError
 */
export function isInboxAuthError(error: unknown): error is InboxAuthError {
  return error instanceof InboxAuthError;
}

/**
 * Type guard to check if an error is an InboxSyncError
 */
export function isInboxSyncError(error: unknown): error is InboxSyncError {
  return error instanceof InboxSyncError;
}
