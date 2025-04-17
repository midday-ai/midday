import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { deleteInboxAccount } from "@midday/supabase/mutations";
import { getInboxAccountsQuery } from "@midday/supabase/queries";
import { z } from "zod";

export const inboxAccountsRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx: { supabase, teamId } }) => {
    return getInboxAccountsQuery(supabase, teamId!);
  }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx: { supabase }, input }) => {
      return deleteInboxAccount(supabase, input);
    }),
});
