/**
 * Standardized OAuth error codes for app integrations
 * Used across all OAuth providers (Fortnox, Xero, QuickBooks, Gmail, Outlook, etc.)
 */
export type OAuthErrorCode =
  | "access_denied"
  | "missing_license"
  | "missing_permissions"
  | "invalid_state"
  | "token_exchange_failed"
  | "unknown_error";
