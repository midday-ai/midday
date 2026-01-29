import {
  connectInboxAccountSchema,
  deleteInboxAccountSchema,
  exchangeCodeForAccountSchema,
  syncInboxAccountSchema,
} from "@api/schemas/inbox-accounts";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { deleteInboxAccount, getInboxAccounts } from "@midday/db/queries";
import { InboxConnector } from "@midday/inbox/connector";
import { encryptOAuthState } from "@midday/inbox/utils";
import { triggerJob } from "@midday/job-client";
import { TRPCError } from "@trpc/server";

export const inboxAccountsRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx: { db, teamId } }) => {
    return getInboxAccounts(db, teamId!);
  }),

  connect: protectedProcedure
    .input(connectInboxAccountSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      if (!teamId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Team not found",
        });
      }

      try {
        // Encrypt state to prevent tampering with teamId
        const state = encryptOAuthState({
          teamId,
          provider: input.provider,
          source: "inbox",
        });

        const connector = new InboxConnector(input.provider, db);
        return connector.connect(state);
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

      // Note: The scheduleId stored in the database is the BullMQ job key.
      // The scheduler is automatically cleaned up when jobs complete/fail.
      // For explicit removal, a job could be triggered to unregister the scheduler.

      return data;
    }),

  sync: protectedProcedure
    .input(syncInboxAccountSchema)
    .mutation(async ({ input }) => {
      const { id: jobId } = await triggerJob(
        "sync-inbox-account",
        {
          id: input.id,
          manualSync: input.manualSync || false,
        },
        "inbox-provider",
      );

      return { id: jobId };
    }),
});
