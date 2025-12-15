import {
  connectDropboxSchema,
  disconnectAppSchema,
  getDropboxFoldersSchema,
  getGoogleDriveFoldersSchema,
  removeWhatsAppConnectionSchema,
  saveDropboxFoldersSchema,
  saveGoogleDriveFoldersSchema,
  updateAppSettingsSchema,
} from "@api/schemas/apps";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { DropboxProvider } from "@midday/app-store/dropbox/server";
import { GoogleDriveProvider } from "@midday/app-store/google-drive/server";
import {
  addDropboxConnection,
  disconnectApp,
  getAppByAppId,
  getApps,
  getDropboxConnections,
  getGoogleDriveConnections,
  removeWhatsAppConnection,
  updateAppSettings,
  updateDropboxConnectionFolders,
  updateGoogleDriveConnection,
  updateGoogleDriveConnectionFolders,
} from "@midday/db/queries";
import { decrypt, encrypt } from "@midday/encryption";
import { triggerJob } from "@midday/job-client";
import { TRPCError } from "@trpc/server";

export const appsRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx: { db, teamId } }) => {
    return getApps(db, teamId!);
  }),

  disconnect: protectedProcedure
    .input(disconnectAppSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      const { appId } = input;

      return disconnectApp(db, { appId, teamId: teamId! });
    }),

  update: protectedProcedure
    .input(updateAppSettingsSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      const { appId, option } = input;

      return updateAppSettings(db, {
        appId,
        teamId: teamId!,
        option,
      });
    }),

  removeWhatsAppConnection: protectedProcedure
    .input(removeWhatsAppConnectionSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      const { phoneNumber } = input;

      return removeWhatsAppConnection(db, {
        teamId: teamId!,
        phoneNumber,
      });
    }),

  connectDropbox: protectedProcedure
    .input(connectDropboxSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      if (!teamId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Team not found",
        });
      }

      try {
        const provider = new DropboxProvider(db);
        const tokens = await provider.exchangeCodeForTokens(input.code);

        // Get user info
        provider.setTokens({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token ?? "",
          expiry_date: tokens.expiry_date,
        });

        const userInfo = await provider.getUserInfo();

        if (!userInfo?.email || !userInfo.id) {
          throw new Error("Failed to get Dropbox user info");
        }

        // Create/update Dropbox app with connection
        const app = await addDropboxConnection(db, {
          teamId,
          email: userInfo.email,
          accessToken: encrypt(tokens.access_token),
          refreshToken: encrypt(tokens.refresh_token ?? ""),
          expiryDate: new Date(tokens.expiry_date!).toISOString(),
          externalId: userInfo.id,
          folders: [], // Will be set after folder selection
        });

        // Get the connection ID from the app config
        const config = app.config as {
          connections?: Array<{ accountId: string }>;
        };
        const connectionId =
          config.connections?.[config.connections.length - 1]?.accountId;

        if (!connectionId) {
          throw new Error("Failed to get connection ID");
        }

        return { connectionId, appId: app.id };
      } catch (error) {
        console.error("Dropbox connection error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to connect Dropbox",
        });
      }
    }),

  getDropboxFolders: protectedProcedure
    .input(getDropboxFoldersSchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      if (!teamId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Team not found",
        });
      }

      try {
        const app = await getAppByAppId(db, { appId: "dropbox", teamId });

        if (!app) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Dropbox app not found",
          });
        }

        const config = app.config as {
          connections?: Array<{
            accountId: string;
            accessToken: string;
            refreshToken: string;
          }>;
        };

        const connection = config.connections?.find(
          (c) => c.accountId === input.connectionId,
        );

        if (!connection) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Dropbox connection not found",
          });
        }

        // Decrypt tokens
        const accessToken = decrypt(connection.accessToken);
        const refreshToken = decrypt(connection.refreshToken);

        // Get folders using DropboxProvider
        const provider = new DropboxProvider(db);
        const folders = await provider.getFolders(accessToken, refreshToken);

        return folders;
      } catch (error) {
        console.error("Error fetching Dropbox folders:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Failed to fetch folders",
        });
      }
    }),

  saveDropboxFolders: protectedProcedure
    .input(saveDropboxFoldersSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      if (!teamId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Team not found",
        });
      }

      try {
        // Update folders in connection config
        await updateDropboxConnectionFolders(db, {
          teamId,
          connectionId: input.connectionId,
          folders: input.folders,
        });

        // Trigger initial sync for this connection
        // Note: We'll need to create a manual sync job that handles Dropbox connections
        // For now, the team-based scheduler will pick it up on next run

        return { success: true };
      } catch (error) {
        console.error("Error saving Dropbox folders:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Failed to save folders",
        });
      }
    }),

  getGoogleDriveFolders: protectedProcedure
    .input(getGoogleDriveFoldersSchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      if (!teamId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Team not found",
        });
      }

      try {
        const app = await getAppByAppId(db, { appId: "googledrive", teamId });

        if (!app) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Google Drive app not found",
          });
        }

        const config = app.config as {
          connections?: Array<{
            accountId: string;
            accessToken: string;
            refreshToken: string;
          }>;
        };

        const connection = config.connections?.find(
          (c) => c.accountId === input.connectionId,
        );

        if (!connection) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Google Drive connection not found",
          });
        }

        // Decrypt tokens
        const accessToken = decrypt(connection.accessToken);
        const refreshToken = decrypt(connection.refreshToken);

        // Get folders using GoogleDriveProvider
        const provider = new GoogleDriveProvider(db);
        const folders = await provider.getFolders(accessToken, refreshToken);

        return folders;
      } catch (error) {
        console.error("Error fetching Google Drive folders:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Failed to fetch folders",
        });
      }
    }),

  saveGoogleDriveFolders: protectedProcedure
    .input(saveGoogleDriveFoldersSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      if (!teamId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Team not found",
        });
      }

      try {
        // Get the connection to access tokens
        const app = await getAppByAppId(db, { appId: "googledrive", teamId });

        if (!app) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Google Drive app not found",
          });
        }

        const config = app.config as {
          connections?: Array<{
            accountId: string;
            accessToken: string;
            refreshToken: string;
            watchChannels?: Record<
              string,
              { id: string; resourceId: string; expiration: string }
            >;
          }>;
        };

        const connection = config.connections?.find(
          (c) => c.accountId === input.connectionId,
        );

        if (!connection) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Google Drive connection not found",
          });
        }

        // Decrypt tokens
        const accessToken = decrypt(connection.accessToken);
        const refreshToken = decrypt(connection.refreshToken);

        // Set up provider
        const provider = new GoogleDriveProvider(db);
        provider.setTokens({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        // Build webhook URL
        const apiUrl =
          process.env.MIDDAY_API_URL ||
          process.env.NEXT_PUBLIC_API_URL ||
          "http://localhost:3003";
        const webhookUrl = `${apiUrl}/apps/googledrive/webhook`;

        // Set up watch channels for each folder
        const watchChannels: Record<
          string,
          { id: string; resourceId: string; expiration: string }
        > = {};

        for (const folderId of input.folders) {
          try {
            // Stop existing channel if any
            const existingChannel = connection.watchChannels?.[folderId];
            if (existingChannel) {
              try {
                await provider.stopWatchChannel(
                  existingChannel.id,
                  existingChannel.resourceId,
                );
              } catch (error) {
                // Ignore errors stopping old channel (may have expired)
                console.warn(
                  `Failed to stop existing watch channel for folder ${folderId}:`,
                  error,
                );
              }
            }

            // Create new watch channel
            const channel = await provider.createWatchChannel(
              folderId,
              webhookUrl,
            );
            watchChannels[folderId] = channel;
          } catch (error) {
            console.error(
              `Failed to create watch channel for folder ${folderId}:`,
              error,
            );
            // Continue with other folders even if one fails
          }
        }

        // Update folders and watch channels in connection config
        await updateGoogleDriveConnection(db, {
          teamId,
          connectionId: input.connectionId,
          folders: input.folders,
          watchChannels,
        });

        // Trigger initial sync for this connection
        // Note: The team-based scheduler will pick it up on next run

        return { success: true };
      } catch (error) {
        console.error("Error saving Google Drive folders:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Failed to save folders",
        });
      }
    }),
});
