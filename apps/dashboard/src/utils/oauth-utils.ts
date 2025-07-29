import type { OAuthErrorType } from "@/components/oauth/oauth-error-message";

// Helper function to parse and categorize errors
export function categorizeOAuthError(error: unknown): {
  errorType: OAuthErrorType;
  customMessage?: string;
  details?: string;
} {
  if (!(error instanceof Error)) {
    return {
      errorType: "server_error",
      customMessage: "An unknown error occurred",
    };
  }

  const errorMessage = error.message.toLowerCase();

  // Check for specific error patterns
  if (
    errorMessage.includes("invalid client_id") ||
    errorMessage.includes("client_id")
  ) {
    return { errorType: "invalid_client_id", details: error.message };
  }

  if (
    errorMessage.includes("invalid redirect_uri") ||
    errorMessage.includes("redirect_uri")
  ) {
    return { errorType: "invalid_redirect_uri", details: error.message };
  }

  if (
    errorMessage.includes("invalid scopes") ||
    errorMessage.includes("scopes")
  ) {
    return {
      errorType: "invalid_scopes",
      customMessage: error.message,
      details: error.message,
    };
  }

  if (errorMessage.includes("expired") || errorMessage.includes("expire")) {
    if (errorMessage.includes("authorization code")) {
      return {
        errorType: "authorization_code_expired",
        details: error.message,
      };
    }
    if (errorMessage.includes("refresh token")) {
      return { errorType: "refresh_token_expired", details: error.message };
    }
    return { errorType: "expired", details: error.message };
  }

  if (errorMessage.includes("already used") || errorMessage.includes("used")) {
    return { errorType: "authorization_code_used", details: error.message };
  }

  if (
    errorMessage.includes("not authenticated") ||
    errorMessage.includes("authentication")
  ) {
    return { errorType: "user_not_authenticated", details: error.message };
  }

  if (
    errorMessage.includes("inactive") ||
    errorMessage.includes("not active")
  ) {
    return { errorType: "application_inactive", details: error.message };
  }

  if (
    errorMessage.includes("client credentials") ||
    errorMessage.includes("client_secret")
  ) {
    return {
      errorType: "invalid_client_credentials",
      details: error.message,
    };
  }

  if (errorMessage.includes("code verifier") || errorMessage.includes("pkce")) {
    return { errorType: "invalid_code_verifier", details: error.message };
  }

  if (errorMessage.includes("code challenge method")) {
    return {
      errorType: "invalid_code_challenge_method",
      details: error.message,
    };
  }

  if (
    errorMessage.includes("refresh token revoked") ||
    errorMessage.includes("revoked")
  ) {
    return { errorType: "refresh_token_revoked", details: error.message };
  }

  if (
    errorMessage.includes("invalid refresh token") ||
    errorMessage.includes("refresh token")
  ) {
    return { errorType: "invalid_refresh_token", details: error.message };
  }

  if (
    errorMessage.includes("grant type") ||
    errorMessage.includes("unsupported")
  ) {
    return { errorType: "grant_type_not_supported", details: error.message };
  }

  if (
    errorMessage.includes("failed to create") ||
    errorMessage.includes("create authorization code")
  ) {
    return {
      errorType: "failed_to_create_authorization_code",
      details: error.message,
    };
  }

  if (
    errorMessage.includes("invalid authorization code") ||
    errorMessage.includes("authorization code")
  ) {
    return {
      errorType: "invalid_authorization_code",
      details: error.message,
    };
  }

  if (
    errorMessage.includes("invalid url") ||
    errorMessage.includes("malformed url")
  ) {
    return { errorType: "invalid_url_format", details: error.message };
  }

  if (
    errorMessage.includes("empty scopes") ||
    errorMessage.includes("no scopes")
  ) {
    return { errorType: "empty_scopes", details: error.message };
  }

  if (
    errorMessage.includes("unauthorized") ||
    errorMessage.includes("permission") ||
    errorMessage.includes("team")
  ) {
    return { errorType: "unauthorized_team_access", details: error.message };
  }

  // Default to server error for unrecognized errors
  return {
    errorType: "server_error",
    customMessage: error.message,
    details: error.message,
  };
}

// Helper function to validate OAuth parameters
export function validateOAuthParams(params: {
  response_type?: string;
  client_id?: string;
  redirect_uri?: string;
  scope?: string;
}): { isValid: boolean; errorType?: OAuthErrorType } {
  const { response_type, client_id, redirect_uri, scope } = params;

  // Validate required parameters
  if (!client_id || !redirect_uri || !scope) {
    return { isValid: false, errorType: "missing_params" };
  }

  // Validate response_type
  if (response_type !== "code") {
    return { isValid: false, errorType: "invalid_response_type" };
  }

  // Validate URL format for redirect_uri
  try {
    new URL(redirect_uri);
  } catch {
    return { isValid: false, errorType: "invalid_url_format" };
  }

  // Validate scopes are not empty
  if (!scope.trim()) {
    return { isValid: false, errorType: "empty_scopes" };
  }

  return { isValid: true };
}
