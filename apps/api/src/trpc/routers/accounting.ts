import {
  disconnectProviderSchema,
  exportToAccountingSchema,
  getAccountsSchema,
  getSyncStatusSchema,
} from "@api/schemas/accounting";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import {
  getAccountingProvider,
  type AccountingProviderConfig,
} from "@midday/accounting";
import {
  deleteApp,
  getAccountingSyncStatus,
  getAppByAppId,
  getApps,
} from "@midday/db/queries";
import { triggerJob } from "@midday/job-client";
import { TRPCError } from "@trpc/server";

export const accountingRouter = createTRPCRouter({
  /**
   * Export selected transactions to accounting provider
   */
  export: protectedProcedure
    .input(exportToAccountingSchema)
    .mutation(async ({ input, ctx: { db, teamId, session } }) => {
      const { transactionIds, providerId, includeAttachments } = input;

      if (!teamId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Team not found",
        });
      }

      // Verify provider is connected
      const app = await getAppByAppId(db, { appId: providerId, teamId });

      if (!app || !app.config) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `${providerId} is not connected. Please connect it first.`,
        });
      }

      // Trigger the export job
      const result = await triggerJob(
        "export-to-accounting",
        {
          teamId,
          userId: session.user.id,
          providerId,
          transactionIds,
          includeAttachments,
        },
        "accounting"
      );

      return {
        id: result.id,
      };
    }),

  /**
   * Get sync status for transactions
   */
  getSyncStatus: protectedProcedure
    .input(getSyncStatusSchema)
    .query(async ({ input, ctx: { db, teamId } }) => {
      const { transactionIds, providerId } = input;

      if (!teamId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Team not found",
        });
      }

      const records = await getAccountingSyncStatus(db, {
        teamId,
        transactionIds,
        provider: providerId,
      });

      return records;
    }),

  /**
   * Get connected accounting providers for the team
   */
  getConnections: protectedProcedure.query(async ({ ctx: { db, teamId } }) => {
    if (!teamId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Team not found",
      });
    }

    const apps = await getApps(db, teamId);

    const accountingProviderIds = ["xero", "quickbooks", "fortnox", "visma"];
    const connectedProviders = apps
      .filter((app) => accountingProviderIds.includes(app.app_id))
      .map((app) => {
        const config = app.config as AccountingProviderConfig | null;
        return {
          providerId: app.app_id,
          tenantName: config?.tenantName ?? "Connected",
          settings: app.settings,
          connectedAt: null, // apps table doesn't have created_at in the select
        };
      });

    return connectedProviders;
  }),

  /**
   * Get available accounts from accounting provider
   */
  getAccounts: protectedProcedure
    .input(getAccountsSchema)
    .query(async ({ input, ctx: { db, teamId } }) => {
      const { providerId } = input;

      if (!teamId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Team not found",
        });
      }

      const app = await getAppByAppId(db, { appId: providerId, teamId });

      if (!app || !app.config) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `${providerId} is not connected`,
        });
      }

      const config = app.config as AccountingProviderConfig;

      // Get OAuth credentials
      const clientId =
        providerId === "xero"
          ? process.env.XERO_CLIENT_ID
          : providerId === "quickbooks"
            ? process.env.QUICKBOOKS_CLIENT_ID
            : undefined;

      const clientSecret =
        providerId === "xero"
          ? process.env.XERO_CLIENT_SECRET
          : providerId === "quickbooks"
            ? process.env.QUICKBOOKS_CLIENT_SECRET
            : undefined;

      const redirectUri =
        providerId === "xero"
          ? process.env.XERO_OAUTH_REDIRECT_URL
          : providerId === "quickbooks"
            ? process.env.QUICKBOOKS_OAUTH_REDIRECT_URL
            : undefined;

      if (!clientId || !clientSecret || !redirectUri) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Provider OAuth configuration missing",
        });
      }

      const provider = getAccountingProvider(providerId as "xero", {
        clientId,
        clientSecret,
        redirectUri,
        config,
      });

      try {
        const accounts = await provider.getAccounts(config.tenantId);
        return accounts;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Failed to get accounts",
        });
      }
    }),

  /**
   * Disconnect accounting provider
   */
  disconnect: protectedProcedure
    .input(disconnectProviderSchema)
    .mutation(async ({ input, ctx: { db, teamId } }) => {
      const { providerId } = input;

      if (!teamId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Team not found",
        });
      }

      // Delete the app
      await deleteApp(db, { appId: providerId, teamId });

      return { success: true };
    }),
});
