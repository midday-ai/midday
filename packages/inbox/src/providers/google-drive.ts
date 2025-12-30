import type { Database } from "@midday/db/client";
import { updateInboxAccount } from "@midday/db/queries";
import { encrypt } from "@midday/encryption";
import { ensureFileExtension } from "@midday/utils";
import type { Credentials } from "google-auth-library";
import { type Auth, type drive_v3, google } from "googleapis";
import { generateDeterministicId } from "../generate-id";
import type {
  Attachment,
  GetAttachmentsOptions,
  OAuthProviderInterface,
  Tokens,
  UserInfo,
} from "./types";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const SUPPORTED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
];

export interface GoogleDriveFolder {
  id: string;
  name: string;
}

export class GoogleDriveProvider implements OAuthProviderInterface {
  #oauth2Client: Auth.OAuth2Client;
  #drive: drive_v3.Drive | null = null;
  #accountId: string | null = null;
  #db: Database;
  #folderId: string | null = null;

  #scopes = [
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/userinfo.email",
  ];

  constructor(db: Database) {
    this.#db = db;

    const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_DRIVE_REDIRECT_URI;

    if (!clientId || !clientSecret) {
      throw new Error(
        "Missing required Google Drive OAuth2 credentials: GOOGLE_DRIVE_CLIENT_ID and GOOGLE_DRIVE_CLIENT_SECRET must be set",
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
          console.error("Failed to update tokens in database:", error);
        }
      },
    );
  }

  setAccountId(accountId: string): void {
    this.#accountId = accountId;
  }

  setFolderId(folderId: string): void {
    this.#folderId = folderId;
  }

  async getAuthUrl(state?: string): Promise<string> {
    return this.#oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: this.#scopes,
      state: state ?? "google_drive",
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

    const googleCredentials: Credentials = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date,
      scope: tokens.scope,
      token_type: tokens.token_type as Credentials["token_type"],
    };

    this.#oauth2Client.setCredentials(googleCredentials);
    this.#drive = google.drive({ version: "v3", auth: this.#oauth2Client });
  }

  async refreshTokens(): Promise<void> {
    if (!this.#accountId) {
      throw new Error("Account ID is required for token refresh");
    }

    try {
      await this.#oauth2Client.refreshAccessToken();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";

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
      console.error("Error fetching user info:", error);
    }
  }

  /**
   * List top-level folders in user's Google Drive for folder selection dropdown
   */
  async getFolders(): Promise<GoogleDriveFolder[]> {
    if (!this.#drive) {
      throw new Error("Drive client not initialized. Set tokens first.");
    }

    try {
      const response = await this.#drive.files.list({
        q: "mimeType='application/vnd.google-apps.folder' and 'root' in parents and trashed=false",
        fields: "files(id, name)",
        orderBy: "name",
        pageSize: 100,
      });

      const folders = response.data.files || [];

      return folders
        .filter((f): f is { id: string; name: string } => !!f.id && !!f.name)
        .map((f) => ({
          id: f.id,
          name: f.name,
        }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to fetch folders: ${message}`);
    }
  }

  async getAttachments(options: GetAttachmentsOptions): Promise<Attachment[]> {
    if (!this.#drive) {
      throw new Error("Drive client not initialized. Set tokens first.");
    }

    if (!this.#folderId) {
      throw new Error(
        "Folder ID is required for Google Drive sync. Set folder via metadata.",
      );
    }

    const { maxResults = 50, lastAccessed, fullSync = false } = options;

    try {
      // Build query for files in the selected folder
      let query = `'${this.#folderId}' in parents and trashed=false`;

      // Add mime type filter for supported file types
      const mimeTypeFilter = SUPPORTED_MIME_TYPES.map(
        (type) => `mimeType='${type}'`,
      ).join(" or ");
      query += ` and (${mimeTypeFilter})`;

      // Add date filter for incremental sync
      if (!fullSync && lastAccessed) {
        const lastAccessDate = new Date(lastAccessed);
        query += ` and modifiedTime > '${lastAccessDate.toISOString()}'`;
      } else if (fullSync) {
        // For full sync, get files from last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        query += ` and modifiedTime > '${thirtyDaysAgo.toISOString()}'`;
      }

      const response = await this.#drive.files.list({
        q: query,
        fields: "files(id, name, mimeType, size, modifiedTime)",
        orderBy: "modifiedTime desc",
        pageSize: maxResults,
      });

      const files = response.data.files || [];

      if (files.length === 0) {
        console.log("No files found in the selected folder.");
        return [];
      }

      // Filter out files that are too large
      const validFiles = files.filter((file) => {
        const size = Number(file.size || 0);
        if (size > MAX_FILE_SIZE) {
          console.warn(
            `Skipping file ${file.name}: exceeds size limit (${size} bytes)`,
          );
          return false;
        }
        return true;
      });

      // Download and process files
      const attachments: Attachment[] = [];

      for (const file of validFiles.slice(0, maxResults)) {
        if (!file.id || !file.name || !file.mimeType) {
          continue;
        }

        try {
          const content = await this.#downloadFile(file.id);

          if (content) {
            const filename = ensureFileExtension(file.name, file.mimeType);
            const referenceId = generateDeterministicId(
              `gdrive_${file.id}_${file.modifiedTime}`,
            );

            attachments.push({
              id: referenceId,
              filename,
              mimeType: file.mimeType,
              size: Number(file.size || 0),
              data: content,
              referenceId,
            });
          }
        } catch (error) {
          console.error(`Failed to download file ${file.name}:`, error);
        }
      }

      return attachments;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";

      console.error("Google Drive API error:", {
        error: message,
        accountId: this.#accountId,
        folderId: this.#folderId,
        timestamp: new Date().toISOString(),
      });

      if (message.includes("invalid_request")) {
        throw new Error(
          "invalid_request - OAuth tokens may be expired. Token refresh may be needed.",
        );
      }
      if (message.includes("unauthorized") || message.includes("401")) {
        throw new Error(
          "unauthorized - Access token is invalid or expired. Authentication required.",
        );
      }
      if (message.includes("invalid_grant")) {
        throw new Error(
          "invalid_grant - Refresh token is invalid or expired. Re-authentication required.",
        );
      }
      if (message.includes("forbidden") || message.includes("403")) {
        throw new Error(
          "forbidden - Insufficient permissions or quota exceeded.",
        );
      }

      throw new Error(`Failed to fetch files: ${message}`);
    }
  }

  async #downloadFile(fileId: string): Promise<Buffer | null> {
    if (!this.#drive) {
      return null;
    }

    try {
      const response = await this.#drive.files.get(
        {
          fileId,
          alt: "media",
        },
        { responseType: "arraybuffer" },
      );

      return Buffer.from(response.data as ArrayBuffer);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error(`Failed to download file ${fileId}: ${message}`);
      return null;
    }
  }
}

