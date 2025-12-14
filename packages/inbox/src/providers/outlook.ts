import {
  type AuthorizationCodeRequest,
  type AuthorizationUrlRequest,
  ConfidentialClientApplication,
  type Configuration,
} from "@azure/msal-node";
import { Client } from "@microsoft/microsoft-graph-client";
import type { Database } from "@midday/db/client";
import { updateInboxAccount } from "@midday/db/queries";
import { encrypt } from "@midday/encryption";
import { ensureFileExtension } from "@midday/utils";
import { generateDeterministicId } from "../generate-id";
import type {
  Attachment,
  EmailAttachment,
  GetAttachmentsOptions,
  OAuthProviderInterface,
  Tokens,
  UserInfo,
} from "./types";

interface OutlookMessage {
  id: string;
  from?: {
    emailAddress?: {
      address?: string;
    };
  };
  hasAttachments?: boolean;
}

interface OutlookAttachment {
  id: string;
  name: string;
  contentType: string;
  size: number;
  contentBytes?: string;
  "@odata.type"?: string;
}

export class OutlookProvider implements OAuthProviderInterface {
  #msalClient: ConfidentialClientApplication;
  #graphClient: Client | null = null;
  #accountId: string | null = null;
  #db: Database;
  #accessToken: string | null = null;
  #refreshToken: string | null = null;
  #expiryDate: number | null = null;

