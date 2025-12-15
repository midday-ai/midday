import type { Database } from "@midday/db/client";
import { decrypt } from "@midday/encryption";
import type {
  Attachment,
  Folder,
  GetAttachmentsOptions,
  OAuthProviderInterface,
  Tokens,
  UserInfo,
} from "@midday/inbox/providers/types";
import { ensureFileExtension } from "@midday/utils";
import type { Credentials } from "google-auth-library";
import { type Auth, type drive_v3, google } from "googleapis";

const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
];

interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  parents?: string[];
  webViewLink?: string;
}

export interface GoogleDriveConnection {
  accountId: string;
  email: string;
  accessToken: string; // Encrypted
  refreshToken: string; // Encrypted
  expiryDate: string;
  externalId: string; // Google user ID
  folders: string[]; // Array of folder IDs
  lastAccessed: string;
  connectedAt: string;
  watchChannels?: Record<string, WatchChannel>; // Folder ID -> watch channel mapping
}

export interface WatchChannel {
  id: string;
  resourceId: string;
  expiration: string;
}

export class GoogleDriveProvider implements OAuthProviderInterface {
  #oauth2Client: Auth.OAuth2Client;
  #drive: drive_v3.Drive | null = null;
  #accountId: string | null = null;
  #db: Database;

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
  }

  setAccountId(accountId: string): void {
    this.#accountId = accountId;
  }

  async getAuthUrl(state?: string): Promise<string> {
    return this.#oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: this.#scopes,
      state: state ?? "googledrive",
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
    try {
      await this.#oauth2Client.refreshAccessToken();
      // Token updates are handled at a higher level for apps table connections
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
      console.error("Error fetching Google Drive user info:", error);
      return undefined;
    }
  }

  async getFolders(
    accessToken: string,
    refreshToken: string,
  ): Promise<Folder[]> {
    this.setTokens({ access_token: accessToken, refresh_token: refreshToken });

    if (!this.#drive) {
      throw new Error("Drive client not initialized");
    }

    const folders: Folder[] = [];
    const maxDepth = 3; // Limit recursion depth

    async function fetchFoldersRecursive(
      parentId: string | null,
      depth: number,
      drive: drive_v3.Drive,
    ): Promise<void> {
      if (depth > maxDepth) {
        return;
      }

      try {
        const query = parentId
          ? `'${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`
          : `mimeType='application/vnd.google-apps.folder' and trashed=false and 'root' in parents`;

        let pageToken: string | undefined;
        do {
          const response = await drive.files.list({
            q: query,
            fields: "nextPageToken, files(id, name, parents)",
            pageSize: 1000,
            pageToken,
            orderBy: "name",
          });

          const files = response.data.files || [];

          for (const file of files) {
            if (!file.id || !file.name) continue;

            const folder: Folder = {
              id: file.id,
              name: file.name,
              path: file.id, // Use ID as path identifier for Google Drive
              parentPath: parentId || undefined,
            };

            folders.push(folder);

            // Recursively fetch subfolders
            await fetchFoldersRecursive(file.id, depth + 1, drive);
          }

          pageToken = response.data.nextPageToken || undefined;
        } while (pageToken);
      } catch (error) {
        console.error(`Error fetching folders for parent ${parentId}:`, error);
      }
    }

    // Start from root
    await fetchFoldersRecursive(null, 0, this.#drive);

    return folders;
  }

  async getAttachments(
    options: GetAttachmentsOptions & {
      connection?: GoogleDriveConnection;
    },
  ): Promise<Attachment[]> {
    if (!this.#drive) {
      throw new Error("Drive client not initialized. Set tokens first.");
    }

    const {
      maxResults = 50,
      lastAccessed,
      fullSync = false,
      connection,
    } = options;

    if (!connection) {
      throw new Error("Google Drive connection config is required");
    }

    // Decrypt tokens
    const accessToken = decrypt(connection.accessToken);
    const refreshToken = connection.refreshToken
      ? decrypt(connection.refreshToken)
      : null;

    // Set tokens
    this.setTokens({
      access_token: accessToken,
      refresh_token: refreshToken,
      expiry_date: new Date(connection.expiryDate).getTime(),
    });

    const googleDriveConnection = connection;
    const folders = googleDriveConnection.folders || [];

    if (folders.length === 0) {
      return [];
    }

    const attachments: Attachment[] = [];
    const lastAccessedDate = lastAccessed
      ? new Date(lastAccessed)
      : fullSync
        ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
        : null;

    // Process each folder
    for (const folderId of folders) {
      if (attachments.length >= maxResults) {
        break;
      }

      try {
        // Build query for files in this folder
        let query = `'${folderId}' in parents and trashed=false and (${ALLOWED_MIME_TYPES.map((mime) => `mimeType='${mime}'`).join(" or ")})`;

        // Add date filter if we have lastAccessed
        if (lastAccessedDate) {
          const dateStr = lastAccessedDate.toISOString();
          query += ` and modifiedTime > '${dateStr}'`;
        }

        let pageToken: string | undefined;
        do {
          const response = await this.#drive.files.list({
            q: query,
            fields:
              "nextPageToken, files(id, name, mimeType, size, modifiedTime)",
            pageSize: 100,
            pageToken,
            orderBy: "modifiedTime desc",
          });

          const files = response.data.files || [];

          for (const file of files) {
            if (attachments.length >= maxResults) {
              break;
            }

            if (!file.id || !file.name) continue;

            const fileSize = file.size ? Number.parseInt(file.size, 10) : 0;
            if (fileSize > MAX_ATTACHMENT_SIZE) {
              continue;
            }

            try {
              // Download file
              const fileResponse = await this.#drive.files.get(
                {
                  fileId: file.id,
                  alt: "media",
                },
                { responseType: "arraybuffer" },
              );

              const buffer = Buffer.from(fileResponse.data as ArrayBuffer);
              const filename = ensureFileExtension(
                file.name,
                file.mimeType || "application/octet-stream",
              );

              attachments.push({
                id: file.id,
                filename,
                mimeType: file.mimeType || "application/octet-stream",
                size: buffer.length,
                referenceId: file.id,
                data: buffer,
              });
            } catch (error) {
              console.error(`Error downloading file ${file.id}:`, error);
            }
          }

          pageToken = response.data.nextPageToken || undefined;
        } while (pageToken && attachments.length < maxResults);
      } catch (error) {
        console.error(`Error processing folder ${folderId}:`, error);
      }
    }

    return attachments;
  }

  /**
   * Create a watch channel for a Google Drive folder
   * Watch channels expire after 1 week and need to be renewed
   * Note: Google Drive watches the entire Drive, not individual folders
   */
  async createWatchChannel(
    folderId: string,
    webhookUrl: string,
  ): Promise<WatchChannel> {
    if (!this.#drive) {
      throw new Error("Drive client not initialized");
    }

    try {
      // Get the start page token first
      const startPageTokenResponse =
        await this.#drive.changes.getStartPageToken();
      const startPageToken = startPageTokenResponse.data.startPageToken;

      if (!startPageToken) {
        throw new Error("Failed to get start page token");
      }

      // Generate a unique channel ID
      const channelId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

      // Expiration: 1 week in milliseconds (604800000ms)
      // Google allows max 1 week for changes resource
      const expirationMs = Date.now() + 7 * 24 * 60 * 60 * 1000;

      const response = await this.#drive.changes.watch({
        pageToken: startPageToken,
        requestBody: {
          id: channelId,
          type: "web_hook",
          address: webhookUrl,
          expiration: expirationMs.toString(),
        },
      });

      if (!response.data.id || !response.data.resourceId) {
        throw new Error("Failed to create watch channel");
      }

      return {
        id: response.data.id,
        resourceId: response.data.resourceId,
        expiration: response.data.expiration
          ? new Date(
              Number.parseInt(response.data.expiration, 10),
            ).toISOString()
          : new Date(expirationMs).toISOString(),
      };
    } catch (error) {
      console.error(
        `Error creating watch channel for folder ${folderId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Stop a watch channel
   */
  async stopWatchChannel(channelId: string, resourceId: string): Promise<void> {
    if (!this.#drive) {
      throw new Error("Drive client not initialized");
    }

    try {
      await this.#drive.channels.stop({
        requestBody: {
          id: channelId,
          resourceId,
        },
      });
    } catch (error) {
      console.error(`Error stopping watch channel ${channelId}:`, error);
      // Don't throw - channel may have already expired
    }
  }

  /**
   * Renew a watch channel before it expires
   * Returns the renewed channel info
   */
  async renewWatchChannel(
    folderId: string,
    webhookUrl: string,
    existingChannel: WatchChannel,
  ): Promise<WatchChannel> {
    // Stop the old channel first
    await this.stopWatchChannel(existingChannel.id, existingChannel.resourceId);

    // Create a new channel
    return this.createWatchChannel(folderId, webhookUrl);
  }
}
