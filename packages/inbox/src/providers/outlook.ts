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
  private graphClient: Client | null = null;
  private tokens: Tokens | null = null;
  private accountId: string | null = null;

  private readonly scopes = [
    "https://graph.microsoft.com/Mail.Read",
    "https://graph.microsoft.com/User.Read",
    "offline_access",
  ];

  setAccountId(accountId: string): void {
    this.accountId = accountId;
  }

  getAuthUrl(): string {
    const clientId = process.env.OUTLOOK_CLIENT_ID;
    const redirectUri = process.env.OUTLOOK_REDIRECT_URI;

    const authUrl = new URL(
      "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    );
    authUrl.searchParams.append("client_id", clientId || "");
    authUrl.searchParams.append("response_type", "code");
    authUrl.searchParams.append("redirect_uri", redirectUri || "");
    authUrl.searchParams.append("scope", this.scopes.join(" "));
    authUrl.searchParams.append("response_mode", "query");
    authUrl.searchParams.append("state", "outlook");

    return authUrl.toString();
  }

  async exchangeCodeForTokens(code: string): Promise<Tokens> {
    try {
      const clientId = process.env.OUTLOOK_CLIENT_ID;
      const clientSecret = process.env.OUTLOOK_CLIENT_SECRET;
      const redirectUri = process.env.OUTLOOK_REDIRECT_URI;

      const tokenUrl =
        "https://login.microsoftonline.com/common/oauth2/v2.0/token";
      const params = new URLSearchParams({
        client_id: clientId || "",
        client_secret: clientSecret || "",
        code,
        redirect_uri: redirectUri || "",
        grant_type: "authorization_code",
      });

      const response = await fetch(tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to exchange code: ${error}`);
      }

      const data = await response.json();

      const tokens: Tokens = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expiry_date: Date.now() + data.expires_in * 1000,
        scope: data.scope,
        token_type: data.token_type,
      };

      this.setTokens(tokens);
      return tokens;
    } catch (error: unknown) {
      console.error("Error exchanging code for tokens:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to exchange code for tokens: ${message}`);
    }
  }

  setTokens(tokens: Tokens): void {
    if (!tokens.access_token) {
      throw new Error("Access token is required.");
    }

    this.tokens = tokens;

    // Initialize Microsoft Graph client with authentication
    this.graphClient = Client.init({
      authProvider: (done) => {
        done(null, tokens.access_token);
      },
    });

    // Store tokens in database if we have accountId
    if (this.accountId && tokens.access_token) {
      if (tokens.refresh_token) {
        updateRefreshToken({
          accountId: this.accountId,
          refreshToken: tokens.refresh_token,
        }).catch((error) => {
          console.error("Failed to update refresh token:", error);
        });
      }

      if (tokens.expiry_date) {
        updateAccessToken({
          accountId: this.accountId,
          accessToken: tokens.access_token,
          expiryDate: new Date(tokens.expiry_date).toISOString(),
        }).catch((error) => {
          console.error("Failed to update access token:", error);
        });
      }
    }
  }

  async refreshToken(): Promise<Tokens> {
    if (!this.tokens?.refresh_token) {
      throw new Error("No refresh token available");
    }

    try {
      const clientId = process.env.OUTLOOK_CLIENT_ID;
      const clientSecret = process.env.OUTLOOK_CLIENT_SECRET;

      const tokenUrl =
        "https://login.microsoftonline.com/common/oauth2/v2.0/token";
      const params = new URLSearchParams({
        client_id: clientId || "",
        client_secret: clientSecret || "",
        refresh_token: this.tokens.refresh_token,
        grant_type: "refresh_token",
        scope: this.scopes.join(" "),
      });

      const response = await fetch(tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to refresh token: ${error}`);
      }

      const data = await response.json();

      const newTokens: Tokens = {
        access_token: data.access_token,
        refresh_token: data.refresh_token || this.tokens.refresh_token,
        expiry_date: Date.now() + data.expires_in * 1000,
        scope: data.scope,
        token_type: data.token_type,
      };

      this.setTokens(newTokens);
      return newTokens;
    } catch (error) {
      console.error("Error refreshing token:", error);
      throw error;
    }
  }

  async getUserInfo(): Promise<UserInfo | undefined> {
    if (!this.graphClient) {
      throw new Error("Graph client not initialized. Set tokens first.");
    }

    try {
      const user = await this.graphClient
        .api("/me")
        .select("id,displayName,mail")
        .get();

      return {
        id: user.id,
        email: user.mail,
        name: user.displayName,
      };
    } catch (error: unknown) {
      console.error("Error fetching user info:", error);
      return undefined;
    }
  }

  async getAttachments(options: GetAttachmentsOptions): Promise<Attachment[]> {
    if (!this.graphClient) {
      throw new Error("Graph client not initialized. Set tokens first.");
    }

    const { maxResults = 10 } = options;

    try {
      // Search for emails with PDF attachments
      const messages = await this.graphClient
        .api("/me/messages")
        .filter("hasAttachments eq true")
        .top(maxResults)
        .get();

      if (!messages.value || messages.value.length === 0) {
        console.log("No emails found with attachments.");
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
    if (!this.graphClient) {
      return [];
    }

    try {
      // Get message details to extract the sender domain
      const message = await this.graphClient
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
      const attachmentsResponse = await this.graphClient
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
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error(
        `Failed to process attachments for message ${messageId}: ${errorMessage}`,
      );
      return [];
    }
  }
}
