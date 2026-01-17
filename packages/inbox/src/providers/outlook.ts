import {
  type AuthenticationProvider,
  Client,
} from "@microsoft/microsoft-graph-client";
import type { Database } from "@midday/db/client";
import { updateInboxAccount } from "@midday/db/queries";
import { encrypt } from "@midday/encryption";
import { ensureFileExtension } from "@midday/utils";
import { InboxAuthError, InboxSyncError } from "../errors";
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

/**
 * Token expiry buffer in milliseconds.
 * We refresh tokens 5 minutes before they expire to avoid edge cases
 * where a token expires mid-request.
 */
const TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000;

/**
 * Custom AuthenticationProvider that handles token refresh automatically.
 * This is called by the Graph SDK before every request, allowing us to
 * proactively refresh expired tokens.
 */
class OutlookAuthProvider implements AuthenticationProvider {
  #getAccessToken: () => Promise<string>;

  constructor(getAccessToken: () => Promise<string>) {
    this.#getAccessToken = getAccessToken;
  }

  async getAccessToken(): Promise<string> {
    return this.#getAccessToken();
  }
}

export class OutlookProvider implements OAuthProviderInterface {
  #graphClient: Client | null = null;
  #accountId: string | null = null;
  #db: Database;
  #accessToken: string | null = null;
  #refreshToken: string | null = null;
  #expiryDate: number | null = null;

  // Prevent concurrent refresh operations
  #refreshPromise: Promise<void> | null = null;

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
    this.#expiryDate = tokens.expiry_date ?? null;

    // Initialize Microsoft Graph client with custom auth provider
    // This provider is called before every request, allowing proactive token refresh
    const authProvider = new OutlookAuthProvider(() =>
      this.#ensureValidAccessToken(),
    );

