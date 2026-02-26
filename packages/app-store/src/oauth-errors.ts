/**
 * Standardized OAuth error codes for app integrations
 * Used across all OAuth providers (Fortnox, Xero, QuickBooks, Gmail, Outlook, etc.)
 */
export const OAUTH_ERROR_CODES = [
  "access_denied",
  "missing_license",
  "missing_permissions",
  "invalid_state",
  "token_exchange_failed",
  "unknown_error",
] as const;

export type OAuthErrorCode = (typeof OAUTH_ERROR_CODES)[number];

export function isOAuthErrorCode(value: string): value is OAuthErrorCode {
  return OAUTH_ERROR_CODES.includes(value as OAuthErrorCode);
}
