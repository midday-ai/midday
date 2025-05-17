import { updateInvoiceTemplate } from "@api/db/queries/invoice-templates";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { upsertInvoiceTemplateSchema } from "@api/trpc/routers/invoice/schema";
import { parseInputValue } from "@api/utils/parse";

export const invoiceTemplateRouter = createTRPCRouter({
  upsert: protectedProcedure
    .input(upsertInvoiceTemplateSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      return updateInvoiceTemplate(db, {
        ...input,
        teamId: teamId!,
        from_details: parseInputValue(input.from_details),
        payment_details: parseInputValue(input.payment_details),
      });
    }),
});
