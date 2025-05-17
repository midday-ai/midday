import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { upsertInvoiceTemplateSchema } from "@api/trpc/routers/invoice/schema";
import { parseInputValue } from "@api/utils/parse";
import { updateInvoiceTemplate } from "@midday/supabase/mutations";

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
