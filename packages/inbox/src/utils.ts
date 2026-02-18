import { decrypt, encrypt } from "@midday/encryption";

export function getInboxIdFromEmail(email: string) {
  return email.split("@").at(0);
}

// OAuth state types
export interface OAuthStatePayload {
  teamId: string;
  provider: "gmail" | "outlook";
  source: "inbox" | "apps";
  redirectPath?: string;
}

/**
 * Encrypts OAuth state to prevent tampering.
 * The state contains sensitive info like teamId that must be protected.
 */
export function encryptOAuthState(payload: OAuthStatePayload): string {
  return encrypt(JSON.stringify(payload));
}

/**
 * Decrypts and validates OAuth state from callback.
 * Returns null if state is invalid or tampered with.
 */
export function decryptOAuthState(
  encryptedState: string,
): OAuthStatePayload | null {
  try {
    const decrypted = decrypt(encryptedState);
    const parsed = JSON.parse(decrypted);

    // Validate required fields
    if (
      typeof parsed.teamId !== "string" ||
      !["gmail", "outlook"].includes(parsed.provider) ||
      !["inbox", "apps"].includes(parsed.source)
    ) {
      return null;
    }

    return parsed as OAuthStatePayload;
  } catch {
    return null;
  }
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

  // Microsoft-specific error patterns
  const microsoftSpecificErrors = [
    "invalidauthenticationtoken", // Microsoft Graph error code
    "lifetime validation failed", // Token lifetime expired
    "token is expired", // Explicit expiration message
    "aadsts700082", // Refresh token expired
    "aadsts50076", // MFA required
    "aadsts700084", // Refresh token not found
    "aadsts65001", // User consent required
  ];

  // Combine all error patterns
  const allAuthPatterns = [
    ...oauthErrors,
    ...httpAuthErrors,
    ...googleSpecificErrors,
    ...microsoftSpecificErrors,
  ];

  return allAuthPatterns.some((pattern) => message.includes(pattern));
}
