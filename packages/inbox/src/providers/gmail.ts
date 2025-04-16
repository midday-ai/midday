import type { Credentials } from "google-auth-library";
import { type Auth, type gmail_v1, google } from "googleapis";
import type {
  Email,
  EmailAttachment,
  OAuthProviderInterface,
  Tokens,
} from "./types";

export class GmailProvider implements OAuthProviderInterface {
  private oauth2Client: Auth.OAuth2Client;
  private gmail: gmail_v1.Gmail | null = null;

  private readonly scopes = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
  ];

  constructor() {
    const clientId = process.env.GMAIL_CLIENT_ID;
    const clientSecret = process.env.GMAIL_CLIENT_SECRET;
    const redirectUri = process.env.GMAIL_REDIRECT_URI;

    this.oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri,
    );

    this.oauth2Client.on("tokens", (tokens: Credentials | null | undefined) => {
      if (tokens?.refresh_token) {
        console.log("New refresh token received:", tokens.refresh_token);
      }
      if (tokens?.access_token) {
        console.log("Access token refreshed:", tokens.access_token);
      }
    });
  }

  getAuthUrl(): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: this.scopes,
      state: "gmail",
    });
  }

  async exchangeCodeForTokens(code: string): Promise<Tokens> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
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
    this.oauth2Client.setCredentials(googleCredentials);
    this.gmail = google.gmail({ version: "v1", auth: this.oauth2Client });
  }

  async refreshToken(): Promise<Tokens> {
    if (!this.oauth2Client.credentials.refresh_token) {
      throw new Error(
        "No refresh token available to refresh the access token.",
      );
    }
    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      if (!credentials.access_token) {
        throw new Error("Failed to refresh access token.");
      }
      const validTokens: Tokens = {
        access_token: credentials.access_token,
        refresh_token: credentials.refresh_token ?? undefined,
        expiry_date: credentials.expiry_date ?? undefined,
        scope: credentials.scope ?? undefined,
        token_type: credentials.token_type ?? undefined,
      };
      this.setTokens(validTokens);
      return validTokens;
    } catch (error: unknown) {
      console.error("Error refreshing access token:", error);
      const isAxiosError = (
        err: unknown,
      ): err is { response?: { data?: { error?: string } } } =>
        typeof err === "object" && err !== null && "response" in err;

      if (
        isAxiosError(error) &&
        error.response?.data?.error === "invalid_grant"
      ) {
        throw new Error(
          "Refresh token is invalid or revoked. Re-authentication required.",
        );
      }
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to refresh access token: ${message}`);
    }
  }

  async getUserInfo() {
    try {
      const oauth2 = google.oauth2({
        auth: this.oauth2Client,
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

  async getEmails(
    options: { maxResults?: number; includeAttachments?: boolean } = {},
  ): Promise<Email[]> {
    if (!this.gmail) {
      throw new Error("Gmail client not initialized. Set tokens first.");
    }

    const { maxResults = 10, includeAttachments = false } = options;

    try {
      const listResponse = await this.gmail.users.messages.list({
        userId: "me",
        maxResults: maxResults,
        q: "has:attachment filename:pdf",
      });

      const messages = listResponse.data.messages;
      if (!messages || messages.length === 0) {
        console.log(
          "No emails found with PDF attachments matching the criteria.",
        );
        return [];
      }

      const messageIds = messages.map((m: gmail_v1.Schema$Message) => m.id!);

      const emailDataPromises = messageIds.map(
        (
          id: string | null | undefined,
        ): Promise<gmail_v1.Schema$Message | null> =>
          id
            ? this.gmail!.users.messages.get({
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
                })
            : Promise.resolve(null),
      );

      const fetchedMessages = (await Promise.all(emailDataPromises)).filter(
        (msg): msg is gmail_v1.Schema$Message => msg !== null,
      );

      if (fetchedMessages.length === 0) {
        console.log("All filtered messages failed to fetch details.");
        return [];
      }

      const emails = await Promise.all(
        fetchedMessages.map(
          async (message: gmail_v1.Schema$Message): Promise<Email | null> => {
            if (!message.id || !message.threadId) {
              console.warn(
                "Skipping message due to missing ID or ThreadID:",
                message,
              );
              return null;
            }
            const headers = message.payload?.headers ?? [];
            const findHeader = (name: string): string | undefined =>
              headers.find(
                (h: gmail_v1.Schema$MessagePartHeader) =>
                  h.name?.toLowerCase() === name.toLowerCase(),
              )?.value ?? undefined;

            const dateString = findHeader("date");

            const email: Email = {
              id: message.id,
              threadId: message.threadId,
              snippet: message.snippet ?? "",
              subject: findHeader("subject"),
              from: findHeader("from"),
              to: findHeader("to")
                ?.split(",")
                .map((s: string) => s.trim()),
              date: dateString ? new Date(dateString) : undefined,
              body: this.parseBody(message.payload),
              attachments: [],
            };

            if (includeAttachments && message.payload?.parts) {
              const allAttachments = await this.fetchAttachments(
                message.id,
                message.payload.parts,
              );
              email.attachments = allAttachments;
            }

            return email;
          },
        ),
      );

      return emails.filter(
        (email: Email | null): email is Email => email !== null,
      );
    } catch (error: unknown) {
      console.error("Error fetching emails:", error);

      const isApiError = (
        err: unknown,
      ): err is { code?: number; message?: string } =>
        typeof err === "object" &&
        err !== null &&
        ("code" in err || "message" in err);

      if (isApiError(error) && error.code === 401) {
        console.warn(
          "Received 401 Unauthorized. Access token might be expired or invalid. Consider refreshing the token.",
        );
        throw new Error(
          "Unauthorized access. Token may be expired or invalid.",
        );
      }
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to fetch emails: ${message}`);
    }
  }

  private parseBody(
    payload?: gmail_v1.Schema$MessagePart | null,
  ): Email["body"] {
    if (!payload) return {};

    let textBody: string | undefined;
    let htmlBody: string | undefined;

    const findPart = (
      parts: gmail_v1.Schema$MessagePart[],
      mimeType: string,
    ): gmail_v1.Schema$MessagePart | undefined => {
      for (const part of parts) {
        if (part.mimeType === mimeType) {
          return part;
        }
        if (part.parts) {
          const found = findPart(part.parts, mimeType);
          if (found) return found;
        }
      }
      return undefined;
    };

    if (payload.mimeType === "text/plain" && payload.body?.data) {
      textBody = Buffer.from(payload.body.data, "base64").toString("utf-8");
    } else if (payload.mimeType === "text/html" && payload.body?.data) {
      htmlBody = Buffer.from(payload.body.data, "base64").toString("utf-8");
    } else if (payload.parts) {
      const textPart = findPart(payload.parts, "text/plain");
      if (textPart?.body?.data) {
        textBody = Buffer.from(textPart.body.data, "base64").toString("utf-8");
      }
      const htmlPart = findPart(payload.parts, "text/html");
      if (htmlPart?.body?.data) {
        htmlBody = Buffer.from(htmlPart.body.data, "base64").toString("utf-8");
      }
    } else if (payload.body?.data) {
      textBody = Buffer.from(payload.body.data, "base64").toString("utf-8");
    }

    return { text: textBody, html: htmlBody };
  }

  private async fetchAttachments(
    messageId: string,
    parts: gmail_v1.Schema$MessagePart[],
  ): Promise<EmailAttachment[]> {
    const attachments: EmailAttachment[] = [];
    if (!this.gmail) return attachments;

    for (const part of parts) {
      if (part.filename && part.body?.attachmentId) {
        try {
          const attachmentResponse =
            await this.gmail.users.messages.attachments.get({
              userId: "me",
              messageId: messageId,
              id: part.body.attachmentId,
            });

          if (attachmentResponse.data.data) {
            attachments.push({
              filename: part.filename,
              mimeType: part.mimeType ?? "application/octet-stream",
              size: attachmentResponse.data.size ?? 0,
              data: attachmentResponse.data.data,
            });
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
        const nestedAttachments = await this.fetchAttachments(
          messageId,
          part.parts,
        );
        attachments.push(...nestedAttachments);
      }
    }
    return attachments;
  }
}
