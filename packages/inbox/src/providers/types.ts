export interface EmailAttachment {
  filename: string;
  mimeType: string;
  size: number;
  data: string; // Base64 encoded data
}

export interface Email {
  id: string;
  threadId: string;
  snippet: string;
  subject?: string;
  from?: string;
  to?: string[];
  date?: Date;
  body?: {
    text?: string;
    html?: string;
  };
  attachments?: EmailAttachment[];
}

export abstract class Connector {
  abstract connect(): string;
  abstract exchangeCodeForAccount(
    params: ExchangeCodeForAccountParams,
  ): Promise<void>;
  abstract getEmails(options?: { limit?: number }): Promise<Email[]>;
}

export interface OAuthProviderCredentials {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface Tokens {
  access_token: string;
  refresh_token?: string | null;
  expiry_date?: number | null;
  scope?: string;
  token_type?: string;
}

export interface ExchangeCodeForAccountParams {
  code: string;
  teamId: string;
}

export interface UserInfo {
  email?: string;
  id?: string;
  name?: string;
}

export type OAuthProvider = "gmail" | "outlook";

export interface OAuthProviderInterface {
  /**
   * Generates the authorization URL for the user to grant permission.
   */
  getAuthUrl(): string;

  /**
   * Exchanges the authorization code received from the callback for access and refresh tokens.
   * @param code - The authorization code.
   */
  exchangeCodeForTokens(code: string): Promise<Tokens>;

  /**
   * Sets the credentials (tokens) for the OAuth client.
   * Required before making API calls.
   * @param tokens - The tokens obtained from the authorization flow.
   */
  setTokens(tokens: Tokens): void;

  /**
   * Refreshes the access token using the refresh token.
   * Updates the client's credentials.
   */
  refreshToken(): Promise<Tokens>;

  /**
   * Fetches emails from the provider.
   * @param options - Options for fetching emails (e.g., max results, include attachments).
   */
  getEmails(options?: {
    maxResults?: number;
    includeAttachments?: boolean;
  }): Promise<Email[]>;

  /**
   * Fetches user info from the provider.
   */
  getUserInfo(): Promise<UserInfo | undefined>;
}
