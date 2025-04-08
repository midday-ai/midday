import {
  createCustomerTag,
  deleteCustomerTag,
} from "@midday/supabase/mutations";
import { z } from "zod";
import { protectedProcedure } from "../init";
import { createTRPCRouter } from "../init";

export const customerTagsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        customerId: z.string(),
        tagId: z.string(),
      }),
    )
    .mutation(async ({ ctx: { supabase, teamId }, input }) => {
      const { data } = await createCustomerTag(supabase, {
        teamId: teamId!,
        customerId: input.customerId,
        tagId: input.tagId,
      });

      return data;
    }),

  delete: protectedProcedure
    .input(
      z.object({
        customerId: z.string(),
        tagId: z.string(),
      }),
    )
    .mutation(async ({ ctx: { supabase }, input }) => {
      const { data } = await deleteCustomerTag(supabase, {
        customerId: input.customerId,
        tagId: input.tagId,
      });

      return data;
    }),
});
