import type { OAuthErrorCode } from "@midday/app-store/oauth-errors";

export const OAUTH_CHANNEL_NAME = "midday_oauth_complete";

export type OAuthMessageType = "app_oauth_completed" | "app_oauth_error";

type OAuthSuccessMessage = {
  type: "app_oauth_completed";
};

type OAuthErrorMessage = {
  type: "app_oauth_error";
  error?: OAuthErrorCode;
};

export type OAuthMessage = OAuthSuccessMessage | OAuthErrorMessage;

export function isOAuthMessage(data: unknown): data is OAuthMessage {
  if (typeof data !== "object" || data === null || !("type" in data)) {
    return false;
  }

  if (data.type === "app_oauth_completed") {
    return true;
  }

  if (data.type !== "app_oauth_error") {
    return false;
  }

  if (!("error" in data) || data.error === undefined) {
    return true;
  }

  if (typeof data.error !== "string") {
    return false;
  }

  return (
    data.error === "access_denied" ||
    data.error === "missing_license" ||
    data.error === "missing_permissions" ||
    data.error === "invalid_state" ||
    data.error === "token_exchange_failed" ||
    data.error === "unknown_error"
  );
}
