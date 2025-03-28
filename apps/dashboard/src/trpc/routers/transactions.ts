import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { deleteTransactions } from "@midday/supabase/mutations";
import {
  getTransactionQuery,
  getTransactionsQuery,
} from "@midday/supabase/queries";
import { z } from "zod";

export const transactionsRouter = createTRPCRouter({
  get: protectedProcedure
    .input(
      z.object({
        cursor: z.string().nullable().optional(),
        sort: z.array(z.string(), z.string()).nullable().optional(),
        filter: z
          .object({
            q: z.string().nullable().optional(),
            categories: z.array(z.string()).nullable().optional(),
            tags: z.array(z.string()).nullable().optional(),
            start: z.string().nullable().optional(),
            end: z.string().nullable().optional(),
            accounts: z.array(z.string()).nullable().optional(),
            assignees: z.array(z.string()).nullable().optional(),
            statuses: z.array(z.string()).nullable().optional(),
            recurring: z.array(z.string()).nullable().optional(),
            attachments: z.enum(["include", "exclude"]).nullable().optional(),
            amount_range: z.array(z.number()).nullable().optional(),
            amount: z.array(z.string()).nullable().optional(),
            type: z.enum(["income", "expense"]).nullable().optional(),
          })
          .optional(),
      }),
    )
    .query(async ({ input, ctx: { supabase, teamId } }) => {
      return getTransactionsQuery(supabase, {
        ...input,
        teamId,
      });
    }),

  deleteMany: protectedProcedure
    .input(z.object({ ids: z.array(z.string()) }))
    .mutation(async ({ input, ctx: { supabase } }) => {
      return deleteTransactions(supabase, { ids: input.ids });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx: { supabase } }) => {
      const { data } = await getTransactionQuery(supabase, input.id);

      return data;
    }),

  getAmountRange: protectedProcedure.query(
    async ({ ctx: { supabase, teamId } }) => {
      const { data } = await supabase.rpc(
        "get_transactions_amount_range_data",
        {
          team_id: teamId,
        },
      );

      return data;
    },
  ),
});
