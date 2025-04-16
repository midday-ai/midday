import { decrypt, encrypt } from "@midday/encryption";
import { createClient } from "@midday/supabase/job";
import { createInboxAccount } from "@midday/supabase/mutations";
import type { Client } from "@midday/supabase/types";
import { GmailProvider } from "./providers/gmail";
import { OutlookProvider } from "./providers/outlook";
import {
  Connector,
  type Email,
  type ExchangeCodeForAccountParams,
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

  async exchangeCodeForAccount(params: ExchangeCodeForAccountParams) {
    const tokens = await this.#provider.exchangeCodeForTokens(params.code);

    // Set tokens to configure provider auth client
    this.#provider.setTokens({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token ?? "",
    });

    await this.#saveAccount({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? "",
      teamId: params.teamId,
    });
  }

  async getEmails(options?: { limit?: number }): Promise<Email[]> {
    try {
      const emails = await this.#provider.getEmails({
        maxResults: options?.limit,
      });

      return emails;
    } catch (error) {
      // Handle potential token expiration/errors
      console.error("Failed to fetch emails:", error);
      // Attempt token refresh if possible, or re-throw
      throw new Error("Failed to fetch emails.");
    }
  }

  async #saveAccount(params: {
    accessToken: string;
    refreshToken: string;
    teamId: string;
  }) {
    if (!params.teamId || !this.#provider) {
      throw new Error("Team ID or provider is not set");
    }

    const userInfo = await this.#provider.getUserInfo();

    if (!userInfo?.email) {
      throw new Error("User info does not contain an email address.");
    }

    const { data } = await createInboxAccount(this.#supabase, {
      teamId: params.teamId,
      provider: this.#providerName,
      accessToken: encrypt(params.accessToken),
      refreshToken: encrypt(params.refreshToken),
      email: userInfo.email,
      lastAccessed: new Date().toISOString(),
    });

    return data;
  }
}
