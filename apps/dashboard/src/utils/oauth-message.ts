export const OAUTH_CHANNEL_NAME = "midday_oauth_complete";

export type OAuthMessageType = "app_oauth_completed" | "app_oauth_error";

export interface OAuthMessage {
  type: OAuthMessageType;
}

export function isOAuthMessage(data: unknown): data is OAuthMessage {
  return (
    typeof data === "object" &&
    data !== null &&
    "type" in data &&
    (data.type === "app_oauth_completed" || data.type === "app_oauth_error")
  );
}