    this.#graphClient = Client.initWithMiddleware({
      authProvider,
    });
  }

  /**
   * Ensures we have a valid access token, refreshing if necessary.
   * This is called by the AuthenticationProvider before every Graph request.
   */
  async #ensureValidAccessToken(): Promise<string> {
    if (!this.#accessToken) {
      throw new InboxAuthError({
        code: "token_invalid",
        provider: "outlook",
        message: "No access token available. Authentication required.",
        requiresReauth: true,
      });
    }

    // Check if token is expired or about to expire
    if (this.#isTokenExpiredOrExpiring()) {
      await this.#refreshTokensInternal();
    }

    return this.#accessToken;
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
    if (!this.#refreshToken) {
      throw new InboxAuthError({
        code: "refresh_token_invalid",
        provider: "outlook",
        message: "Refresh token is not available. Re-authentication required.",
        requiresReauth: true,
      });
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
        this.#handleRefreshError(response.status, errorData);
      }

      const tokenResponse = (await response.json()) as MicrosoftTokenResponse;

      if (!tokenResponse.access_token) {
        throw new InboxAuthError({
          code: "token_invalid",
          provider: "outlook",
          message: "Failed to refresh access token",
          requiresReauth: true,
        });
      }

      // Calculate expiry date from expires_in (seconds from now)
      const expiryDate = Date.now() + tokenResponse.expires_in * 1000;

      // Update tokens in memory
      this.#accessToken = tokenResponse.access_token;
      this.#expiryDate = expiryDate;

      // Microsoft may issue a new refresh token (rotation)
      if (tokenResponse.refresh_token) {
        this.#refreshToken = tokenResponse.refresh_token;
      }

      // Persist tokens to database if we have an account ID
      if (this.#accountId) {
        await this.#persistTokensToDatabase(tokenResponse, expiryDate);
      }

      console.log("Successfully refreshed Outlook access token", {
        accountId: this.#accountId,
        newExpiryDate: new Date(expiryDate).toISOString(),
      });
    } catch (error: unknown) {
      // Re-throw InboxAuthError as-is
      if (error instanceof InboxAuthError) {
        throw error;
      }

      const message = error instanceof Error ? error.message : "Unknown error";

      throw new InboxAuthError({
        code: "token_invalid",
        provider: "outlook",
        message: `Token refresh failed: ${message}`,
        requiresReauth: false, // May be transient
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  /**
   * Handles refresh token errors by checking status codes and error codes.
   * This is more reliable than parsing error messages.
   */
  #handleRefreshError(statusCode: number, errorBody: string): never {
    // Try to parse the error response as JSON
    let errorCode: string | undefined;
    let errorDescription: string | undefined;

    try {
      const parsed = JSON.parse(errorBody);
      errorCode = parsed.error;
      errorDescription = parsed.error_description;
    } catch {
      // Not JSON, use raw body
    }

    console.error("Token refresh failed", {
      statusCode,
      errorCode,
      errorDescription,
      accountId: this.#accountId,
    });

    // Check for specific OAuth error codes that indicate the refresh token is invalid
    // These are standard OAuth 2.0 error codes, not message strings
    const invalidRefreshTokenErrors = [
      "invalid_grant", // Refresh token expired, revoked, or invalid
      "invalid_request", // Malformed request (could be bad refresh token)
    ];

    // Azure AD specific error codes (AADSTS*)
    const mfaRequiredPatterns = ["AADSTS50076", "AADSTS50078"];
    const consentRequiredPatterns = ["AADSTS65001"];
    const tokenExpiredPatterns = [
      "AADSTS700082", // Refresh token expired due to inactivity
      "AADSTS700084", // Refresh token was revoked or not found
      "AADSTS50173", // Credential expired
      "AADSTS53003", // Blocked by conditional access
    ];

    // Determine error type based on patterns
    const isMfaRequired = mfaRequiredPatterns.some(
      (pattern) =>
        errorBody.includes(pattern) || errorDescription?.includes(pattern),
    );
    const isConsentRequired = consentRequiredPatterns.some(
      (pattern) =>
        errorBody.includes(pattern) || errorDescription?.includes(pattern),
    );
    const isTokenExpired =
      invalidRefreshTokenErrors.includes(errorCode ?? "") ||
      tokenExpiredPatterns.some(
        (pattern) =>
          errorBody.includes(pattern) || errorDescription?.includes(pattern),
      );

    if (isMfaRequired) {
      throw new InboxAuthError({
        code: "mfa_required",
        provider: "outlook",
        message:
          "Multi-factor authentication required. Re-authentication needed.",
        requiresReauth: true,
      });
    }

    if (isConsentRequired) {
      throw new InboxAuthError({
        code: "consent_required",
        provider: "outlook",
        message: "User consent required. Re-authentication needed.",
        requiresReauth: true,
      });
    }

    if (isTokenExpired) {
      throw new InboxAuthError({
        code: "refresh_token_expired",
        provider: "outlook",
        message:
          "Refresh token is invalid or expired. Re-authentication required.",
        requiresReauth: true,
      });
    }

    // For other errors, include the error code if available
    const errorInfo = errorCode
      ? `${errorCode}: ${errorDescription}`
      : errorBody;
    throw new InboxAuthError({
      code: "token_invalid",
      provider: "outlook",
      message: `Token refresh failed: ${statusCode} ${errorInfo}`,
      requiresReauth: false, // May be transient
    });
  }

  /**
   * Persists refreshed tokens to the database.
   */
  async #persistTokensToDatabase(
    tokenResponse: MicrosoftTokenResponse,
    expiryDate: number,
  ): Promise<void> {
    if (!this.#accountId) return;

    try {
      // Update refresh token if a new one was issued (token rotation)
      if (tokenResponse.refresh_token) {
        await updateInboxAccount(this.#db, {
          id: this.#accountId,
          refreshToken: encrypt(tokenResponse.refresh_token),
        });
      }

      // Always update access token and expiry
      await updateInboxAccount(this.#db, {
        id: this.#accountId,
        accessToken: encrypt(tokenResponse.access_token),
        expiryDate: new Date(expiryDate).toISOString(),
      });
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
      // Re-throw InboxAuthError and InboxSyncError as-is
      if (error instanceof InboxAuthError || error instanceof InboxSyncError) {
        throw error;
      }

      // Extract GraphError properties for reliable error detection
      const graphError = error as {
        statusCode?: number;
        code?: string;
        message?: string;
      };

      const statusCode = graphError.statusCode;
      const errorCode = graphError.code;
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      console.error("Microsoft Graph API error:", {
        statusCode,
        errorCode,
        errorMessage,
        accountId: this.#accountId,
        timestamp: new Date().toISOString(),
      });

      // Use status codes and error codes for reliable detection, not message parsing
      // 401 = Unauthorized (token issues)
      // InvalidAuthenticationToken = Microsoft's error code for token problems
      if (statusCode === 401 || errorCode === "InvalidAuthenticationToken") {
        throw new InboxAuthError({
          code: "token_expired",
          provider: "outlook",
          message:
            "Access token is invalid or expired. Authentication required.",
          requiresReauth: true,
          cause: error instanceof Error ? error : undefined,
        });
      }

      // 403 = Forbidden (permission issues)
      if (statusCode === 403 || errorCode === "Authorization_RequestDenied") {
        throw new InboxAuthError({
          code: "forbidden",
          provider: "outlook",
          message: "Insufficient permissions or access denied.",
          requiresReauth: true,
          cause: error instanceof Error ? error : undefined,
        });
      }

      // 429 = Rate limited
      if (statusCode === 429) {
        throw new InboxSyncError({
          code: "rate_limited",
          provider: "outlook",
          message:
            "Microsoft Graph API rate limit exceeded. Please try again later.",
          cause: error instanceof Error ? error : undefined,
        });
      }

      throw new InboxSyncError({
        code: "fetch_failed",
        provider: "outlook",
        message: `Failed to fetch attachments: ${errorMessage}`,
        cause: error instanceof Error ? error : undefined,
      });
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
