export function getInboxIdFromEmail(email: string) {
  return email.split("@").at(0);
}

export function getInboxEmail(inboxId: string) {
  if (process.env.NODE_ENV !== "production") {
    return `${inboxId}@inbox.staging.midday.ai`;
  }

  return `${inboxId}@inbox.midday.ai`;
}

/**
 * Determines if an error message indicates an authentication/authorization issue
 * that requires user intervention (like reconnecting their account) vs temporary
 * issues that might resolve on retry.
 *
 * Based on Google OAuth2 RFC 6749, Gmail API, and Google Auth Library patterns.
 *
 * @param errorMessage - The error message to analyze
 * @returns true if this is an authentication error requiring user action
 */
export function isAuthenticationError(errorMessage: string): boolean {
  if (!errorMessage) return false;

  const message = errorMessage.toLowerCase();

  // OAuth 2.0 error codes from RFC 6749
  const oauthErrors = [
    "invalid_request", // RFC 6749 - Malformed request
    "invalid_client", // RFC 6749 - Client authentication failed
    "invalid_grant", // RFC 6749 - Grant/refresh token invalid/expired
    "unauthorized_client", // RFC 6749 - Client not authorized for grant type
    "unsupported_grant_type", // RFC 6749 - Grant type not supported
    "invalid_scope", // RFC 6749 - Requested scope invalid/unknown
    "access_denied", // RFC 6749 - Resource owner denied request
    "invalid_token", // OAuth token validation failed
    "token_expired", // Token has expired
  ];

  // HTTP status codes indicating authentication issues
  const httpAuthErrors = [
    "401", // Unauthorized
    "403", // Forbidden
    "unauthorized", // Text version of 401
    "forbidden", // Text version of 403
    "unauthenticated", // gRPC equivalent of 401
  ];

  // Google-specific error patterns
  const googleSpecificErrors = [
    "authentication required",
    "re-authentication required",
    "reauthentication required",
    "authentication failed",
    "refresh token is invalid",
    "access token is invalid",
    "credentials have been revoked",
    "token has been expired or revoked",
    "invalid credentials",
    "permission denied",
    "insufficient permissions",
    "api key not valid",
    "api key expired",
  ];

  // Combine all error patterns
  const allAuthPatterns = [
    ...oauthErrors,
    ...httpAuthErrors,
    ...googleSpecificErrors,
  ];

  return allAuthPatterns.some((pattern) => message.includes(pattern));
}
