import {
  connectInboxAccountSchema,
  deleteInboxAccountSchema,
  exchangeCodeForAccountSchema,
  syncInboxAccountSchema,
} from "@api/schemas/inbox-accounts";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import {
  deleteInboxAccount,
  getInboxAccountById,
  getInboxAccounts,
} from "@midday/db/queries";
import { InboxConnector } from "@midday/inbox/connector";
import { encryptOAuthState } from "@midday/inbox/utils";
import { triggerJob } from "@midday/job-client";
import { createLoggerWithContext } from "@midday/logger";
import { TRPCError } from "@trpc/server";

const logger = createLoggerWithContext("trpc:inbox-accounts");

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
        const state = encryptOAuthState({
          teamId,
          provider: input.provider,
          source: "inbox",
          redirectPath: input.redirectPath,
        });

        const connector = new InboxConnector(input.provider, db);
        return connector.connect(state);
      } catch (error) {
        logger.error("Failed to connect to inbox account", {
          error: error instanceof Error ? error.message : String(error),
        });
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
        logger.error("Failed to exchange code for account", {
          error: error instanceof Error ? error.message : String(error),
        });
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

      return data;
    }),

  sync: protectedProcedure
    .input(syncInboxAccountSchema)
    .mutation(async ({ input, ctx: { db, teamId } }) => {
      const account = await getInboxAccountById(db, {
        id: input.id,
        teamId: teamId!,
      });

      if (!account) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Inbox account not found",
        });
      }

      const job = await triggerJob(
        "sync-scheduler",
        {
          id: input.id,
          manualSync: input.manualSync || false,
          teamId: teamId!,
          syncStartDate: input.syncStartDate,
          maxResults: input.maxResults,
        },
        "inbox-provider",
        {
          priority: 1,
          jobId: `sync-${input.id}`,
          removeOnComplete: { age: 60 },
        },
      );

      return { id: job.id };
    }),
});
