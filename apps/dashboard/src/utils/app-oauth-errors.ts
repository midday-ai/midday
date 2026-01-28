import type { OAuthErrorCode } from "@midday/app-store/oauth-errors";

/**
 * Re-export the shared OAuth error code type for dashboard use
 */
export type AppOAuthErrorCode = OAuthErrorCode;

/**
 * User-friendly error titles
 */
const ERROR_TITLES: Record<AppOAuthErrorCode, string> = {
  access_denied: "Connection Cancelled",
  missing_license: "License Required",
  missing_permissions: "Admin Access Required",
  invalid_state: "Session Expired",
  token_exchange_failed: "Connection Failed",
  unknown_error: "Something Went Wrong",
};

/**
 * User-friendly error descriptions
 */
const ERROR_DESCRIPTIONS: Record<AppOAuthErrorCode, string> = {
  access_denied: "You cancelled the connection or denied access.",
  missing_license:
    "Your account doesn't have the required license for this integration. Please upgrade your plan or contact support.",
  missing_permissions:
    "You need administrator permissions to connect this integration. Please contact your account admin or try with an admin account.",
  invalid_state:
    "The connection session expired. Please close this window and try again.",
  token_exchange_failed:
    "We couldn't complete the connection. Please close this window and try again.",
  unknown_error:
    "An unexpected error occurred. Please close this window and try again.",
};

/**
 * Get user-friendly error title
 */
export function getErrorTitle(
  errorCode: AppOAuthErrorCode | null | undefined,
): string {
  return (
    ERROR_TITLES[errorCode ?? "unknown_error"] ?? ERROR_TITLES.unknown_error
  );
}

/**
 * Get user-friendly error description
 */
export function getErrorDescription(
  errorCode: AppOAuthErrorCode | null | undefined,
): string {
  return (
    ERROR_DESCRIPTIONS[errorCode ?? "unknown_error"] ??
    ERROR_DESCRIPTIONS.unknown_error
  );
}

/**
 * Format provider name for display
 */
export function formatProviderName(provider: string): string {
  const providerNames: Record<string, string> = {
    fortnox: "Fortnox",
    xero: "Xero",
    quickbooks: "QuickBooks",
    gmail: "Gmail",
    outlook: "Outlook",
    slack: "Slack",
    stripe: "Stripe",
  };

  return providerNames[provider.toLowerCase()] ?? provider;
}
