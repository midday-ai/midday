import { parseInputValue } from "@/components/invoice/utils";
import { updateInvoiceTemplate } from "@midday/supabase/mutations";
import { createTRPCRouter, protectedProcedure } from "../init";
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
