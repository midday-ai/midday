import type { Database } from "@midday/db/client";
import { updateInboxAccount } from "@midday/db/queries";
import { encrypt } from "@midday/encryption";
import { ensureFileExtension } from "@midday/utils";
import type { Credentials } from "google-auth-library";
import { type Auth, type gmail_v1, google } from "googleapis";
import { decodeBase64Url } from "../attachments";
import { InboxAuthError, InboxSyncError } from "../errors";
import { generateDeterministicId } from "../generate-id";
import type {
  Attachment,
  EmailAttachment,
  GetAttachmentsOptions,
  OAuthProviderInterface,
  Tokens,
  UserInfo,
} from "./types";

/**
 * Token expiry buffer in milliseconds.
 * We refresh tokens 5 minutes before they expire to avoid edge cases
 * where a token expires mid-request.
 */
const TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000;

/**
 * Google API error structure
 */
interface GoogleApiError extends Error {
  code?: number;
  response?: {
    status?: number;
    data?: {
      error?: string;
      error_description?: string;
    };
  };
}

export class GmailProvider implements OAuthProviderInterface {
  #oauth2Client: Auth.OAuth2Client;
  #gmail: gmail_v1.Gmail | null = null;
  #accountId: string | null = null;
  #db: Database;
  #expiryDate: number | null = null;

  // Prevent concurrent refresh operations
  #refreshPromise: Promise<void> | null = null;

