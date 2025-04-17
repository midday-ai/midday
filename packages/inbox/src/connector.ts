import { decrypt, encrypt } from "@midday/encryption";
import { createClient } from "@midday/supabase/job";
import { upsertInboxAccount } from "@midday/supabase/mutations";
import { getInboxAccountByIdQuery } from "@midday/supabase/queries";
import type { Client } from "@midday/supabase/types";
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
  #supabase: Client;
  #provider: OAuthProviderInterface;
  #providerName: OAuthProvider;

  constructor(provider: OAuthProvider) {
    super();

    this.#supabase = createClient();

    switch (provider) {
      case "gmail":
        this.#provider = new GmailProvider();
        this.#providerName = "gmail";
        break;
      case "outlook":
        this.#provider = new OutlookProvider();
        this.#providerName = "outlook";
        break;
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  connect() {
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

    return account;
  }

  async getAttachments(options: GetAttachmentsOptions): Promise<Attachment[]> {
    const account = await getInboxAccountByIdQuery(this.#supabase, options.id);

    if (!account.data) {
      throw new Error("Account not found");
    }

    // Set tokens to configure provider auth client
    this.#provider.setTokens({
      access_token: decrypt(account.data.access_token),
      refresh_token: decrypt(account.data.refresh_token),
    });

    try {
      return this.#provider.getAttachments({
        id: account.data.id,
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

    const { data } = await upsertInboxAccount(this.#supabase, {
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
