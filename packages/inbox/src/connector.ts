import type { Database } from "@midday/db/client";
import { getInboxAccountById, upsertInboxAccount } from "@midday/db/queries";
import { decrypt, encrypt } from "@midday/encryption";
import { InboxAuthError, InboxSyncError } from "./errors";
import { GmailProvider } from "./providers/gmail";
import { OutlookProvider } from "./providers/outlook";
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
      case "outlook":
        this.#provider = new OutlookProvider(this.#db);
        this.#providerName = "outlook";
        break;
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  async connect(state?: string): Promise<string> {
    return this.#provider.getAuthUrl(state);
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
        fullSync: options.fullSync,
      });
    } catch (error) {
      // Handle structured auth errors
      if (error instanceof InboxAuthError) {
        // If reauth is required, don't retry - propagate the error
        if (error.requiresReauth) {
          throw error;
        }

        // Try token refresh for potentially transient auth errors
        try {
          return await this.#retryWithTokenRefresh(options, account);
        } catch (retryError) {
          // Propagate structured errors
          if (
            retryError instanceof InboxAuthError ||
            retryError instanceof InboxSyncError
          ) {
            throw retryError;
          }
          throw new InboxSyncError({
            code: "fetch_failed",
            provider: this.#providerName,
            message: `Failed to fetch attachments after token refresh: ${
              retryError instanceof Error ? retryError.message : "Unknown error"
            }`,
            cause: retryError instanceof Error ? retryError : undefined,
          });
        }
      }

      // Propagate sync errors as-is
      if (error instanceof InboxSyncError) {
        throw error;
      }

      // Wrap unknown errors
      throw new InboxSyncError({
        code: "fetch_failed",
        provider: this.#providerName,
        message: `Failed to fetch attachments: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  async #retryWithTokenRefresh(
    options: GetAttachmentsOptions,
    account: NonNullable<Awaited<ReturnType<typeof getInboxAccountById>>>,
  ): Promise<Attachment[]> {
    // Provider already has tokens set from the initial getAttachments call.
    // Just trigger an explicit refresh and retry the request.
    // The provider handles all token state internally and persists to DB.
    await this.#provider.refreshTokens();

    // After successful refresh, retry the request
    return await this.#provider.getAttachments({
      id: account.id,
      teamId: options.teamId,
      maxResults: options.maxResults,
      lastAccessed: account.lastAccessed,
      fullSync: options.fullSync,
    });
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
