import { deleteCustomer } from "@midday/supabase/mutations";
import { getCustomersQuery } from "@midday/supabase/queries";
import { z } from "zod";
import { protectedProcedure } from "../init";
import { createTRPCRouter } from "../init";

export const customersRouter = createTRPCRouter({
  get: protectedProcedure
    .input(
      z.object({
        filter: z
          .object({
            q: z.string().nullable().optional(),
          })
          .optional(),
        sort: z.array(z.string(), z.string()).nullable().optional(),
        cursor: z.string().optional(),
        pageSize: z.number().optional(),
      }),
    )
    .query(async ({ ctx: { teamId, supabase }, input }) => {
      return getCustomersQuery(supabase, {
        teamId: teamId!,
        ...input,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx: { supabase }, input }) => {
      const { data } = await deleteCustomer(supabase, input.id);

      return data;
    }),
});
