import type { Credentials } from "google-auth-library";
import { type Auth, type gmail_v1, google } from "googleapis";
import { decodeBase64Url, ensurePdfExtension } from "../attachments";
import { generateDeterministicId } from "../generate-id";
import { updateAccessToken, updateRefreshToken } from "../tokens";
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

  #scopes = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/userinfo.email",
  ];

  constructor() {
    const clientId = process.env.GMAIL_CLIENT_ID;
    const clientSecret = process.env.GMAIL_CLIENT_SECRET;
    const redirectUri = process.env.GMAIL_REDIRECT_URI;

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

        if (tokens?.refresh_token) {
          await updateRefreshToken({
            accountId: this.#accountId,
            refreshToken: tokens.refresh_token,
          });
        }

        if (tokens?.access_token) {
          await updateAccessToken({
            accountId: this.#accountId,
            accessToken: tokens.access_token,
            expiryDate: new Date(tokens.expiry_date!).toISOString(),
          });
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
      console.error("Error exchanging code for tokens:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to exchange code for tokens: ${message}`);
    }
  }

  setTokens(tokens: Tokens): void {
    if (!tokens.access_token) {
      throw new Error("Access token is required.");
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
      console.error("Error fetching user info:", error);
    }
  }

  async getAttachments(options: GetAttachmentsOptions): Promise<Attachment[]> {
    if (!this.#gmail) {
      throw new Error("Gmail client not initialized. Set tokens first.");
    }

    const { maxResults = 10 } = options;

    try {
      const listResponse = await this.#gmail.users.messages.list({
        userId: "me",
        maxResults: maxResults,
        q: "-from:me has:attachment filename:pdf",
      });

      const messages = listResponse.data.messages;
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
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to fetch attachments: ${message}`);
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

    if (fromHeader) {
      const emailMatch = fromHeader.match(/<([^>]+)>/);
      const email = emailMatch ? emailMatch[1] : fromHeader;
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
        const filename = ensurePdfExtension(att.filename);
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