  #scopes = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/userinfo.email",
  ];

  constructor(db: Database) {
    this.#db = db;

    const clientId = process.env.GMAIL_CLIENT_ID;
    const clientSecret = process.env.GMAIL_CLIENT_SECRET;
    const redirectUri = process.env.GMAIL_REDIRECT_URI;

    if (!clientId || !clientSecret) {
      throw new Error(
        "Missing required Gmail OAuth2 credentials: GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET must be set",
      );
    }

    this.#oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri,
    );
  }

  setAccountId(accountId: string): void {
    this.#accountId = accountId;
  }

  async getAuthUrl(state?: string): Promise<string> {
    return this.#oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: this.#scopes,
      state: state ?? "gmail",
    });
  }

  async exchangeCodeForTokens(code: string): Promise<Tokens> {
    try {
      const { tokens } = await this.#oauth2Client.getToken(code);
      if (!tokens.access_token) {
        throw new Error("Failed to obtain access token.");
      }

      const validTokens: Tokens = {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token ?? undefined,
        expiry_date: tokens.expiry_date ?? undefined,
        scope: tokens.scope ?? undefined,
        token_type: tokens.token_type ?? undefined,
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

    // Track expiry date in memory for proactive refresh
    this.#expiryDate = tokens.expiry_date ?? null;

    const googleCredentials: Credentials = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date,
      scope: tokens.scope,
      token_type: tokens.token_type as Credentials["token_type"],
    };

    this.#oauth2Client.setCredentials(googleCredentials);
    this.#gmail = google.gmail({ version: "v1", auth: this.#oauth2Client });
  }

  /**
   * Checks if the token is expired or will expire within the buffer period.
   */
  #isTokenExpiredOrExpiring(): boolean {
    if (!this.#expiryDate) {
      // If we don't have expiry info, assume token might be expired
      // This is a safe default that triggers a refresh attempt
      return true;
    }

    const now = Date.now();
    const expiresWithBuffer = this.#expiryDate - TOKEN_EXPIRY_BUFFER_MS;

    return now >= expiresWithBuffer;
  }

  /**
   * Ensures we have a valid access token, refreshing if necessary.
   * This is called before making API calls.
   */
  async #ensureValidAccessToken(): Promise<void> {
    const credentials = this.#oauth2Client.credentials;

    if (!credentials.access_token) {
      throw new InboxAuthError({
        code: "token_invalid",
        provider: "gmail",
        message: "No access token available. Authentication required.",
        requiresReauth: true,
      });
    }

    // Check if token is expired or about to expire
    if (this.#isTokenExpiredOrExpiring()) {
      await this.#refreshTokensInternal();
    }
  }

  /**
   * Internal token refresh with concurrency protection.
   * Ensures only one refresh operation happens at a time.
   */
  async #refreshTokensInternal(): Promise<void> {
    // If a refresh is already in progress, wait for it
    if (this.#refreshPromise) {
      return this.#refreshPromise;
    }

    // Start a new refresh operation
    this.#refreshPromise = this.#doRefreshTokens();

    try {
      await this.#refreshPromise;
    } finally {
      this.#refreshPromise = null;
    }
  }

  /**
   * Performs the actual token refresh.
   */
  async #doRefreshTokens(): Promise<void> {
    const credentials = this.#oauth2Client.credentials;

    if (!credentials.refresh_token) {
      throw new InboxAuthError({
        code: "refresh_token_invalid",
        provider: "gmail",
        message: "Refresh token is not available. Re-authentication required.",
        requiresReauth: true,
      });
    }

    try {
      const { credentials: newCredentials } =
        await this.#oauth2Client.refreshAccessToken();

      if (!newCredentials.access_token) {
        throw new InboxAuthError({
          code: "token_invalid",
          provider: "gmail",
          message: "Failed to refresh access token",
          requiresReauth: true,
        });
      }

      // Update expiry date in memory
      if (newCredentials.expiry_date) {
        this.#expiryDate = newCredentials.expiry_date;
      }

      // Persist tokens to database if we have an account ID
      if (this.#accountId) {
        await this.#persistTokensToDatabase(newCredentials);
      }

      console.log("Successfully refreshed Gmail access token", {
        accountId: this.#accountId,
        newExpiryDate: newCredentials.expiry_date
          ? new Date(newCredentials.expiry_date).toISOString()
          : "unknown",
      });
    } catch (error: unknown) {
      // Re-throw InboxAuthError as-is
      if (error instanceof InboxAuthError) {
        throw error;
      }

      const googleError = error as GoogleApiError;
      const statusCode = googleError.code ?? googleError.response?.status;
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      console.error("Token refresh failed", {
        statusCode,
        errorMessage,
        accountId: this.#accountId,
      });

      // Check for specific Google OAuth error codes
      if (
        statusCode === 400 ||
        statusCode === 401 ||
        errorMessage.includes("invalid_grant")
      ) {
        throw new InboxAuthError({
          code: "refresh_token_expired",
          provider: "gmail",
          message:
            "Refresh token is invalid or expired. Re-authentication required.",
          requiresReauth: true,
          cause: error instanceof Error ? error : undefined,
        });
      }

      if (errorMessage.includes("invalid_request")) {
        throw new InboxAuthError({
          code: "token_invalid",
          provider: "gmail",
          message:
            "Invalid refresh token request. Check OAuth2 client configuration.",
          requiresReauth: true,
          cause: error instanceof Error ? error : undefined,
        });
      }

      throw new InboxAuthError({
        code: "token_invalid",
        provider: "gmail",
        message: `Token refresh failed: ${errorMessage}`,
        requiresReauth: false, // May be transient
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  /**
   * Persists refreshed tokens to the database.
   */
  async #persistTokensToDatabase(credentials: Credentials): Promise<void> {
    if (!this.#accountId) return;

    try {
      // Update refresh token if a new one was issued (token rotation)
      if (credentials.refresh_token) {
        await updateInboxAccount(this.#db, {
          id: this.#accountId,
          refreshToken: encrypt(credentials.refresh_token),
        });
      }

      // Always update access token and expiry
      if (credentials.access_token) {
        await updateInboxAccount(this.#db, {
          id: this.#accountId,
          accessToken: encrypt(credentials.access_token),
          expiryDate: credentials.expiry_date
            ? new Date(credentials.expiry_date).toISOString()
            : undefined,
        });
      }
    } catch (error) {
      console.error("Failed to persist tokens to database:", error);
      // Don't throw - the refresh itself succeeded, we just failed to persist
    }
  }

  /**
   * Public method for explicit token refresh (used by connector retry logic).
   */
  async refreshTokens(): Promise<void> {
    if (!this.#accountId) {
      throw new Error("Account ID is required for token refresh");
    }

    await this.#refreshTokensInternal();
  }

  async getUserInfo(): Promise<UserInfo | undefined> {
    try {
      // Ensure token is valid before making API call
      await this.#ensureValidAccessToken();

      const oauth2 = google.oauth2({
        auth: this.#oauth2Client,
        version: "v2",
      });

      const userInfoResponse = await oauth2.userinfo.get();
      const userInfo = userInfoResponse.data;

      return {
        id: userInfo.id ?? undefined,
        email: userInfo.email ?? undefined,
        name: userInfo.name ?? undefined,
      };
    } catch (error: unknown) {
      console.error("Error fetching user info:", error);
      return undefined;
    }
  }

  async getAttachments(options: GetAttachmentsOptions): Promise<Attachment[]> {
    if (!this.#gmail) {
      throw new Error("Gmail client not initialized. Set tokens first.");
    }

    // Proactively refresh token if expired or expiring soon
    await this.#ensureValidAccessToken();

    const { maxResults = 50, lastAccessed, fullSync = false } = options;

    // Build date filter based on sync type and lastAccessed
    let dateFilter = "";
    if (fullSync || !lastAccessed) {
      // For full syncs (initial or manual) or accounts without lastAccessed, fetch last 30 days to capture recent business documents
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const formattedDate = thirtyDaysAgo.toISOString().split("T")[0];
      dateFilter = `after:${formattedDate}`;
    } else {
      // For subsequent syncs, sync from last access date
      // Subtract 1 day to make it inclusive since Gmail's "after:" is exclusive
      const lastAccessDate = new Date(lastAccessed);
      lastAccessDate.setDate(lastAccessDate.getDate() - 1);
      const formattedDate = lastAccessDate.toISOString().split("T")[0]; // YYYY-MM-DD format
      dateFilter = `after:${formattedDate}`;
    }

    try {
      const query = `-from:me has:attachment filename:pdf ${dateFilter}`;

      // Fetch messages with pagination to handle high-volume days
      const allMessages: gmail_v1.Schema$Message[] = [];
      let nextPageToken: string | undefined;
      const maxPagesToFetch = 3; // Limit to prevent infinite loops
      let pagesFetched = 0;

      do {
        const listResponse = await this.#gmail.users.messages.list({
          userId: "me",
          maxResults: Math.min(maxResults, 50), // Gmail API max per request
          q: query,
          pageToken: nextPageToken,
        });

        if (listResponse.data.messages) {
          allMessages.push(...listResponse.data.messages);
        }

        nextPageToken = listResponse.data.nextPageToken ?? undefined;
        pagesFetched++;

        // Stop if we have enough messages or hit our page limit
      } while (
        nextPageToken &&
        allMessages.length < maxResults &&
        pagesFetched < maxPagesToFetch
      );

      // Limit to maxResults to respect our system limits
      const messages = allMessages.slice(0, maxResults);

      if (!messages || messages.length === 0) {
        console.log(
          "No emails found with PDF attachments matching the criteria.",
        );
        return [];
      }

      const messageDetailsPromises = messages
        .map((m: gmail_v1.Schema$Message) => m.id!)
        .filter((id): id is string => Boolean(id))
        .map((id: string) =>
          this.#gmail!.users.messages.get({
            userId: "me",
            id: id,
            format: "full",
          })
            .then((res) => res.data)
            .catch((err: unknown) => {
              console.error(
                `Failed to fetch message ${id}:`,
                err instanceof Error ? err.message : err,
              );
              return null;
            }),
        );

      const fetchedMessages = (
        await Promise.all(messageDetailsPromises)
      ).filter((msg): msg is gmail_v1.Schema$Message => msg !== null);

      if (fetchedMessages.length === 0) {
        console.log("All filtered messages failed to fetch details.");
        return [];
      }

      const allAttachmentsPromises = fetchedMessages.map((message) =>
        this.#processMessageToAttachments(message),
      );

      const attachmentsArray = await Promise.all(allAttachmentsPromises);
      const flattenedAttachments = attachmentsArray.flat();

      return flattenedAttachments;
    } catch (error: unknown) {
      // Re-throw InboxAuthError and InboxSyncError as-is
      if (error instanceof InboxAuthError || error instanceof InboxSyncError) {
        throw error;
      }

      // Extract Google API error properties for reliable error detection
      const googleError = error as GoogleApiError;
      const statusCode = googleError.code ?? googleError.response?.status;
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // Log the full error for debugging
      console.error("Gmail API error:", {
        statusCode,
        errorMessage,
        accountId: this.#accountId,
        timestamp: new Date().toISOString(),
      });

      // Use status codes for reliable detection, not message parsing
      // 401 = Unauthorized (token issues)
      if (statusCode === 401) {
        throw new InboxAuthError({
          code: "token_expired",
          provider: "gmail",
          message:
            "Access token is invalid or expired. Authentication required.",
          requiresReauth: true,
          cause: error instanceof Error ? error : undefined,
        });
      }

      // 403 = Forbidden (permission issues or quota)
      if (statusCode === 403) {
        throw new InboxAuthError({
          code: "forbidden",
          provider: "gmail",
          message: "Insufficient permissions or quota exceeded.",
          requiresReauth: true,
          cause: error instanceof Error ? error : undefined,
        });
      }

      // 400 = Bad request (could be token issues)
      if (statusCode === 400 && errorMessage.includes("invalid_grant")) {
        throw new InboxAuthError({
          code: "refresh_token_expired",
          provider: "gmail",
          message:
            "Refresh token is invalid or expired. Re-authentication required.",
          requiresReauth: true,
          cause: error instanceof Error ? error : undefined,
        });
      }

      // 429 = Rate limited
      if (statusCode === 429) {
        throw new InboxSyncError({
          code: "rate_limited",
          provider: "gmail",
          message: "Gmail API rate limit exceeded. Please try again later.",
          cause: error instanceof Error ? error : undefined,
        });
      }

      throw new InboxSyncError({
        code: "fetch_failed",
        provider: "gmail",
        message: `Failed to fetch attachments: ${errorMessage}`,
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  async #processMessageToAttachments(
    message: gmail_v1.Schema$Message,
  ): Promise<Attachment[]> {
    if (!message.id || !message.payload?.parts) {
      console.warn(
        `Skipping message ${message.id} due to missing ID or parts.`,
      );
      return [];
    }

    // Find the 'From' header to extract sender details
    const fromHeader = message.payload?.headers?.find(
      (h) => h.name === "From",
    )?.value;
    let senderDomain: string | undefined;
    let senderEmail: string | undefined;

    if (fromHeader) {
      const emailMatch = fromHeader.match(/<([^>]+)>/);
      const email = emailMatch ? emailMatch[1] : fromHeader;
      senderEmail = email?.includes("@") ? email : undefined;
      const domain = email?.split("@")[1];

      // Extract root domain (remove subdomains)
      if (domain) {
        const domainParts = domain.split(".");
        const partsCount = domainParts.length;

        // Get the root domain (last two parts or just the domain if it's a simple domain)
        senderDomain =
          partsCount >= 2
            ? `${domainParts[partsCount - 2]}.${domainParts[partsCount - 1]}`
            : domain;
      }
    }

    try {
      const rawAttachments = await this.#fetchAttachments(
        message.id,
        message.payload.parts,
      );

      const attachments: Attachment[] = rawAttachments.map((att) => {
        const filename = ensureFileExtension(att.filename, att.mimeType);
        const referenceId = generateDeterministicId(
          `${message.id}_${filename}`,
        );

        return {
          id: referenceId,
          filename,
          mimeType: att.mimeType,
          size: att.size,
          data: decodeBase64Url(att.data),
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

  async #fetchAttachments(
    messageId: string,
    parts: gmail_v1.Schema$MessagePart[],
  ): Promise<EmailAttachment[]> {
    const attachments: EmailAttachment[] = [];
    let attachmentsCount = 0;
    const maxAttachments = 5;

    if (!this.#gmail) return attachments;

    for (const part of parts) {
      if (attachmentsCount >= maxAttachments) {
        console.log(
          `Reached maximum attachment limit (${maxAttachments}) for message ${messageId}. Skipping further attachments.`,
        );
        break;
      }

      // Only process parts with PDF or octet-stream MIME types
      const mimeType = part.mimeType ?? "application/octet-stream";

      if (
        part.filename &&
        part.body?.attachmentId &&
        (mimeType === "application/pdf" ||
          mimeType === "application/octet-stream")
      ) {
        try {
          const attachmentResponse =
            await this.#gmail.users.messages.attachments.get({
              userId: "me",
              messageId: messageId,
              id: part.body.attachmentId,
            });

          if (attachmentResponse.data.data) {
            attachments.push({
              filename: part.filename,
              mimeType: mimeType,
              size: attachmentResponse.data.size ?? 0,
              data: attachmentResponse.data.data,
            });
            attachmentsCount++;
          }
        } catch (error: unknown) {
          const attachmentIdentifier =
            part.filename || `attachment with ID ${part.body.attachmentId}`;
          const message =
            error instanceof Error ? error.message : "Unknown error";
          console.error(
            `Failed to fetch ${attachmentIdentifier} for message ${messageId}: ${message}`,
            error,
          );
        }
      }

      if (part.parts) {
        const nestedAttachments = await this.#fetchAttachments(
          messageId,
          part.parts,
        );
        attachments.push(...nestedAttachments);
        attachmentsCount = attachments.length;
        if (attachmentsCount >= maxAttachments) {
          console.log(
            `Reached maximum attachment limit (${maxAttachments}) after processing nested parts for message ${messageId}.`,
          );
          break;
        }
      }
    }

    return attachments.slice(0, maxAttachments);
  }
}
