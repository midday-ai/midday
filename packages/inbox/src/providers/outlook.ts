import { ConfidentialClientApplication } from "@azure/msal-node";
import { Client } from "@microsoft/microsoft-graph-client";
import { ensurePdfExtension } from "../attachments";
import { generateDeterministicId } from "../generate-id";
import { updateAccessToken, updateRefreshToken } from "../tokens";
import type {
  Attachment,
  GetAttachmentsOptions,
  OAuthProviderInterface,
  Tokens,
  UserInfo,
} from "./types";

export class OutlookProvider implements OAuthProviderInterface {
  #graphClient: Client | null = null;
  #tokens: Tokens | null = null;
  #accountId: string | null = null;
  #msalClient: ConfidentialClientApplication | null = null;

  readonly #scopes = [
    "https://graph.microsoft.com/Mail.Read",
    "https://graph.microsoft.com/User.Read",
    "offline_access",
  ];

  constructor() {
    const clientId = process.env.OUTLOOK_CLIENT_ID || "";
    const clientSecret = process.env.OUTLOOK_CLIENT_SECRET || "";

    this.#msalClient = new ConfidentialClientApplication({
      auth: {
        clientId,
        clientSecret,
        authority: "https://login.microsoftonline.com/common",
      },
    });
  }

  setAccountId(accountId: string): void {
    this.#accountId = accountId;
  }

  async getAuthUrl(): Promise<string> {
    if (!this.#msalClient) {
      throw new Error("MSAL client not initialized");
    }

    const redirectUri = process.env.OUTLOOK_REDIRECT_URI || "";

    const authCodeUrlParameters = {
      scopes: this.#scopes,
      redirectUri,
      responseMode: "query" as const,
      state: "outlook",
    };

    return this.#msalClient.getAuthCodeUrl(authCodeUrlParameters);
  }

  async exchangeCodeForTokens(code: string): Promise<Tokens> {
    try {
      if (!this.#msalClient) {
        throw new Error("MSAL client not initialized");
      }

      const redirectUri = process.env.OUTLOOK_REDIRECT_URI || "";

      const tokenResponse = await this.#msalClient.acquireTokenByCode({
        code,
        scopes: this.#scopes,
        redirectUri,
      });

      if (!tokenResponse) {
        throw new Error("No token response received");
      }

      const tokens: Tokens = {
        access_token: tokenResponse.accessToken,
        refresh_token: tokenResponse.idToken,
        expiry_date: tokenResponse.expiresOn
          ? tokenResponse.expiresOn.getTime()
          : Date.now() + 3600 * 1000,
        scope: tokenResponse.scopes.join(" "),
      };

      this.setTokens(tokens);
      return tokens;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to exchange code for tokens: ${message}`);
    }
  }

  setTokens(tokens: Tokens): void {
    if (!tokens.access_token) {
      throw new Error("Access token is required.");
    }

    this.#tokens = tokens;

    // Initialize Microsoft Graph client with authentication
    this.#graphClient = Client.init({
      authProvider: (done) => {
        done(null, tokens.access_token);
      },
    });

    // Store tokens in database if we have accountId
    if (this.#accountId && tokens.access_token) {
      if (tokens.refresh_token) {
        updateRefreshToken({
          accountId: this.#accountId,
          refreshToken: tokens.refresh_token,
        }).catch((error) => {
          console.error("Failed to update refresh token:", error);
        });
      }

      if (tokens.expiry_date) {
        updateAccessToken({
          accountId: this.#accountId,
          accessToken: tokens.access_token,
          expiryDate: new Date(tokens.expiry_date).toISOString(),
        }).catch((error) => {
          console.error("Failed to update access token:", error);
        });
      }
    }
  }

  async refreshToken(): Promise<Tokens> {
    if (!this.#tokens?.refresh_token) {
      throw new Error("No refresh token available");
    }

    try {
      if (!this.#msalClient) {
        throw new Error("MSAL client not initialized");
      }

      const refreshTokenRequest = {
        refreshToken: this.#tokens.refresh_token,
        scopes: this.#scopes,
      };

      const tokenResponse =
        await this.#msalClient.acquireTokenByRefreshToken(refreshTokenRequest);

      if (!tokenResponse) {
        throw new Error("No token response received");
      }

      const newTokens: Tokens = {
        access_token: tokenResponse.accessToken,
        refresh_token: this.#tokens.refresh_token,
        expiry_date: tokenResponse.expiresOn
          ? tokenResponse.expiresOn.getTime()
          : Date.now() + 3600 * 1000,
        scope: tokenResponse.scopes.join(" "),
      };

      this.setTokens(newTokens);
      return newTokens;
    } catch (error) {
      console.error("Error refreshing token:", error);
      throw error;
    }
  }

  async getUserInfo(): Promise<UserInfo | undefined> {
    if (!this.#graphClient) {
      throw new Error("Graph client not initialized. Set tokens first.");
    }

    try {
      const user = await this.#graphClient
        .api("/me")
        .select("id,displayName,mail")
        .get();

      return {
        id: user.id,
        email: user.mail,
        name: user.displayName,
      };
    } catch (error: unknown) {
      return undefined;
    }
  }

  async getAttachments(options: GetAttachmentsOptions): Promise<Attachment[]> {
    if (!this.#graphClient) {
      throw new Error("Graph client not initialized. Set tokens first.");
    }

    const { maxResults = 10 } = options;

    try {
      const messages = await this.#graphClient
        .api("/me/messages")
        .filter("hasAttachments eq true")
        .top(maxResults)
        .get();

      if (!messages.value || messages.value.length === 0) {
        return [];
      }

      // Process each message to extract attachments
      const attachmentPromises = messages.value.map((message: { id: string }) =>
        this.#processMessageToAttachments(message.id),
      );

      const attachmentsArray = await Promise.all(attachmentPromises);
      const flattenedAttachments = attachmentsArray.flat();

      return flattenedAttachments;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to fetch attachments: ${message}`);
    }
  }

  async #processMessageToAttachments(messageId: string): Promise<Attachment[]> {
    if (!this.#graphClient) {
      return [];
    }

    try {
      // Get message details to extract the sender domain
      const message = await this.#graphClient
        .api(`/me/messages/${messageId}`)
        .select("sender")
        .get();

      // Extract sender domain
      let senderDomain: string | undefined;
      if (message.sender?.emailAddress?.address) {
        const email = message.sender.emailAddress.address;
        const domain = email.split("@")[1];

        if (domain) {
          const domainParts = domain.split(".");
          const partsCount = domainParts.length;

          senderDomain =
            partsCount >= 2
              ? `${domainParts[partsCount - 2]}.${domainParts[partsCount - 1]}`
              : domain;
        }
      }

      // Get attachments for this message
      const attachmentsResponse = await this.#graphClient
        .api(`/me/messages/${messageId}/attachments`)
        .get();

      if (
        !attachmentsResponse.value ||
        attachmentsResponse.value.length === 0
      ) {
        return [];
      }

      interface MessageAttachment {
        contentType: string;
        name: string;
        size?: number;
        contentBytes: string;
      }

      const pdfAttachments = attachmentsResponse.value.filter(
        (att: MessageAttachment) =>
          att.contentType === "application/pdf" ||
          (att.name &&
            typeof att.name === "string" &&
            att.name.toLowerCase().endsWith(".pdf")),
      );

      // Limit to max 5 attachments per email
      const maxAttachments = 5;
      const limitedAttachments = pdfAttachments.slice(0, maxAttachments);

      // Process each attachment
      const attachments: Attachment[] = limitedAttachments.map(
        (att: MessageAttachment) => {
          const filename = ensurePdfExtension(att.name);
          const referenceId = generateDeterministicId(
            `${messageId}_${filename}`,
          );

          return {
            id: referenceId,
            filename,
            mimeType: att.contentType,
            size: att.size || 0,
            data: Buffer.from(att.contentBytes, "base64"),
            referenceId,
            website: senderDomain,
          };
        },
      );

      return attachments;
    } catch {
      return [];
    }
  }
}
