"use client";

import { Button } from "@midday/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import { Icons } from "@midday/ui/icons";
import { useRouter } from "next/navigation";

export type OAuthErrorType =
  | "missing_params"
  | "invalid_response_type"
  | "invalid_client_id"
  | "invalid_redirect_uri"
  | "invalid_scopes"
  | "expired"
  | "application_inactive"
  | "user_not_authenticated"
  | "invalid_client_credentials"
  | "authorization_code_expired"
  | "authorization_code_used"
  | "invalid_code_verifier"
  | "invalid_code_challenge_method"
  | "refresh_token_expired"
  | "refresh_token_revoked"
  | "invalid_refresh_token"
  | "grant_type_not_supported"
  | "failed_to_create_authorization_code"
  | "invalid_authorization_code"
  | "invalid_url_format"
  | "empty_scopes"
  | "unauthorized_team_access"
  | "server_error";

interface OAuthErrorMessageProps {
  errorType: OAuthErrorType;
  customMessage?: string;
  details?: string;
}

export function OAuthErrorMessage({
  errorType,
  customMessage,
  details,
}: OAuthErrorMessageProps) {
  const router = useRouter();

  const getErrorContent = () => {
    switch (errorType) {
      case "missing_params":
        return {
          title: "Invalid OAuth Request",
          message:
            "Could not find OAuth application. Make sure you have the correct client_id.",
        };
      case "invalid_response_type":
        return {
          title: "Invalid OAuth Request",
          message: "response_type must be 'code'",
        };
      case "invalid_client_id":
        return {
          title: "Invalid OAuth Request",
          message:
            "Could not find OAuth application. Make sure you have the correct client_id.",
        };
      case "invalid_redirect_uri":
        return {
          title: "Invalid OAuth Request",
          message:
            "Invalid redirect_uri parameter detected. Make sure you have allowlisted the redirect_uri in your OAuth app settings.",
        };
      case "invalid_scopes":
        return {
          title: "Invalid OAuth Request",
          message: customMessage || "Invalid scopes",
        };
      case "expired":
        return {
          title: "Invalid OAuth Request",
          message: "The OAuth request has expired. Please try again.",
        };
      case "application_inactive":
        return {
          title: "OAuth Application Inactive",
          message:
            "This OAuth application is currently inactive. Please contact the application owner.",
        };
      case "user_not_authenticated":
        return {
          title: "Authentication Required",
          message:
            "You must be logged in to authorize this application. Please sign in and try again.",
        };
      case "invalid_client_credentials":
        return {
          title: "Invalid OAuth Request",
          message:
            "Invalid client credentials provided. Please check your client_id and client_secret.",
        };
      case "authorization_code_expired":
        return {
          title: "Authorization Code Expired",
          message:
            "The authorization code has expired. Please restart the OAuth flow.",
        };
      case "authorization_code_used":
        return {
          title: "Authorization Code Already Used",
          message:
            "This authorization code has already been used. Please restart the OAuth flow.",
        };
      case "invalid_code_verifier":
        return {
          title: "Invalid OAuth Request",
          message: "Invalid code verifier provided for PKCE validation.",
        };
      case "invalid_code_challenge_method":
        return {
          title: "Invalid OAuth Request",
          message:
            "Invalid code challenge method. Supported methods are 'S256' and 'plain'.",
        };
      case "refresh_token_expired":
        return {
          title: "Refresh Token Expired",
          message:
            "The refresh token has expired. Please restart the OAuth flow.",
        };
      case "refresh_token_revoked":
        return {
          title: "Refresh Token Revoked",
          message:
            "The refresh token has been revoked. Please restart the OAuth flow.",
        };
      case "invalid_refresh_token":
        return {
          title: "Invalid Refresh Token",
          message:
            "The provided refresh token is invalid. Please restart the OAuth flow.",
        };
      case "grant_type_not_supported":
        return {
          title: "Grant Type Not Supported",
          message:
            "The requested grant type is not supported. Please use 'authorization_code' or 'refresh_token'.",
        };
      case "failed_to_create_authorization_code":
        return {
          title: "Server Error",
          message:
            "Failed to create authorization code. Please try again later.",
        };
      case "invalid_authorization_code":
        return {
          title: "Invalid Authorization Code",
          message:
            "The provided authorization code is invalid or does not exist.",
        };

      case "invalid_url_format":
        return {
          title: "Invalid URL Format",
          message: "The provided redirect_uri is not a valid URL format.",
        };
      case "empty_scopes":
        return {
          title: "Invalid OAuth Request",
          message:
            "No scopes provided. Please specify the required scopes for your application.",
        };
      case "unauthorized_team_access":
        return {
          title: "Unauthorized Access",
          message: "You don't have permission to access this team's resources.",
        };
      case "server_error":
        return {
          title: "Server Error",
          message:
            "An unexpected server error occurred. Please try again later.",
        };
      default:
        return {
          title: "Invalid OAuth Request",
          message:
            customMessage ||
            "An error occurred while processing your OAuth request.",
        };
    }
  };

  const { title, message } = getErrorContent();

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-background">
      <Card className="w-full max-w-[448px]">
        <CardHeader className="text-center pb-8">
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-full bg-background border border-border flex items-center justify-center">
              <Icons.Close className="size-5 text-[#666666]" />
            </div>
          </div>
          <CardTitle className="text-lg mb-2 font-serif">{title}</CardTitle>
          <CardDescription className="text-sm text-muted-foreground text-center">
            {message}
            {details && (
              <span className="block mt-2 text-xs text-muted-foreground/70">
                {details}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-3 pt-4">
            <Button onClick={() => router.push("/")} className="w-full">
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
