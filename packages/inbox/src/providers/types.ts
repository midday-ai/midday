export interface EmailAttachment {
  filename: string;
  mimeType: string;
  size: number;
  data: string; // Base64 encoded data
}

export interface Attachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  referenceId: string;
  data: Buffer;
  website?: string;
}

export interface Account {
  id: string;
  provider: OAuthProvider;
  external_id: string;
}

export interface GetAttachmentsOptions {
  id: string;
  teamId: string;
  maxResults?: number;
  lastAccessed?: string;
  fullSync?: boolean;
}

export abstract class Connector {
  abstract connect(): Promise<string>;
  abstract exchangeCodeForAccount(
    params: ExchangeCodeForAccountParams,
  ): Promise<Account | null>;
  abstract getAttachments(
    options?: GetAttachmentsOptions,
  ): Promise<Attachment[]>;
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

export type OAuthProvider = "gmail";

export interface OAuthProviderInterface {
  /**
   * Generates the authorization URL for the user to grant permission.
   */
  getAuthUrl(): Promise<string>;

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
   * Fetches attachments from the provider.
   * @param options - Options for fetching attachments (e.g., max results, id).
   */
  getAttachments(options: GetAttachmentsOptions): Promise<Attachment[]>;

  /**
   * Fetches user info from the provider.
   */
  getUserInfo(): Promise<UserInfo | undefined>;

  /**
   * Sets the account ID for the provider.
   * @param accountId - The account ID.
   */
  setAccountId(accountId: string): void;

  /**
   * Explicitly refreshes the access token using the refresh token.
   */
  refreshTokens(): Promise<void>;
}
