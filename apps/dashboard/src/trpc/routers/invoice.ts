import {
  getInvoicesQuery,
  getPaymentStatusQuery,
} from "@midday/supabase/queries";
import { z } from "zod";
import { protectedProcedure } from "../init";
import { createTRPCRouter } from "../init";

export const invoiceRouter = createTRPCRouter({
  get: protectedProcedure
    .input(
      z
        .object({
          cursor: z.string().nullable().optional(),
          pageSize: z.number().optional(),
          searchQuery: z.string().nullable().optional(),
          filter: z
            .object({
              start: z.string().nullable().optional(),
              end: z.string().nullable().optional(),
              statuses: z.array(z.string()).nullable().optional(),
              customers: z.array(z.string()).nullable().optional(),
            })
            .optional(),
          sort: z.array(z.string()).nullable().optional(),
        })
        .optional(),
    )
    .query(async ({ input, ctx: { supabase, teamId } }) => {
      const { data } = await getInvoicesQuery(supabase, {
        teamId: teamId!,
        ...input,
      });

      return data;
    }),

  paymentStatus: protectedProcedure.query(
    async ({ ctx: { supabase, teamId } }) => {
      const { data } = await getPaymentStatusQuery(supabase, teamId!);

      return data;
    },
  ),
});
