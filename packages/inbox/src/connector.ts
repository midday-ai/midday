import type { Database } from "@midday/db/client";
import { getInboxAccountById, upsertInboxAccount } from "@midday/db/queries";
import { decrypt, encrypt } from "@midday/encryption";
import { GmailProvider } from "./providers/gmail";
import {
  type Account,
  type Attachment,
  Connector,
  type ExchangeCodeForAccountParams,
  type GetAttachmentsOptions,
  type OAuthProvider,
  type OAuthProviderInterface,
} from "./providers/types";

export class InboxConnector extends Connector {
  #db: Database;
  #provider: OAuthProviderInterface;
  #providerName: OAuthProvider;

  constructor(provider: OAuthProvider, db: Database) {
    super();

    this.#db = db;

    switch (provider) {
      case "gmail":
        this.#provider = new GmailProvider(this.#db);
        this.#providerName = "gmail";
        break;
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  async connect(): Promise<string> {
    return this.#provider.getAuthUrl();
  }

  async exchangeCodeForAccount(
    params: ExchangeCodeForAccountParams,
  ): Promise<Account | null> {
    const tokens = await this.#provider.exchangeCodeForTokens(params.code);

    // Set tokens to configure provider auth client with expiry date
    this.#provider.setTokens({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token ?? "",
      expiry_date: tokens.expiry_date,
    });

    const account = await this.#saveAccount({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? "",
      teamId: params.teamId,
      expiryDate: new Date(tokens.expiry_date!).toISOString(),
    });

    if (!account) {
      throw new Error("Failed to save account");
    }

    return {
      id: account.id,
      provider: account.provider as OAuthProvider,
      external_id: account.external_id,
    };
  }

  async getAttachments(options: GetAttachmentsOptions): Promise<Attachment[]> {
    const account = await getInboxAccountById(this.#db, {
      id: options.id,
      teamId: options.teamId,
    });

    if (!account) {
      throw new Error("Account not found");
    }

    if (!account.accessToken || !account.refreshToken) {
      throw new Error("Account tokens not found or invalid");
    }

    // Set the account ID
    this.#provider.setAccountId(account.id);

    // Set tokens to configure provider auth client with expiry date
    const expiryDate = account.expiryDate
      ? new Date(account.expiryDate).getTime()
      : undefined;
    this.#provider.setTokens({
      access_token: decrypt(account.accessToken),
      refresh_token: decrypt(account.refreshToken),
      expiry_date: expiryDate,
    });

    try {
      return await this.#provider.getAttachments({
        id: account.id,
        teamId: options.teamId,
        maxResults: options.maxResults,
        lastAccessed: account.lastAccessed,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // Check if it's an authentication error that might be resolved by token refresh
      if (this.#isAuthError(errorMessage)) {
        console.log(
          "Authentication error detected, attempting token refresh and retry",
        );
        try {
          return await this.#retryWithTokenRefresh(options, account);
        } catch (retryError) {
          const retryMessage =
            retryError instanceof Error
              ? retryError.message
              : "Unknown retry error";
          throw new Error(
            `Failed to fetch attachments after token refresh: ${retryMessage}`,
          );
        }
      }

      throw new Error(`Failed to fetch attachments: ${errorMessage}`);
    }
  }

  #isAuthError(errorMessage: string): boolean {
    const authErrorPatterns = [
      "invalid_request",
      "unauthorized",
      "invalid_grant",
      "invalid_token",
      "token_expired",
      "access_denied",
      "forbidden",
    ];

    return authErrorPatterns.some((pattern) =>
      errorMessage.toLowerCase().includes(pattern),
    );
  }

  async #retryWithTokenRefresh(
    options: GetAttachmentsOptions,
    account: any,
  ): Promise<Attachment[]> {
    console.log("Attempting token refresh for account", {
      accountId: account.id,
    });

    // Force token refresh by setting tokens again with expired date
    // This will trigger the Google OAuth2 client to refresh automatically
    this.#provider.setTokens({
      access_token: decrypt(account.accessToken),
      refresh_token: decrypt(account.refreshToken),
      expiry_date: Date.now() - 1000, // Set as expired to force refresh
    });

    // Use exponential backoff to wait for token refresh to complete
    // Google OAuth2 client refresh + database update should complete quickly
    const maxRetries = 3;
    const baseDelay = 200; // Start with 200ms

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Token refresh retry attempt ${attempt}/${maxRetries}`);

        // Try the request - if tokens were refreshed, this should work
        return await this.#provider.getAttachments({
          id: account.id,
          teamId: options.teamId,
          maxResults: options.maxResults,
          lastAccessed: account.lastAccessed,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        // If it's still an auth error and we have retries left, wait and try again
        if (this.#isAuthError(errorMessage) && attempt < maxRetries) {
          const delay = baseDelay * 2 ** (attempt - 1); // Exponential backoff: 200ms, 400ms, 800ms
          console.log(
            `Token refresh attempt ${attempt} failed, waiting ${delay}ms before retry`,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        // If it's not an auth error, or we're out of retries, throw
        throw error;
      }
    }

    throw new Error("Token refresh failed after all retry attempts");
  }

  async #saveAccount(params: {
    accessToken: string;
    refreshToken: string;
    teamId: string;
    expiryDate: string;
  }) {
    if (!params.teamId || !this.#provider) {
      throw new Error("Team ID or provider is not set");
    }

    const userInfo = await this.#provider.getUserInfo();

    if (!userInfo?.email || !userInfo.id) {
      throw new Error("User info does not contain an email address.");
    }

    const data = await upsertInboxAccount(this.#db, {
      teamId: params.teamId,
      provider: this.#providerName,
      accessToken: encrypt(params.accessToken),
      refreshToken: encrypt(params.refreshToken),
      email: userInfo.email,
      lastAccessed: new Date().toISOString(),
      externalId: userInfo.id,
      expiryDate: params.expiryDate,
    });

    return data;
  }
}
