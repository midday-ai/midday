import type { Database } from "@midday/db/client";
import { updateInboxAccount } from "@midday/db/queries";
import { encrypt } from "@midday/encryption";
import { createLoggerWithContext } from "@midday/logger";
import { ensureFileExtension } from "@midday/utils";
import type { Credentials } from "google-auth-library";
import { type Auth, type gmail_v1, google } from "googleapis";
import { decodeBase64Url } from "../attachments";
import { generateDeterministicId } from "../generate-id";
import type {
  Attachment,
  EmailAttachment,
  GetAttachmentsOptions,
  OAuthProviderInterface,
  Tokens,
  UserInfo,
} from "./types";

export class GmailProvider implements OAuthProviderInterface {
  #oauth2Client: Auth.OAuth2Client;
  #gmail: gmail_v1.Gmail | null = null;
  #accountId: string | null = null;
  #db: Database;
  #logger: ReturnType<typeof createLoggerWithContext>;

  #scopes = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/userinfo.email",
  ];

  constructor(db: Database) {
    this.#db = db;
    this.#logger = createLoggerWithContext("Gmail");

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

    this.#oauth2Client.on(
      "tokens",
      async (tokens: Credentials | null | undefined) => {
        if (!this.#accountId) {
          return;
        }

        try {
          if (tokens?.refresh_token) {
            await updateInboxAccount(this.#db, {
              id: this.#accountId,
              refreshToken: encrypt(tokens.refresh_token),
            });
          }

          if (tokens?.access_token) {
            await updateInboxAccount(this.#db, {
              id: this.#accountId,
              accessToken: encrypt(tokens.access_token),
              expiryDate: new Date(tokens.expiry_date!).toISOString(),
            });
          }
        } catch (error) {
          this.#logger.error("Failed to update tokens in database", { error });
        }
      },
    );
  }

  setAccountId(accountId: string): void {
    this.#accountId = accountId;
  }

  async getAuthUrl(): Promise<string> {
    return this.#oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: this.#scopes,
      state: "gmail",
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
      this.#logger.error("Error exchanging code for tokens", { error });
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to exchange code for tokens: ${message}`);
    }
  }

  setTokens(tokens: Tokens): void {
    if (!tokens.access_token) {
      throw new Error("Access token is required");
    }

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

  async refreshTokens(): Promise<void> {
    if (!this.#accountId) {
      throw new Error("Account ID is required for token refresh");
    }

    try {
      await this.#oauth2Client.refreshAccessToken();
      // The OAuth2Client automatically updates its credentials and emits the 'tokens' event
      // which our event handler will catch and update the database
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";

      // Check for specific Google OAuth errors
      if (message.includes("invalid_grant")) {
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
    try {
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
      this.#logger.error("Error fetching user info", { error });
    }
  }

  async getAttachments(options: GetAttachmentsOptions): Promise<Attachment[]> {
    if (!this.#gmail) {
      throw new Error("Gmail client not initialized. Set tokens first.");
    }

    const { maxResults = 50, lastAccessed, fullSync = false } = options;

    // Detect initial sync
    // fullSync is true when manualSync: true is passed (used for initial/manual syncs)
    // Also treat as initial sync if lastAccessed is not set (new account)
    const isInitialSync = fullSync || !lastAccessed;

    // Build date filter based on sync type and lastAccessed
    let dateFilter = "";
    if (isInitialSync) {
      // For initial sync, don't use date filter - fetch all emails with PDF attachments
      // We'll stop once we have 20 attachments, so this is safe
      // This ensures we can find emails regardless of how old they are
      dateFilter = "";
      this.#logger.info(
        "Initial sync - no date filter (fetching all emails with PDF attachments)",
        {
          note: "Will stop once 20 attachments are collected",
        },
      );
    } else {
      // For subsequent syncs, sync from last access date
      // Subtract 1 day to make it inclusive since Gmail's "after:" is exclusive
      const lastAccessDate = new Date(lastAccessed);
      lastAccessDate.setDate(lastAccessDate.getDate() - 1);
      // Use UTC date to avoid timezone issues
      const year = lastAccessDate.getUTCFullYear();
      const month = String(lastAccessDate.getUTCMonth() + 1).padStart(2, "0");
      const day = String(lastAccessDate.getUTCDate()).padStart(2, "0");
      const formattedDate = `${year}-${month}-${day}`;
      dateFilter = `after:${formattedDate}`;
      this.#logger.info("Date calculation for incremental sync", {
        lastAccessed,
        lastAccessDate: lastAccessDate.toISOString(),
        formattedDate,
        dateFilter,
      });
    }

    try {
      // Use filename:pdf filter for both initial and incremental sync (consistent)
      const query = `-from:me has:attachment filename:pdf ${dateFilter}`.trim();
      this.#logger.info("Query being sent to Gmail API", {
        query,
        maxResults,
        dateFilter: dateFilter || "none",
        isInitialSync,
      });

      // For initial sync, use specialized method that collects up to 20 attachments
      if (isInitialSync) {
        return await this.#fetchAttachmentsForInitialSync(query);
      }

      // For incremental sync, use standard batch processing
      return await this.#fetchAttachmentsForIncrementalSync(query, maxResults);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";

      // Log the full error for debugging
      this.#logger.error("Gmail API error", {
        error: message,
        accountId: this.#accountId,
        timestamp: new Date().toISOString(),
      });

      // Check if it's a specific Gmail API error and provide more context
      if (message.includes("invalid_request")) {
        throw new Error(
          "Invalid refresh token request. Check OAuth2 client configuration.",
        );
      }
      if (message.includes("invalid_grant")) {
        throw new Error(
          "Refresh token is invalid or expired. Re-authentication required.",
        );
      }
      if (message.includes("unauthorized") || message.includes("401")) {
        throw new Error(
          "Access token is invalid or expired. Authentication required.",
        );
      }
      if (message.includes("forbidden") || message.includes("403")) {
        throw new Error("Insufficient permissions or quota exceeded.");
      }

      throw new Error(`Failed to fetch attachments: ${message}`);
    }
  }

  /**
   * Fetch attachments for initial sync - collects up to 20 attachments incrementally
   */
  async #fetchAttachmentsForInitialSync(query: string): Promise<Attachment[]> {
    const TARGET_ATTACHMENTS = 20;
    const MAX_PAGES = 20;
    const MAX_MESSAGES = 200;

    const allAttachments: Attachment[] = [];
    let nextPageToken: string | undefined;
    let pagesFetched = 0;
    let totalMessagesProcessed = 0;
    let lastResultSizeEstimate: number | null | undefined;

    this.#logger.info("Starting initial sync", {
      targetAttachments: TARGET_ATTACHMENTS,
      maxPages: MAX_PAGES,
      maxMessages: MAX_MESSAGES,
    });

    do {
      // Fetch a page of messages
      const listResponse = await this.#gmail!.users.messages.list({
        userId: "me",
        maxResults: 50, // Gmail API max per request
        q: query,
        pageToken: nextPageToken,
      });

      const messagesInPage = listResponse.data.messages?.length || 0;
      lastResultSizeEstimate =
        (listResponse.data.resultSizeEstimate as number | null | undefined) ??
        undefined;

      this.#logger.info("Message list API response (initial sync)", {
        page: pagesFetched + 1,
        messagesInPage,
        totalMessagesProcessed,
        attachmentsCollected: allAttachments.length,
        resultSizeEstimate: lastResultSizeEstimate,
        hasNextPage: !!listResponse.data.nextPageToken,
      });

      if (!listResponse.data.messages || messagesInPage === 0) {
        break;
      }

      // Fetch full message details for this page
      const fetchedMessages = await this.#fetchMessageDetails(
        listResponse.data.messages,
      );

      // Process messages one by one until we have target attachments
      for (const message of fetchedMessages) {
        if (allAttachments.length >= TARGET_ATTACHMENTS) {
          this.#logger.info("Reached target attachment count", {
            target: TARGET_ATTACHMENTS,
            collected: allAttachments.length,
            messagesProcessed: totalMessagesProcessed,
            pagesFetched: pagesFetched + 1,
          });
          return allAttachments;
        }

        const messageAttachments =
          await this.#processMessageToAttachments(message);
        allAttachments.push(...messageAttachments);
        totalMessagesProcessed++;
      }

      nextPageToken = listResponse.data.nextPageToken ?? undefined;
      pagesFetched++;

      // Continue if we haven't reached target and there are more results
      const hasMoreResults =
        nextPageToken ||
        (lastResultSizeEstimate &&
          lastResultSizeEstimate > totalMessagesProcessed);

      // Stop if we hit limits or no more pages/results
    } while (
      allAttachments.length < TARGET_ATTACHMENTS &&
      (nextPageToken ||
        (lastResultSizeEstimate &&
          lastResultSizeEstimate > totalMessagesProcessed)) &&
      pagesFetched < MAX_PAGES &&
      totalMessagesProcessed < MAX_MESSAGES
    );

    this.#logger.info("Initial sync complete", {
      totalPagesFetched: pagesFetched,
      totalMessagesProcessed,
      totalAttachmentsFound: allAttachments.length,
      targetReached: allAttachments.length >= TARGET_ATTACHMENTS,
    });

    return allAttachments;
  }

  /**
   * Fetch attachments for incremental sync - standard batch processing
   */
  async #fetchAttachmentsForIncrementalSync(
    query: string,
    maxResults: number,
  ): Promise<Attachment[]> {
    const MAX_PAGES = 10;

    // Fetch all messages with pagination
    const allMessages: gmail_v1.Schema$Message[] = [];
    let nextPageToken: string | undefined;
    let pagesFetched = 0;

    do {
      const listResponse = await this.#gmail!.users.messages.list({
        userId: "me",
        maxResults: Math.min(maxResults, 50), // Gmail API max per request
        q: query,
        pageToken: nextPageToken,
      });

      const messagesInPage = listResponse.data.messages?.length || 0;
      this.#logger.info("Message list API response (incremental sync)", {
        page: pagesFetched + 1,
        messagesInPage,
        totalMessagesSoFar: allMessages.length,
        resultSizeEstimate: listResponse.data.resultSizeEstimate,
        hasNextPage: !!listResponse.data.nextPageToken,
      });

      if (listResponse.data.messages) {
        allMessages.push(...listResponse.data.messages);
      }

      nextPageToken = listResponse.data.nextPageToken ?? undefined;
      pagesFetched++;

      if (allMessages.length >= maxResults) {
        break;
      }
    } while (
      nextPageToken &&
      pagesFetched < MAX_PAGES &&
      allMessages.length < maxResults
    );

    this.#logger.info("Message list fetch complete", {
      totalPagesFetched: pagesFetched,
      totalMessagesFound: allMessages.length,
      maxPagesLimit: MAX_PAGES,
    });

    // Limit to maxResults
    const messages = allMessages.slice(0, maxResults);

    if (!messages || messages.length === 0) {
      this.#logger.info("No messages found matching query", {
        query,
        totalFound: allMessages.length,
      });
      return [];
    }

    // Fetch full message details
    const fetchedMessages = await this.#fetchMessageDetails(messages);

    this.#logger.info("Message details fetch summary", {
      requested: messages.length,
      successful: fetchedMessages.length,
      failed: messages.length - fetchedMessages.length,
    });

    if (fetchedMessages.length === 0) {
      this.#logger.info("All messages failed to fetch details");
      return [];
    }

    // Process all messages to extract attachments
    this.#logger.info("Processing messages to extract attachments", {
      messageCount: fetchedMessages.length,
    });

    const allAttachmentsPromises = fetchedMessages.map((message) =>
      this.#processMessageToAttachments(message),
    );
    const attachmentsArray = await Promise.all(allAttachmentsPromises);
    const flattenedAttachments = attachmentsArray.flat();

    this.#logger.info("Attachment extraction complete", {
      messagesProcessed: fetchedMessages.length,
      totalAttachmentsFound: flattenedAttachments.length,
    });

    return flattenedAttachments;
  }

  /**
   * Fetch full message details for a list of message IDs
   */
  async #fetchMessageDetails(
    messages: gmail_v1.Schema$Message[],
  ): Promise<gmail_v1.Schema$Message[]> {
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
            this.#logger.error("Failed to fetch message details", {
              messageId: id,
              error: err instanceof Error ? err.message : err,
            });
            return null;
          }),
      );

    return (await Promise.all(messageDetailsPromises)).filter(
      (msg): msg is gmail_v1.Schema$Message => msg !== null,
    );
  }

  async #processMessageToAttachments(
    message: gmail_v1.Schema$Message,
  ): Promise<Attachment[]> {
    if (!message.id) {
      this.#logger.warn("Skipping message - missing ID");
      return [];
    }

    // Check if message has parts or body attachment
    const hasParts = !!message.payload?.parts;
    const hasBodyAttachment = !!message.payload?.body?.attachmentId;

    this.#logger.info("Processing message structure", {
      messageId: message.id,
      hasParts,
      partsCount: message.payload?.parts?.length || 0,
      hasBodyAttachment,
      mimeType: message.payload?.mimeType,
    });

    if (!hasParts && !hasBodyAttachment) {
      this.#logger.warn("Skipping message - no parts or body attachment", {
        messageId: message.id,
        payloadMimeType: message.payload?.mimeType,
      });
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
      let rawAttachments: EmailAttachment[] = [];

      // Handle messages with parts array
      if (message.payload?.parts) {
        rawAttachments = await this.#fetchAttachments(
          message.id,
          message.payload.parts,
        );
      }
      // Handle messages with attachment in body (single attachment)
      else if (message.payload?.body?.attachmentId && this.#gmail) {
        this.#logger.info("Message has attachment in body, not parts", {
          messageId: message.id,
          attachmentId: message.payload.body.attachmentId,
          filename: message.payload.filename,
          mimeType: message.payload.mimeType,
        });

        try {
          const attachmentResponse =
            await this.#gmail.users.messages.attachments.get({
              userId: "me",
              messageId: message.id,
              id: message.payload.body.attachmentId,
            });

          if (attachmentResponse.data.data) {
            const mimeType = message.payload.mimeType || "application/pdf";
            // Only include PDFs
            if (
              mimeType === "application/pdf" ||
              mimeType === "application/octet-stream"
            ) {
              rawAttachments.push({
                filename: message.payload.filename || "attachment.pdf",
                mimeType: mimeType,
                size: attachmentResponse.data.size ?? 0,
                data: attachmentResponse.data.data,
              });
            }
          }
        } catch (error) {
          this.#logger.error("Failed to fetch body attachment", {
            messageId: message.id,
            error: error instanceof Error ? error.message : error,
          });
        }
      }

      this.#logger.info("Raw attachments extracted from message", {
        messageId: message.id,
        rawAttachmentCount: rawAttachments.length,
        attachments: rawAttachments.map((a) => ({
          filename: a.filename,
          mimeType: a.mimeType,
          size: a.size,
        })),
      });

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

      this.#logger.info("Processed attachments for message", {
        messageId: message.id,
        finalAttachmentCount: attachments.length,
      });

      return attachments;
    } catch (error: unknown) {
      const messageText =
        error instanceof Error ? error.message : "Unknown error";
      this.#logger.error("Failed to process attachments for message", {
        messageId: message.id,
        error: messageText,
      });
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
        this.#logger.info("Reached maximum attachment limit", {
          maxAttachments,
          messageId,
        });
        break;
      }

      const mimeType = part.mimeType ?? "application/octet-stream";

      // Log all parts with filenames to see what MIME types we're getting
      if (part.filename) {
        this.#logger.info("Found part with filename", {
          messageId,
          filename: part.filename,
          mimeType,
          hasAttachmentId: !!part.body?.attachmentId,
          size: part.body?.size,
        });
      }

      // Only process parts with PDF or octet-stream MIME types
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
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          this.#logger.error("Failed to fetch attachment", {
            attachmentIdentifier,
            messageId,
            error: errorMessage,
          });
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
          this.#logger.info(
            "Reached maximum attachment limit after processing nested parts",
            {
              maxAttachments,
              messageId,
            },
          );
          break;
        }
      }
    }

    return attachments.slice(0, maxAttachments);
  }
}
