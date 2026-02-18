/**
 * Shared OAuth utilities for app integrations
 */
import type { OAuthErrorCode } from "@midday/app-store/oauth-errors";
import { sanitizeRedirectPath } from "@midday/utils/sanitize-redirect";

export type { OAuthErrorCode };

/**
 * Map OAuth errors from any provider to standardized error codes
 *
 * Handles errors from:
 * - Standard OAuth (access_denied, consent_required, etc.)
 * - Fortnox (error_missing_license, error_missing_system_admin_right, etc.)
 * - Google/Microsoft (scope errors)
 * - Xero/QuickBooks (various provider errors)
 */
export function mapOAuthError(error: string | undefined): OAuthErrorCode {
  if (!error) return "unknown_error";

  const errorLower = error.toLowerCase();

  // Access denied / User cancelled
  if (
    errorLower.includes("access_denied") ||
    errorLower.includes("user_denied") ||
    errorLower.includes("consent") ||
    errorLower.includes("cancelled") ||
    errorLower.includes("canceled")
  ) {
    return "access_denied";
  }

  // License errors (Fortnox)
  if (
    errorLower.includes("missing_license") ||
    errorLower.includes("missing_app_license") ||
    errorLower.includes("license_required") ||
    errorLower.includes("no_license")
  ) {
    return "missing_license";
  }

  // Permission/Admin errors (Fortnox, general)
  if (
    errorLower.includes("missing_system_admin") ||
    errorLower.includes("admin_right") ||
    errorLower.includes("insufficient_permission") ||
    errorLower.includes("invalid_scope") ||
    errorLower.includes("insufficient_scope") ||
    errorLower.includes("scope")
  ) {
    return "missing_permissions";
  }

  // State errors
  if (
    errorLower.includes("invalid_state") ||
    errorLower.includes("state_mismatch") ||
    errorLower.includes("state_expired")
  ) {
    return "invalid_state";
  }

  return "unknown_error";
}

/**
 * Build success redirect URL for OAuth callback
 */
export function buildSuccessRedirect(
  dashboardUrl: string,
  provider: string,
  source?: string,
  fallbackPath = "/settings/apps",
  redirectPath?: string,
): string {
  // For apps flow (popup), redirect to oauth-callback
  if (source === "apps") {
    return `${dashboardUrl}/oauth-callback?status=success`;
  }

  // Use custom redirect path if provided (e.g. from onboarding), sanitized to prevent open redirects
  const targetPath = redirectPath
    ? sanitizeRedirectPath(redirectPath, fallbackPath)
    : fallbackPath;

  // For direct navigation flow, redirect to target path with success params
  const params = new URLSearchParams({ connected: "true", provider });
  const separator = targetPath.includes("?") ? "&" : "?";
  return `${dashboardUrl}${targetPath}${separator}${params.toString()}`;
}

/**
 * Build error redirect URL for OAuth callback
 */
export function buildErrorRedirect(
  dashboardUrl: string,
  errorCode: string,
  provider: string,
  source?: string,
  fallbackPath = "/settings/apps",
  redirectPath?: string,
): string {
  // For apps flow (popup), redirect to oauth-callback to show error
  if (source === "apps") {
    const params = new URLSearchParams({
      status: "error",
      error: errorCode,
    });
    return `${dashboardUrl}/oauth-callback?${params.toString()}`;
  }

  // Use custom redirect path if provided (e.g. from onboarding), sanitized to prevent open redirects
  const targetPath = redirectPath
    ? sanitizeRedirectPath(redirectPath, fallbackPath)
    : fallbackPath;

  // For direct navigation flow, redirect to target path with error params
  const params = new URLSearchParams({
    connected: "false",
    error: errorCode,
    provider,
  });
  const separator = targetPath.includes("?") ? "&" : "?";
  return `${dashboardUrl}${targetPath}${separator}${params.toString()}`;
}
