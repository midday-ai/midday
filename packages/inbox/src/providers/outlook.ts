import type { OAuthProvider, OAuthProviderInterface, Tokens } from "./types";

export class OutlookProvider implements OAuthProviderInterface {
  getAuthUrl(): string {
    return "";
  }

  exchangeCodeForTokens(code: string) {
    return Promise.resolve({
      access_token: "",
      refresh_token: "",
      scope: "",
      token_type: "",
    });
  }

  setTokens(tokens: Tokens): void {
    return;
  }

  refreshToken() {
    return Promise.resolve({} as Tokens);
  }

  getEmails(options?: { maxResults?: number; includeAttachments?: boolean }) {
    return Promise.resolve([]);
  }

  getUserInfo() {
    return Promise.resolve(undefined);
  }
}
