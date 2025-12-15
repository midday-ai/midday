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

const DROPBOX_API_BASE = "https://api.dropboxapi.com";
const DROPBOX_CONTENT_BASE = "https://content.dropboxapi.com";
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

interface DropboxFileMetadata {
  ".tag": "file";
  name: string;
  path_lower: string;
  path_display: string;
  id: string;
  client_modified: string;
  server_modified: string;
  rev: string;
  size: number;
  content_hash?: string;
}

interface DropboxFolderMetadata {
  ".tag": "folder";
  name: string;
  path_lower: string;
  path_display: string;
  id: string;
}

type DropboxMetadata = DropboxFileMetadata | DropboxFolderMetadata;

interface DropboxListFolderResponse {
  entries: DropboxMetadata[];
  cursor: string;
  has_more: boolean;
}

interface DropboxConnection {
  accountId: string;
  email: string;
  accessToken: string; // Encrypted
  refreshToken: string; // Encrypted
  expiryDate: string;
  externalId: string;
  folders: string[];
  lastAccessed: string;
  webhookUrl?: string;
  connectedAt: string;
  cursors?: Record<string, string>; // Folder path -> cursor mapping
}

export class DropboxProvider implements OAuthProviderInterface {
  #db: Database;
  #accountId: string | null = null;
  #accessToken: string | null = null;
  #refreshToken: string | null = null;

  #scopes = ["files.content.read", "files.metadata.read", "account_info.read"];

  constructor(db: Database) {
    this.#db = db;
  }

  setAccountId(accountId: string): void {
    this.#accountId = accountId;
  }

