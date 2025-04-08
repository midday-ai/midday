import { generateToken } from "@midday/invoice/token";
import { deleteCustomer, upsertCustomer } from "@midday/supabase/mutations";
import { getCustomerQuery, getCustomersQuery } from "@midday/supabase/queries";
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

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx: { supabase }, input }) => {
      const { data } = await getCustomerQuery(supabase, input.id);

      return data;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx: { supabase }, input }) => {
      const { data } = await deleteCustomer(supabase, input.id);

      return data;
    }),

  upsert: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid().optional(),
        name: z.string(),
        email: z.string().email(),
        country: z.string().nullable().optional(),
        address_line_1: z.string().nullable().optional(),
        address_line_2: z.string().nullable().optional(),
        city: z.string().nullable().optional(),
        state: z.string().nullable().optional(),
        zip: z.string().nullable().optional(),
        note: z.string().nullable().optional(),
        website: z.string().nullable().optional(),
        phone: z.string().nullable().optional(),
        contact: z.string().nullable().optional(),
        tags: z
          .array(
            z.object({
              id: z.string().uuid(),
              value: z.string(),
            }),
          )
          .optional()
          .nullable(),
      }),
    )
    .mutation(async ({ ctx: { supabase, teamId }, input }) => {
      const token = input.id ? await generateToken(input.id) : undefined;

      const { data } = await upsertCustomer(supabase, {
        ...input,
        token,
        teamId: teamId!,
      });

      return data;
    }),
});
