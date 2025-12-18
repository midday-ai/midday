import {
  disconnectProviderSchema,
  exportToAccountingSchema,
  getAccountsSchema,
  getSyncStatusSchema,
} from "@api/schemas/accounting";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import {
  type AccountingProviderConfig,
  getAccountingProvider,
  getOrgId,
  getOrgName,
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
      const { transactionIds, providerId } = input;

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

      const result = await triggerJob(
        "export-to-accounting",
        {
          teamId,
          userId: session.user.id,
          providerId,
          transactionIds,
        },
        "accounting",
      );

      return result;
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

    const accountingProviderIds = ["xero", "quickbooks", "fortnox"];
    const connectedProviders = apps
      .filter((app) => accountingProviderIds.includes(app.app_id))
      .map((app) => {
        const config = app.config as AccountingProviderConfig | null;
        return {
          providerId: app.app_id,
          tenantName: config
            ? (getOrgName(config) ?? "Connected")
            : "Connected",
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

      try {
        const provider = getAccountingProvider(providerId, config);
        const accounts = await provider.getAccounts(getOrgId(config));
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