  #scopes = [
    "https://graph.microsoft.com/Mail.Read",
    "https://graph.microsoft.com/User.Read",
    "offline_access",
  ];

  constructor(db: Database) {
    this.#db = db;

    const clientId = process.env.OUTLOOK_CLIENT_ID;
    const clientSecret = process.env.OUTLOOK_CLIENT_SECRET;
    const redirectUri = process.env.OUTLOOK_REDIRECT_URI;

    if (!clientId || !clientSecret) {
      throw new Error(
        "Missing required Outlook OAuth2 credentials: OUTLOOK_CLIENT_ID and OUTLOOK_CLIENT_SECRET must be set",
      );
    }

    const msalConfig: Configuration = {
      auth: {
        clientId,
        clientSecret,
        authority: "https://login.microsoftonline.com/common",
      },
    };

    this.#msalClient = new ConfidentialClientApplication(msalConfig);
  }

  setAccountId(accountId: string): void {
    this.#accountId = accountId;
  }

  async getAuthUrl(): Promise<string> {
    const redirectUri = process.env.OUTLOOK_REDIRECT_URI;

    if (!redirectUri) {
      throw new Error("OUTLOOK_REDIRECT_URI must be set");
    }

    const authCodeUrlParameters: AuthorizationUrlRequest = {
      scopes: this.#scopes,
      redirectUri,
      state: "outlook",
      prompt: "consent",
    };

    return this.#msalClient.getAuthCodeUrl(authCodeUrlParameters);
  }

  async exchangeCodeForTokens(code: string): Promise<Tokens> {
    const redirectUri = process.env.OUTLOOK_REDIRECT_URI;

    if (!redirectUri) {
      throw new Error("OUTLOOK_REDIRECT_URI must be set");
    }

    try {
      const tokenRequest: AuthorizationCodeRequest = {
        code,
        scopes: this.#scopes,
        redirectUri,
      };

      const response = await this.#msalClient.acquireTokenByCode(tokenRequest);

      if (!response?.accessToken) {
        throw new Error("Failed to obtain access token.");
      }

      // Calculate expiry date from expiresOn
      const expiryDate = response.expiresOn
        ? new Date(response.expiresOn).getTime()
        : Date.now() + 3600 * 1000;

      const validTokens: Tokens = {
        access_token: response.accessToken,
        // MSAL doesn't directly expose refresh_token in the response for security reasons
        // but it handles refresh internally. We store what we have for our token management
        refresh_token: (response as unknown as { refreshToken?: string })
          .refreshToken,
        expiry_date: expiryDate,
        scope: response.scopes?.join(" "),
        token_type: "Bearer",
      };

      this.setTokens(validTokens);
      return validTokens;
    } catch (error: unknown) {
      console.error("Error exchanging code for tokens:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to exchange code for tokens: ${message}`);
    }
  }

  setTokens(tokens: Tokens): void {
    if (!tokens.access_token) {
      throw new Error("Access token is required");
    }

    this.#accessToken = tokens.access_token;
    this.#refreshToken = tokens.refresh_token ?? null;
    this.#expiryDate = tokens.expiry_date ?? null;

    // Initialize Microsoft Graph client with the access token
    this.#graphClient = Client.init({
      authProvider: (done) => {
        done(null, this.#accessToken!);
      },
    });
  }

  async refreshTokens(): Promise<void> {
    if (!this.#accountId) {
      throw new Error("Account ID is required for token refresh");
    }

    if (!this.#refreshToken) {
      throw new Error(
        "Refresh token is not available. Re-authentication required.",
      );
    }

    try {
      // MSAL handles token refresh through the silent flow
      // We need to use acquireTokenByRefreshToken for confidential clients
      const response = await (
        this.#msalClient as unknown as {
          acquireTokenByRefreshToken: (params: {
            refreshToken: string;
            scopes: string[];
          }) => Promise<{
            accessToken: string;
            expiresOn?: Date;
            refreshToken?: string;
          }>;
        }
      ).acquireTokenByRefreshToken({
        refreshToken: this.#refreshToken,
        scopes: this.#scopes,
      });

      if (!response?.accessToken) {
        throw new Error("Failed to refresh access token");
      }

      const expiryDate = response.expiresOn
        ? new Date(response.expiresOn).getTime()
        : Date.now() + 3600 * 1000;

      // Update tokens in memory
      this.#accessToken = response.accessToken;
      if (response.refreshToken) {
        this.#refreshToken = response.refreshToken;
      }
      this.#expiryDate = expiryDate;

      // Re-initialize Graph client with new token
      this.#graphClient = Client.init({
        authProvider: (done) => {
          done(null, this.#accessToken!);
        },
      });

      // Update tokens in database
      if (response.refreshToken) {
        await updateInboxAccount(this.#db, {
          id: this.#accountId,
          refreshToken: encrypt(response.refreshToken),
        });
      }

      await updateInboxAccount(this.#db, {
        id: this.#accountId,
        accessToken: encrypt(response.accessToken),
        expiryDate: new Date(expiryDate).toISOString(),
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";

      if (
        message.includes("invalid_grant") ||
        message.includes("AADSTS700082")
      ) {
        throw new Error(
          "Refresh token is invalid or expired. Re-authentication required.",
        );
      }
      if (message.includes("invalid_request")) {
        throw new Error(
          "Invalid refresh token request. Check OAuth2 client configuration.",
        );
      }

      throw new Error(`Token refresh failed: ${message}`);
    }
  }

  async getUserInfo(): Promise<UserInfo | undefined> {
    if (!this.#graphClient) {
      throw new Error("Graph client not initialized. Set tokens first.");
    }

    try {
      const user = await this.#graphClient.api("/me").get();

      return {
        id: user.id ?? undefined,
        email: user.mail ?? user.userPrincipalName ?? undefined,
        name: user.displayName ?? undefined,
      };
    } catch (error: unknown) {
      console.error("Error fetching user info:", error);
      return undefined;
    }
  }

  async getAttachments(options: GetAttachmentsOptions): Promise<Attachment[]> {
    if (!this.#graphClient) {
      throw new Error("Graph client not initialized. Set tokens first.");
    }

    const { maxResults = 50, lastAccessed, fullSync = false } = options;

    // Build date filter based on sync type and lastAccessed
    let dateFilter: string;
    if (fullSync || !lastAccessed) {
      // For full syncs, fetch last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      dateFilter = `receivedDateTime ge ${thirtyDaysAgo.toISOString()}`;
    } else {
      // For subsequent syncs, sync from last access date minus 1 day
      const lastAccessDate = new Date(lastAccessed);
      lastAccessDate.setDate(lastAccessDate.getDate() - 1);
      dateFilter = `receivedDateTime ge ${lastAccessDate.toISOString()}`;
    }

    try {
      // Query for messages with attachments, not from self
      // Microsoft Graph uses OData query syntax
      const allMessages: OutlookMessage[] = [];
      let nextLink: string | undefined;
      const maxPagesToFetch = 3;
      let pagesFetched = 0;

      // Initial request
      let response = await this.#graphClient
        .api("/me/messages")
        .filter(`hasAttachments eq true and ${dateFilter}`)
        .select("id,from,hasAttachments")
        .top(Math.min(maxResults, 50))
        .orderby("receivedDateTime desc")
        .get();

      if (response.value) {
        allMessages.push(...response.value);
      }
      nextLink = response["@odata.nextLink"];
      pagesFetched++;

      // Pagination
      while (
        nextLink &&
        allMessages.length < maxResults &&
        pagesFetched < maxPagesToFetch
      ) {
        response = await this.#graphClient.api(nextLink).get();

        if (response.value) {
          allMessages.push(...response.value);
        }
        nextLink = response["@odata.nextLink"];
        pagesFetched++;
      }

      // Limit to maxResults
      const messages = allMessages.slice(0, maxResults);

      if (!messages || messages.length === 0) {
        console.log(
          "No emails found with PDF attachments matching the criteria.",
        );
        return [];
      }

      // Process messages to get attachments
      const allAttachmentsPromises = messages.map((message) =>
        this.#processMessageToAttachments(message),
      );

      const attachmentsArray = await Promise.all(allAttachmentsPromises);
      const flattenedAttachments = attachmentsArray.flat();

      return flattenedAttachments;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";

      console.error("Microsoft Graph API error:", {
        error: message,
        accountId: this.#accountId,
        timestamp: new Date().toISOString(),
      });

      if (
        message.includes("InvalidAuthenticationToken") ||
        message.includes("401")
      ) {
        throw new Error(
          "unauthorized - Access token is invalid or expired. Authentication required.",
        );
      }
      if (
        message.includes("Authorization_RequestDenied") ||
        message.includes("403")
      ) {
        throw new Error(
          "forbidden - Insufficient permissions or access denied.",
        );
      }

      throw new Error(`Failed to fetch attachments: ${message}`);
    }
  }

  async #processMessageToAttachments(
    message: OutlookMessage,
  ): Promise<Attachment[]> {
    if (!message.id || !this.#graphClient) {
      console.warn(`Skipping message ${message.id} due to missing ID.`);
      return [];
    }

    // Extract sender details
    let senderDomain: string | undefined;
    let senderEmail: string | undefined;

    if (message.from?.emailAddress?.address) {
      senderEmail = message.from.emailAddress.address;
      const domain = senderEmail.split("@")[1];

      if (domain) {
        const domainParts = domain.split(".");
        const partsCount = domainParts.length;
        senderDomain =
          partsCount >= 2
            ? `${domainParts[partsCount - 2]}.${domainParts[partsCount - 1]}`
            : domain;
      }
    }

    try {
      // Fetch attachments for this message
      const attachmentsResponse = await this.#graphClient
        .api(`/me/messages/${message.id}/attachments`)
        .select("id,name,contentType,size,contentBytes")
        .get();

      const rawAttachments: OutlookAttachment[] =
        attachmentsResponse.value || [];
      const pdfAttachments: EmailAttachment[] = [];
      const maxAttachments = 5;

      for (const att of rawAttachments) {
        if (pdfAttachments.length >= maxAttachments) {
          console.log(
            `Reached maximum attachment limit (${maxAttachments}) for message ${message.id}.`,
          );
          break;
        }

        // Only process PDF attachments
        const mimeType = att.contentType ?? "application/octet-stream";
        const isPdf =
          mimeType === "application/pdf" ||
          mimeType === "application/octet-stream" ||
          att.name?.toLowerCase().endsWith(".pdf");

        // Skip inline attachments (they have @odata.type of #microsoft.graph.itemAttachment)
        const isFileAttachment =
          att["@odata.type"] === "#microsoft.graph.fileAttachment";

        if (isPdf && isFileAttachment && att.contentBytes) {
          pdfAttachments.push({
            filename: att.name,
            mimeType:
              mimeType === "application/octet-stream"
                ? "application/pdf"
                : mimeType,
            size: att.size,
            data: att.contentBytes,
          });
        }
      }

      const attachments: Attachment[] = pdfAttachments.map((att) => {
        const filename = ensureFileExtension(att.filename, att.mimeType);
        const referenceId = generateDeterministicId(
          `${message.id}_${filename}`,
        );

        return {
          id: referenceId,
          filename,
          mimeType: att.mimeType,
          size: att.size,
          data: Buffer.from(att.data, "base64"),
          website: senderDomain,
          senderEmail: senderEmail,
          referenceId: referenceId,
        };
      });

      return attachments;
    } catch (error: unknown) {
      const messageText =
        error instanceof Error ? error.message : "Unknown error";
      console.error(
        `Failed to process attachments for message ${message.id}: ${messageText}`,
      );
      return [];
    }
  }
}