  async getAuthUrl(state?: string): Promise<string> {
    const clientId = process.env.DROPBOX_CLIENT_ID;
    const redirectUri = process.env.DROPBOX_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      throw new Error(
        "Missing required Dropbox OAuth2 credentials: DROPBOX_CLIENT_ID and DROPBOX_REDIRECT_URI must be set",
      );
    }

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: "code",
      redirect_uri: redirectUri,
      token_access_type: "offline", // Request refresh token
      scope: this.#scopes.join(" "),
      state: state ?? "dropbox",
    });

    return `https://www.dropbox.com/oauth2/authorize?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string): Promise<Tokens> {
    const clientId = process.env.DROPBOX_CLIENT_ID;
    const clientSecret = process.env.DROPBOX_CLIENT_SECRET;
    const redirectUri = process.env.DROPBOX_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error(
        "Missing required Dropbox OAuth2 credentials: DROPBOX_CLIENT_ID, DROPBOX_CLIENT_SECRET, and DROPBOX_REDIRECT_URI must be set",
      );
    }

    try {
      const response = await fetch("https://api.dropbox.com/oauth2/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          code,
          grant_type: "authorization_code",
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to exchange code for tokens: ${response.status} ${errorText}`,
        );
      }

      const data = (await response.json()) as {
        access_token: string;
        refresh_token?: string;
        expires_in?: number;
        token_type?: string;
      };

      if (!data.access_token) {
        throw new Error("Failed to obtain access token");
      }

      const expiryDate = data.expires_in
        ? Date.now() + data.expires_in * 1000
        : Date.now() + 14400 * 1000; // Default 4 hours

      return {
        access_token: data.access_token,
        refresh_token: data.refresh_token ?? null,
        expiry_date: expiryDate,
        token_type: data.token_type ?? "bearer",
      };
    } catch (error) {
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
  }

  async refreshTokens(): Promise<void> {
    if (!this.#refreshToken) {
      throw new Error("Refresh token is required");
    }

    const clientId = process.env.DROPBOX_CLIENT_ID;
    const clientSecret = process.env.DROPBOX_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error(
        "Missing required Dropbox OAuth2 credentials for token refresh",
      );
    }

    try {
      const response = await fetch("https://api.dropbox.com/oauth2/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          refresh_token: this.#refreshToken,
          grant_type: "refresh_token",
          client_id: clientId,
          client_secret: clientSecret,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to refresh tokens: ${response.status} ${errorText}`,
        );
      }

      const data = (await response.json()) as {
        access_token: string;
        expires_in?: number;
      };

      this.#accessToken = data.access_token;
      // Note: Token updates for Dropbox connections are handled in sync scheduler
      // since Dropbox uses apps table, not inbox_accounts
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      if (message.includes("invalid_grant")) {
        throw new Error(
          "Refresh token is invalid or expired. Re-authentication required.",
        );
      }
      throw new Error(`Token refresh failed: ${message}`);
    }
  }

  async getUserInfo(): Promise<UserInfo | undefined> {
    if (!this.#accessToken) {
      throw new Error("Access token is required");
    }

    try {
      const response = await fetch(
        `${DROPBOX_API_BASE}/2/users/get_current_account`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.#accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(null),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to get user info: ${response.status} ${errorText}`,
        );
      }

      const data = (await response.json()) as {
        account_id: string;
        email: string;
        name: {
          display_name: string;
        };
      };

      return {
        id: data.account_id,
        email: data.email,
        name: data.name.display_name,
      };
    } catch (error) {
      console.error("Error fetching Dropbox user info:", error);
      return undefined;
    }
  }

  async getFolders(
    accessToken: string,
    refreshToken: string,
  ): Promise<Folder[]> {
    this.setTokens({ access_token: accessToken, refresh_token: refreshToken });

    const folders: Folder[] = [];
    const maxDepth = 3; // Limit recursion depth

    async function fetchFoldersRecursive(
      path: string,
      depth: number,
    ): Promise<void> {
      if (depth > maxDepth) {
        return;
      }

      try {
        const response = await fetch(
          `${DROPBOX_API_BASE}/2/files/list_folder`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              path,
              recursive: false,
            }),
          },
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(
            `Failed to list folders: ${response.status} ${JSON.stringify(error)}`,
          );
        }

        const data = (await response.json()) as DropboxListFolderResponse;

        for (const entry of data.entries) {
          if (entry[".tag"] === "folder") {
            const folder: Folder = {
              id: entry.id,
              name: entry.name,
              path: entry.path_display,
              parentPath: path === "" ? undefined : path,
            };

            folders.push(folder);

            // Recursively fetch subfolders
            await fetchFoldersRecursive(entry.path_display, depth + 1);
          }
        }

        // Handle pagination if has_more is true
        if (data.has_more) {
          let cursor = data.cursor;
          while (cursor) {
            const continueResponse = await fetch(
              `${DROPBOX_API_BASE}/2/files/list_folder/continue`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ cursor }),
              },
            );

            if (!continueResponse.ok) {
              break;
            }

            const continueData =
              (await continueResponse.json()) as DropboxListFolderResponse;

            for (const entry of continueData.entries) {
              if (entry[".tag"] === "folder") {
                const folder: Folder = {
                  id: entry.id,
                  name: entry.name,
                  path: entry.path_display,
                  parentPath: path === "" ? undefined : path,
                };

                folders.push(folder);
                await fetchFoldersRecursive(entry.path_display, depth + 1);
              }
            }

            cursor = continueData.has_more ? continueData.cursor : "";
          }
        }
      } catch (error) {
        console.error(`Error fetching folders for ${path}:`, error);
        // Continue with other folders even if one fails
      }
    }

    await fetchFoldersRecursive("", 0);

    return folders;
  }

  async getAttachments(
    options: GetAttachmentsOptions & {
      connection?: DropboxConnection;
    },
  ): Promise<Attachment[]> {
    const {
      maxResults = 50,
      lastAccessed,
      fullSync = false,
      connection,
    } = options;

    if (!connection) {
      throw new Error("Dropbox connection config is required");
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

    const dropboxConnection = connection;
    const folders = dropboxConnection.folders || [];

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
    for (const folderPath of folders) {
      if (attachments.length >= maxResults) {
        break;
      }

      try {
        // Get cursor for this folder if exists
        const cursor = dropboxConnection.cursors?.[folderPath] || undefined;

        let listResponse: DropboxListFolderResponse;

        if (cursor) {
          // Continue from cursor
          const response = await fetch(
            `${DROPBOX_API_BASE}/2/files/list_folder/continue`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${this.#accessToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ cursor }),
            },
          );

          if (!response.ok) {
            // If cursor is invalid, start fresh
            const response = await fetch(
              `${DROPBOX_API_BASE}/2/files/list_folder`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${this.#accessToken}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  path: folderPath,
                  recursive: true,
                }),
              },
            );

            if (!response.ok) {
              continue;
            }

            listResponse = (await response.json()) as DropboxListFolderResponse;
          } else {
            listResponse = (await response.json()) as DropboxListFolderResponse;
          }
        } else {
          // Start fresh
          const response = await fetch(
            `${DROPBOX_API_BASE}/2/files/list_folder`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${this.#accessToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                path: folderPath,
                recursive: true,
              }),
            },
          );

          if (!response.ok) {
            continue;
          }

          listResponse = (await response.json()) as DropboxListFolderResponse;
        }

        // Filter files by MIME type and date
        const files = listResponse.entries.filter((entry) => {
          if (entry[".tag"] !== "file") {
            return false;
          }

          const file = entry as DropboxFileMetadata;

          // Check file size
          if (file.size > MAX_ATTACHMENT_SIZE) {
            return false;
          }

          // Check modification date
          if (lastAccessedDate) {
            const modifiedDate = new Date(file.server_modified);
            if (modifiedDate <= lastAccessedDate) {
              return false;
            }
          }

          // Check MIME type by extension
          const ext = file.name.split(".").pop()?.toLowerCase();
          const mimeType = this.#getMimeTypeFromExtension(ext || "");

          return ALLOWED_MIME_TYPES.includes(mimeType);
        }) as DropboxFileMetadata[];

        // Download files (limit to remaining maxResults)
        const remaining = maxResults - attachments.length;
        const filesToDownload = files.slice(0, remaining);

        for (const file of filesToDownload) {
          try {
            // Refresh token if needed
            if (!this.#accessToken) {
              await this.refreshTokens();
            }

            const downloadResponse = await fetch(
              `${DROPBOX_CONTENT_BASE}/2/files/download`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${this.#accessToken}`,
                  "Dropbox-API-Arg": JSON.stringify({
                    path: file.path_display,
                  }),
                },
              },
            );

            if (!downloadResponse.ok) {
              continue;
            }

            const buffer = await downloadResponse.arrayBuffer();
            const ext = file.name.split(".").pop()?.toLowerCase() || "";
            const mimeType = this.#getMimeTypeFromExtension(ext);

            attachments.push({
              id: file.id,
              filename: ensureFileExtension(file.name, mimeType),
              mimeType,
              size: file.size,
              referenceId: file.id,
              data: Buffer.from(buffer),
            });
          } catch (error) {
            console.error(
              `Error downloading file ${file.path_display}:`,
              error,
            );
            // Continue with next file
          }
        }

        // Store cursor for next sync if has_more
        if (listResponse.has_more && dropboxConnection.cursors) {
          dropboxConnection.cursors[folderPath] = listResponse.cursor;
        }
      } catch (error) {
        console.error(`Error processing folder ${folderPath}:`, error);
        // Continue with next folder
      }
    }

    return attachments;
  }

  #getMimeTypeFromExtension(ext: string): string {
    const mimeMap: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
      heic: "image/heic",
      heif: "image/heif",
      pdf: "application/pdf",
    };

    return mimeMap[ext.toLowerCase()] || "application/octet-stream";
  }
}
