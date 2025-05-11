import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { InboxConnector } from "@midday/inbox/connector";
import { deleteInboxAccount } from "@midday/supabase/mutations";
import { getInboxAccountsQuery } from "@midday/supabase/queries";
import { schedules } from "@trigger.dev/sdk/v3";
import { z } from "zod";

export const inboxAccountsRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx: { supabase, teamId } }) => {
    return getInboxAccountsQuery(supabase, teamId!);
  }),

  connect: protectedProcedure
    .input(z.object({ provider: z.enum(["gmail", "outlook"]) }))
    .mutation(async ({ input }) => {
      const connector = new InboxConnector(input.provider);

      return await connector.connect();
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx: { supabase }, input }) => {
      const { data } = await deleteInboxAccount(supabase, input);

      if (data?.schedule_id) {
        await schedules.deactivate(data.schedule_id);
      }

      return data;
    }),
});
