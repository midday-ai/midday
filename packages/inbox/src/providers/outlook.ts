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
  MicrosoftTokenResponse,
  OAuthProviderInterface,
  OutlookAttachment,
  OutlookMessage,
  Tokens,
  UserInfo,
} from "./types";

export class OutlookProvider implements OAuthProviderInterface {
  #graphClient: Client | null = null;
  #accountId: string | null = null;
  #db: Database;
  #accessToken: string | null = null;
  #refreshToken: string | null = null;

  #clientId: string;
  #clientSecret: string;
  #redirectUri: string;

  #scopes = [
    "https://graph.microsoft.com/Mail.Read",
    "https://graph.microsoft.com/User.Read",
    "offline_access",
  ];

  #tokenEndpoint = "https://login.microsoftonline.com/common/oauth2/v2.0/token";
  #authorizeEndpoint =
    "https://login.microsoftonline.com/common/oauth2/v2.0/authorize";

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

    if (!redirectUri) {
      throw new Error("OUTLOOK_REDIRECT_URI must be set");
    }

    this.#clientId = clientId;
    this.#clientSecret = clientSecret;
    this.#redirectUri = redirectUri;
  }

  setAccountId(accountId: string): void {
    this.#accountId = accountId;
  }

  async getAuthUrl(state?: string): Promise<string> {
    const params = new URLSearchParams({
      client_id: this.#clientId,
      response_type: "code",
      redirect_uri: this.#redirectUri,
      scope: this.#scopes.join(" "),
      state: state ?? "outlook",
      prompt: "consent",
      response_mode: "query",
    });

    return `${this.#authorizeEndpoint}?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string): Promise<Tokens> {
    try {
      const params = new URLSearchParams({
        client_id: this.#clientId,
        client_secret: this.#clientSecret,
        code,
        redirect_uri: this.#redirectUri,
        grant_type: "authorization_code",
        scope: this.#scopes.join(" "),
      });

      const response = await fetch(this.#tokenEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(
          `Token exchange failed: ${response.status} ${errorData}`,
        );
      }

      const tokenResponse = (await response.json()) as MicrosoftTokenResponse;

      if (!tokenResponse.access_token) {
        throw new Error("Failed to obtain access token.");
      }

      // Calculate expiry date from expires_in (seconds from now)
      const expiryDate = Date.now() + tokenResponse.expires_in * 1000;

      const validTokens: Tokens = {
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
        expiry_date: expiryDate,
        scope: tokenResponse.scope,
        token_type: tokenResponse.token_type,
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
      const params = new URLSearchParams({
        client_id: this.#clientId,
        client_secret: this.#clientSecret,
        refresh_token: this.#refreshToken,
        grant_type: "refresh_token",
        scope: this.#scopes.join(" "),
      });

      const response = await fetch(this.#tokenEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorData = await response.text();

        // Check for specific Microsoft identity platform errors
        if (
          errorData.includes("invalid_grant") ||
          errorData.includes("AADSTS700082") ||
          errorData.includes("AADSTS50076")
        ) {
          throw new Error(
            "Refresh token is invalid or expired. Re-authentication required.",
          );
        }
        if (errorData.includes("invalid_request")) {
          throw new Error(
            "Invalid refresh token request. Check OAuth2 client configuration.",
          );
        }

        throw new Error(
          `Token refresh failed: ${response.status} ${errorData}`,
        );
      }

      const tokenResponse = (await response.json()) as MicrosoftTokenResponse;

      if (!tokenResponse.access_token) {
        throw new Error("Failed to refresh access token");
      }

      // Calculate expiry date from expires_in (seconds from now)
      const expiryDate = Date.now() + tokenResponse.expires_in * 1000;

      // Update tokens in memory
      this.#accessToken = tokenResponse.access_token;
      if (tokenResponse.refresh_token) {
        this.#refreshToken = tokenResponse.refresh_token;
      }

      // Re-initialize Graph client with new token
      this.#graphClient = Client.init({
        authProvider: (done) => {
          done(null, this.#accessToken!);
        },
      });

      // Update tokens in database
      if (tokenResponse.refresh_token) {
        await updateInboxAccount(this.#db, {
          id: this.#accountId,
          refreshToken: encrypt(tokenResponse.refresh_token),
        });
      }

      await updateInboxAccount(this.#db, {
        id: this.#accountId,
        accessToken: encrypt(tokenResponse.access_token),
        expiryDate: new Date(expiryDate).toISOString(),
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";

      // Re-throw if it's already a formatted error
      if (
        message.includes("Re-authentication required") ||
        message.includes("Check OAuth2 client configuration")
      ) {
        throw error;
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

    // Get the current user's email to exclude self-sent messages
    const userInfo = await this.getUserInfo();
    const userEmail = userInfo?.email?.toLowerCase();

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
      // Query for messages with attachments
      // Microsoft Graph uses OData query syntax
      // Note: We filter out self-sent messages in JavaScript because Microsoft Graph
      // doesn't support complex OData filters with nested properties like from/emailAddress/address
      // IMPORTANT: Properties in $orderby must appear FIRST in $filter to avoid
      // "The restriction or sort order is too complex" error
      const allMessages: OutlookMessage[] = [];
      let nextLink: string | undefined;
      const maxPagesToFetch = 3;
      let pagesFetched = 0;

      // receivedDateTime must come first since we order by it
      const filter = `${dateFilter} and hasAttachments eq true`;

      // Initial request
      let response = await this.#graphClient
        .api("/me/messages")
        .filter(filter)
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

      // Filter out self-sent messages and limit to maxResults
      const messages = allMessages
        .filter((msg) => {
          if (!userEmail) return true;
          const senderEmail = msg.from?.emailAddress?.address?.toLowerCase();
          return senderEmail !== userEmail;
        })
        .slice(0, maxResults);

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
      // List attachments without $select - Microsoft Graph returns all base properties
      // including @odata.type automatically. contentBytes requires fetching individually.
      const attachmentsResponse = await this.#graphClient
        .api(`/me/messages/${message.id}/attachments`)
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
        // Note: Unlike Gmail which pre-filters with `filename:pdf` in the API query,
        // Outlook only filters for `hasAttachments eq true`, so we must filter locally.
        // We check for application/octet-stream + .pdf extension to avoid false positives
        // (e.g., .docx, .xlsx files that also use application/octet-stream).
        const mimeType = att.contentType ?? "application/octet-stream";
        const hasPdfExtension =
          att.name?.toLowerCase().endsWith(".pdf") ?? false;
        const isPdf =
          mimeType === "application/pdf" ||
          (mimeType === "application/octet-stream" && hasPdfExtension);

        // Skip inline attachments (they have @odata.type of #microsoft.graph.itemAttachment)
        const isFileAttachment =
          att["@odata.type"] === "#microsoft.graph.fileAttachment";

        if (att.name && isPdf && isFileAttachment) {
          // Fetch the individual attachment to get contentBytes
          const fullAttachment = await this.#graphClient!.api(
            `/me/messages/${message.id}/attachments/${att.id}`,
          ).get();

          if (fullAttachment.contentBytes) {
            pdfAttachments.push({
              filename: att.name,
              mimeType:
                mimeType === "application/octet-stream"
                  ? "application/pdf"
                  : mimeType,
              size: att.size,
              data: fullAttachment.contentBytes,
            });
          }
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
