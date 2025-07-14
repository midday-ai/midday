import { OAuthConsentScreen } from "@/components/oauth/oauth-consent-screen";
import {
  OAuthErrorMessage,
  type OAuthErrorType,
} from "@/components/oauth/oauth-error-message";
import { getQueryClient } from "@/trpc/server";
import { trpc } from "@/trpc/server";
import { Suspense } from "react";

interface OAuthAuthorizationWrapperProps {
  response_type?: string | null;
  client_id?: string | null;
  redirect_uri?: string | null;
  scope?: string | null;
  state?: string | null;
}

export async function OAuthAuthorizationWrapper({
  response_type,
  client_id,
  redirect_uri,
  scope,
  state,
}: OAuthAuthorizationWrapperProps) {
  // Helper function to parse and categorize errors
  function categorizeError(error: unknown): {
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

    if (
      errorMessage.includes("already used") ||
      errorMessage.includes("used")
    ) {
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

    if (
      errorMessage.includes("code verifier") ||
      errorMessage.includes("pkce")
    ) {
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

  // Validate required parameters
  if (!client_id || !redirect_uri || !scope) {
    return <OAuthErrorMessage errorType="missing_params" />;
  }

  // Validate response_type
  if (response_type !== "code") {
    return <OAuthErrorMessage errorType="invalid_response_type" />;
  }

  // Validate URL format for redirect_uri
  try {
    new URL(redirect_uri);
  } catch {
    return <OAuthErrorMessage errorType="invalid_url_format" />;
  }

  // Validate scopes are not empty
  if (!scope.trim()) {
    return <OAuthErrorMessage errorType="empty_scopes" />;
  }

  // Validate OAuth application and parameters
  try {
    const queryClient = getQueryClient();
    await queryClient.fetchQuery(
      trpc.oauthApplications.getApplicationInfo.queryOptions({
        clientId: client_id,
        redirectUri: redirect_uri,
        scope,
        state: state || undefined,
      }),
    );

    // If validation passes, render the consent screen
    return (
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        }
      >
        <OAuthConsentScreen />
      </Suspense>
    );
  } catch (error) {
    // Handle different types of validation errors
    const { errorType, customMessage, details } = categorizeError(error);
    return (
      <OAuthErrorMessage
        errorType={errorType}
        customMessage={customMessage}
        details={details}
      />
    );
  }
}
