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

    // Set tokens to configure provider auth client
    this.#provider.setTokens({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token ?? "",
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

    // Set tokens to configure provider auth client
    this.#provider.setTokens({
      access_token: decrypt(account.accessToken),
      refresh_token: decrypt(account.refreshToken),
    });

    try {
      return this.#provider.getAttachments({
        id: account.id,
        teamId: options.teamId,
        maxResults: options.maxResults,
      });
    } catch (error) {
      throw new Error("Failed to fetch attachments.");
    }
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
