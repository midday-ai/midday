import {
  connectInboxAccountSchema,
  deleteInboxAccountSchema,
  exchangeCodeForAccountSchema,
  syncInboxAccountSchema,
} from "@api/schemas/inbox-accounts";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { deleteInboxAccount, getInboxAccounts } from "@midday/db/queries";
import { InboxConnector } from "@midday/inbox/connector";
import { schedules, tasks } from "@trigger.dev/sdk";
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

      if (data?.scheduleId) {
        await schedules.del(data.scheduleId);
      }

      return data;
    }),

  sync: protectedProcedure
    .input(syncInboxAccountSchema)
    .mutation(async ({ input }) => {
      const event = await tasks.trigger("sync-inbox-account", {
        id: input.id,
        manualSync: input.manualSync || false,
      });

      return event;
    }),
});
