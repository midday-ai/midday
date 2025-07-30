import {
  deleteInboxAccount,
  getInboxAccounts,
} from "@api/db/queries/inbox-accounts";
import {
  connectInboxAccountSchema,
  deleteInboxAccountSchema,
} from "@api/schemas/inbox-accounts";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { InboxConnector } from "@midday/inbox/connector";
import { schedules } from "@trigger.dev/sdk/v3";

export const inboxAccountsRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx: { db, teamId } }) => {
    return getInboxAccounts(db, teamId!);
  }),

  connect: protectedProcedure
    .input(connectInboxAccountSchema)
    .mutation(async ({ input }) => {
      try {
        const connector = new InboxConnector(input.provider);

        return await connector.connect();
      } catch (error) {
        console.error(error);
        return null;
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
        await schedules.deactivate(data.scheduleId);
      }

      return data;
    }),
});
