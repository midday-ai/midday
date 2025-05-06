import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import type { deleteConnection } from "@midday/jobs/tasks/bank/delete/delete-connection";
import type { initialBankSetup } from "@midday/jobs/tasks/bank/setup/initial";
import {
  createBankConnection,
  deleteBankConnection,
} from "@midday/supabase/mutations";
import { getBankConnectionsQuery } from "@midday/supabase/queries";
import { tasks } from "@trigger.dev/sdk/v3";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const bankConnectionsRouter = createTRPCRouter({
  get: protectedProcedure
    .input(z.object({ enabled: z.boolean().optional() }).optional())
    .query(async ({ ctx: { supabase, teamId }, input }) => {
      const { data } = await getBankConnectionsQuery(supabase, {
        teamId: teamId!,
        enabled: input?.enabled,
      });

      return data;
    }),

  create: protectedProcedure
    .input(
      z.object({
        accessToken: z.string().nullable().optional(), // Teller
        enrollmentId: z.string().nullable().optional(), // Teller
        referenceId: z.string().nullable().optional(), // GoCardLess
        provider: z.enum(["gocardless", "teller", "plaid", "enablebanking"]),
        accounts: z.array(
          z.object({
            account_id: z.string(),
            institution_id: z.string(),
            logo_url: z.string().nullable().optional(),
            name: z.string(),
            bank_name: z.string(),
            currency: z.string(),
            enabled: z.boolean(),
            balance: z.number().optional(),
            type: z.enum([
              "credit",
              "depository",
              "other_asset",
              "loan",
              "other_liability",
            ]),
            account_reference: z.string().nullable().optional(), // EnableBanking & GoCardLess
            expires_at: z.string().nullable().optional(), // EnableBanking & GoCardLess
          }),
        ),
      }),
    )
    .mutation(async ({ input, ctx: { supabase, teamId, session } }) => {
      const response = await createBankConnection(supabase, {
        ...input,
        teamId: teamId!,
        userId: session.user.id,
      });

      if (!response?.data) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Bank connection not found",
        });
      }

      const event = await tasks.trigger<typeof initialBankSetup>(
        "initial-bank-setup",
        {
          connectionId: response.data.id,
          teamId: teamId!,
        },
      );

      return event;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx: { supabase } }) => {
      const { data } = await deleteBankConnection(supabase, {
        id: input.id,
      });

      if (!data) {
        throw new Error("Bank connection not found");
      }

      await tasks.trigger<typeof deleteConnection>("delete-connection", {
        referenceId: data.reference_id,
        provider: data.provider!,
        accessToken: data.access_token,
      });

      return data;
    }),
});
