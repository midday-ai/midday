import {
  createInvoiceTemplateSchema,
  deleteInvoiceTemplateSchema,
  setDefaultInvoiceTemplateSchema,
  updateInvoiceTemplateSchema,
  upsertInvoiceTemplateSchema,
} from "@api/schemas/invoice";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { parseInputValue } from "@api/utils/parse";
import {
  createInvoiceTemplate,
  deleteInvoiceTemplate,
  getInvoiceTemplate,
  getInvoiceTemplateById,
  listInvoiceTemplates,
  setDefaultInvoiceTemplate,
  updateInvoiceTemplate,
} from "@midday/db/queries";
import { z } from "zod";

export const invoiceTemplatesRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx: { db, teamId } }) => {
    return listInvoiceTemplates(db, teamId!);
  }),

  create: protectedProcedure
    .input(createInvoiceTemplateSchema)
    .mutation(async ({ input, ctx: { db, teamId, session } }) => {
      const { paymentDetails, fromDetails, noteDetails, ...rest } = input;
      return createInvoiceTemplate(db, {
        ...rest,
        teamId: teamId!,
        userId: session?.user.id,
        paymentDetails: parseInputValue(paymentDetails),
        fromDetails: parseInputValue(fromDetails),
        noteDetails: parseInputValue(noteDetails),
      });
    }),

  update: protectedProcedure
    .input(updateInvoiceTemplateSchema)
    .mutation(async ({ input, ctx: { db, teamId, session } }) => {
      const { id, paymentDetails, fromDetails, noteDetails, ...rest } = input;
      return updateInvoiceTemplate(db, {
        id,
        ...rest,
        teamId: teamId!,
        paymentDetails: parseInputValue(paymentDetails),
        fromDetails: parseInputValue(fromDetails),
        noteDetails: parseInputValue(noteDetails),
      });
    }),

  delete: protectedProcedure
    .input(deleteInvoiceTemplateSchema)
    .mutation(async ({ input, ctx: { db, teamId } }) => {
      return deleteInvoiceTemplate(db, input.id, teamId!);
    }),

  setDefault: protectedProcedure
    .input(setDefaultInvoiceTemplateSchema)
    .mutation(async ({ input, ctx: { db, teamId } }) => {
      return setDefaultInvoiceTemplate(db, input.id, teamId!);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx: { db, teamId } }) => {
      return getInvoiceTemplateById(db, input.id, teamId!);
    }),

  upsert: protectedProcedure
    .input(
      upsertInvoiceTemplateSchema.extend({
        templateId: z.string().uuid().optional(),
      }),
    )
    .mutation(async ({ input, ctx: { db, teamId, session } }) => {
      const { templateId, paymentDetails, fromDetails, noteDetails, ...rest } =
        input;

      // If templateId is provided, update that template
      // Otherwise, update the default template (for backward compatibility)
      const targetTemplateId =
        templateId || (await getInvoiceTemplate(db, teamId!))?.id || undefined;

      if (!targetTemplateId) {
        throw new Error("No template found to update");
      }

      return updateInvoiceTemplate(db, {
        id: targetTemplateId,
        ...rest,
        teamId: teamId!,
        paymentDetails: parseInputValue(paymentDetails),
        fromDetails: parseInputValue(fromDetails),
        noteDetails: parseInputValue(noteDetails),
      });
    }),
});
