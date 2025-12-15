import { DropboxProvider } from "@api/dropbox";
import {
  connectDropboxSchema,
  disconnectAppSchema,
  getDropboxFoldersSchema,
  removeWhatsAppConnectionSchema,
  saveDropboxFoldersSchema,
  updateAppSettingsSchema,
} from "@api/schemas/apps";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import {
  addDropboxConnection,
  disconnectApp,
  getAppByAppId,
  getApps,
  getDropboxConnections,
  removeWhatsAppConnection,
  updateAppSettings,
  updateDropboxConnectionFolders,
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
});
