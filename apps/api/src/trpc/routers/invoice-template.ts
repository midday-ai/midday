import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { parseInputValue } from "@api/utils/parse";
import { updateInvoiceTemplate } from "@midday/supabase/mutations";
import { upsertInvoiceTemplateSchema } from "./invoice/schema";

export const invoiceTemplateRouter = createTRPCRouter({
  upsert: protectedProcedure
    .input(upsertInvoiceTemplateSchema)
    .mutation(async ({ ctx: { supabase, teamId }, input }) => {
      const { data } = await updateInvoiceTemplate(supabase, {
        ...input,
        teamId: teamId!,
        from_details: parseInputValue(input.from_details),
        payment_details: parseInputValue(input.payment_details),
      });

      return data;
    }),
});
