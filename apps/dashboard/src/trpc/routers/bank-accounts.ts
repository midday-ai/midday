import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import {
  createBankAccount,
  deleteBankAccount,
  updateBankAccount,
} from "@midday/supabase/mutations";
import {
  getBankAccountsBalancesQuery,
  getBankAccountsCurrenciesQuery,
  getBankAccountsQuery,
} from "@midday/supabase/queries";
import { nanoid } from "nanoid";
import { z } from "zod";

export const bankAccountsRouter = createTRPCRouter({
  get: protectedProcedure
    .input(
      z
        .object({
          enabled: z.boolean().optional(),
          manual: z.boolean().optional(),
        })
        .optional(),
    )
    .query(async ({ input, ctx: { supabase, teamId } }) => {
      const { data } = await getBankAccountsQuery(supabase, {
        teamId: teamId!,
        enabled: input?.enabled,
        manual: input?.manual,
      });

      return data;
    }),

  currencies: protectedProcedure.query(
    async ({ ctx: { supabase, teamId } }) => {
      return getBankAccountsCurrenciesQuery(supabase, {
        teamId: teamId!,
      });
    },
  ),

  balances: protectedProcedure.query(async ({ ctx: { supabase, teamId } }) => {
    const { data } = await getBankAccountsBalancesQuery(supabase, teamId!);

    return data;
  }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx: { supabase } }) => {
      const { data } = await deleteBankAccount(supabase, input.id);

      return data;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().optional(),
        enabled: z.boolean().optional(),
        balance: z.number().optional(),
        type: z
          .enum([
            "depository",
            "credit",
            "other_asset",
            "loan",
            "other_liability",
          ])
          .optional(),
      }),
    )
    .mutation(async ({ input, ctx: { supabase, teamId } }) => {
      const { data } = await updateBankAccount(supabase, {
        ...input,
        teamId: teamId!,
      });

      return data;
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        currency: z.string().optional(),
        manual: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input, ctx: { supabase, teamId, session } }) => {
      const { data } = await createBankAccount(supabase, {
        ...input,
        teamId: teamId!,
        userId: session.user.id,
        accountId: nanoid(),
        manual: input.manual,
      });

      return data;
    }),
});
