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
        fromDetails: parseInputValue(input.fromDetails),
        paymentDetails: parseInputValue(input.paymentDetails),
      });
    }),
});
