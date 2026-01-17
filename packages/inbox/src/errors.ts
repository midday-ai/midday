/**
 * @fileoverview Structured error classes for inbox sync operations.
 *
 * This module provides type-safe error handling for email provider integrations.
 * Errors are classified into two categories:
 * - {@link InboxAuthError} - Authentication/authorization failures
 * - {@link InboxSyncError} - Transient sync issues (network, rate limits, etc.)
 *
 * @example
 * ```typescript
 * import { InboxAuthError, isInboxAuthError } from "@midday/inbox/errors";
 *
 * try {
 *   await connector.getAttachments(options);
 * } catch (error) {
 *   if (isInboxAuthError(error)) {
 *     if (error.requiresReauth) {
 *       // User must reconnect their account
 *     }
 *   }
 * }
 * ```
 */

/**
 * Error codes for authentication-related errors.
 *
 * | Code | Description |
 * |------|-------------|
 * | `token_expired` | Access token has expired |
 * | `token_invalid` | Access token is malformed or invalid |
 * | `refresh_token_expired` | Refresh token has expired (typically 90 days) |
 * | `refresh_token_invalid` | Refresh token is missing or invalid |
 * | `unauthorized` | General 401 unauthorized response |
 * | `forbidden` | Permission denied (403) |
 * | `consent_required` | User must re-consent to permissions (Outlook) |
 * | `mfa_required` | Multi-factor authentication required (Outlook) |
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
 * Error codes for sync-related errors.
 *
 * | Code | Description |
 * |------|-------------|
 * | `fetch_failed` | General failure fetching data from provider |
 * | `rate_limited` | API rate limit exceeded (429) |
 * | `network_error` | Network connectivity issue |
 * | `provider_error` | Provider-specific error |
 */
export type InboxSyncErrorCode =
  | "fetch_failed"
  | "rate_limited"
  | "network_error"
  | "provider_error";

/**
 * Supported email providers.
 */
export type InboxProvider = "gmail" | "outlook";

/**
 * Options for constructing an {@link InboxAuthError}.
 */
interface InboxAuthErrorOptions {
  /** The specific error code identifying the auth failure type */
  code: InboxAuthErrorCode;
  /** The email provider that generated this error */
  provider: InboxProvider;
  /** Human-readable error message */
  message: string;
  /** Whether user intervention is required to resolve this error */
  requiresReauth: boolean;
  /** The original error that caused this error, if any */
  cause?: Error;
}

/**
 * Structured error for authentication and authorization issues.
 *
 * Use the `requiresReauth` property to determine if user intervention is needed:
 * - `true`: User must reconnect their account (token revoked, expired, etc.)
 * - `false`: Error may be transient, retry might succeed
 *
 * @example
 * ```typescript
 * throw new InboxAuthError({
 *   code: "token_expired",
 *   provider: "gmail",
 *   message: "Access token has expired",
 *   requiresReauth: true,
 * });
 * ```
 */
export class InboxAuthError extends Error {
  /** The specific error code */
  readonly code: InboxAuthErrorCode;
  /** The email provider that generated this error */
  readonly provider: InboxProvider;
  /** Whether the user needs to re-authenticate */
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
   * Check if this error indicates the user needs to reconnect their account.
   * @returns `true` if user must re-authenticate
   */
  isReauthRequired(): boolean {
    return this.requiresReauth;
  }
}

/**
 * Options for constructing an {@link InboxSyncError}.
 */
interface InboxSyncErrorOptions {
  /** The specific error code identifying the sync failure type */
  code: InboxSyncErrorCode;
  /** The email provider that generated this error */
  provider: InboxProvider;
  /** Human-readable error message */
  message: string;
  /** The original error that caused this error, if any */
  cause?: Error;
}

/**
 * Structured error for sync-related issues (non-authentication).
 *
 * These errors are typically transient and may resolve on retry.
 * Use the `isRetryable()` method to check if retrying is recommended.
 *
 * @example
 * ```typescript
 * throw new InboxSyncError({
 *   code: "rate_limited",
 *   provider: "outlook",
 *   message: "API rate limit exceeded",
 * });
 * ```
 */
export class InboxSyncError extends Error {
  /** The specific error code */
  readonly code: InboxSyncErrorCode;
  /** The email provider that generated this error */
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
   * Check if this error is likely transient and worth retrying.
   * @returns `true` for network errors and rate limits
   */
  isRetryable(): boolean {
    return this.code === "network_error" || this.code === "rate_limited";
  }
}

/**
 * Type guard to check if an error is an {@link InboxAuthError}.
 *
 * @param error - The error to check
 * @returns `true` if the error is an InboxAuthError
 *
 * @example
 * ```typescript
 * if (isInboxAuthError(error)) {
 *   console.log(error.code); // TypeScript knows this is InboxAuthErrorCode
 * }
 * ```
 */
export function isInboxAuthError(error: unknown): error is InboxAuthError {
  return error instanceof InboxAuthError;
}

/**
 * Type guard to check if an error is an {@link InboxSyncError}.
 *
 * @param error - The error to check
 * @returns `true` if the error is an InboxSyncError
 *
 * @example
 * ```typescript
 * if (isInboxSyncError(error)) {
 *   console.log(error.isRetryable());
 * }
 * ```
 */
export function isInboxSyncError(error: unknown): error is InboxSyncError {
  return error instanceof InboxSyncError;
}

/**
 * Assertion function that narrows an error to {@link InboxAuthError}.
 *
 * Use after a type guard check to avoid manual type casting.
 *
 * @param error - The error to assert
 * @throws {TypeError} If the error is not an InboxAuthError
 *
 * @example
 * ```typescript
 * if (isInboxAuthError(error)) {
 *   assertInboxAuthError(error);
 *   // error is now typed as InboxAuthError without casting
 *   console.log(error.requiresReauth);
 * }
 * ```
 */
export function assertInboxAuthError(
  error: unknown,
): asserts error is InboxAuthError {
  if (!isInboxAuthError(error)) {
    throw new TypeError(`Expected InboxAuthError, got ${typeof error}`);
  }
}

/**
 * Assertion function that narrows an error to {@link InboxSyncError}.
 *
 * Use after a type guard check to avoid manual type casting.
 *
 * @param error - The error to assert
 * @throws {TypeError} If the error is not an InboxSyncError
 *
 * @example
 * ```typescript
 * if (isInboxSyncError(error)) {
 *   assertInboxSyncError(error);
 *   // error is now typed as InboxSyncError without casting
 *   console.log(error.isRetryable());
 * }
 * ```
 */
export function assertInboxSyncError(
  error: unknown,
): asserts error is InboxSyncError {
  if (!isInboxSyncError(error)) {
    throw new TypeError(`Expected InboxSyncError, got ${typeof error}`);
  }
}
