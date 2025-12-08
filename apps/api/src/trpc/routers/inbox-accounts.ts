import {
  connectInboxAccountSchema,
  deleteInboxAccountSchema,
  exchangeCodeForAccountSchema,
  initialSetupInboxAccountSchema,
  syncInboxAccountSchema,
} from "@api/schemas/inbox-accounts";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { deleteInboxAccount, getInboxAccounts } from "@midday/db/queries";
import { InboxConnector } from "@midday/inbox/connector";
import { triggerJob } from "@midday/job-client";
import { schedules } from "@trigger.dev/sdk";
import { TRPCError } from "@trpc/server";

export const inboxAccountsRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx: { db, teamId } }) => {
    return getInboxAccounts(db, teamId!);
  }),

  connect: protectedProcedure
    .input(connectInboxAccountSchema)
    .mutation(async ({ ctx: { db }, input }) => {
      try {
        const connector = new InboxConnector(input.provider, db);

        return connector.connect();
      } catch (error) {
        console.error(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to connect to inbox account",
        });
      }
    }),

  exchangeCodeForAccount: protectedProcedure
    .input(exchangeCodeForAccountSchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      try {
        const connector = new InboxConnector(input.provider, db);

        const account = await connector.exchangeCodeForAccount({
          code: input.code,
          teamId: teamId!,
        });

        return account;
      } catch (error) {
        console.error(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to exchange code for account",
        });
      }
    }),

  delete: protectedProcedure
    .input(deleteInboxAccountSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      const data = await deleteInboxAccount(db, {
        id: input.id,
        teamId: teamId!,
      });

      // Remove Trigger.dev schedule if it exists
      if (data?.scheduleId) {
        try {
          // Try to delete by schedule ID first (stored in DB)
          await schedules.del(data.scheduleId);
        } catch (error) {
          // If that fails, try deleting by deduplication key as fallback
          try {
            const deduplicationKey = `${input.id}-inbox-sync-scheduler`;
            await schedules.del(deduplicationKey);
          } catch (fallbackError) {
            // Log error but don't fail the deletion if scheduler removal fails
            console.error(
              `Failed to remove Trigger.dev scheduler for inbox account ${input.id}:`,
              error instanceof Error ? error.message : error,
              "Fallback error:",
              fallbackError instanceof Error
                ? fallbackError.message
                : fallbackError,
            );
          }
        }
      }

      return data;
    }),

  sync: protectedProcedure
    .input(syncInboxAccountSchema)
    .mutation(async ({ input }) => {
      const job = await triggerJob(
        "sync-scheduler",
        {
          id: input.id,
          manualSync: input.manualSync || false,
        },
        "inbox-provider",
      );

      return { id: job.id };
    }),

  initialSetup: protectedProcedure
    .input(initialSetupInboxAccountSchema)
    .mutation(async ({ input }) => {
      const job = await triggerJob(
        "initial-setup",
        {
          inboxAccountId: input.inboxAccountId,
        },
        "inbox-provider",
      );

      return { id: job.id };
    }),
});
