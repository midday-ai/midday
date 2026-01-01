import { upsertInvoiceTemplateSchema } from "@api/schemas/invoice";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { parseInputValue } from "@api/utils/parse";
import {
  createInvoiceTemplate,
  deleteInvoiceTemplate,
  getInvoiceTemplateById,
  getInvoiceTemplateCount,
  getInvoiceTemplates,
  setDefaultTemplate,
  upsertInvoiceTemplate,
} from "@midday/db/queries";
import { z } from "zod";

export const invoiceTemplateRouter = createTRPCRouter({
  // List all templates for the team
  list: protectedProcedure.query(async ({ ctx: { db, teamId } }) => {
    return getInvoiceTemplates(db, teamId!);
  }),

  // Get a single template by ID
  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx: { db, teamId }, input }) => {
      return getInvoiceTemplateById(db, { id: input.id, teamId: teamId! });
    }),

  // Create a new template
  create: protectedProcedure
    .input(
      upsertInvoiceTemplateSchema.extend({
        name: z.string().min(1, "Template name is required"),
        isDefault: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      return createInvoiceTemplate(db, {
        ...input,
        teamId: teamId!,
        fromDetails: parseInputValue(input.fromDetails),
        paymentDetails: parseInputValue(input.paymentDetails),
        noteDetails: parseInputValue(input.noteDetails),
      });
    }),

  // Upsert a template - updates by ID if provided, or updates/creates default template
  upsert: protectedProcedure
    .input(
      upsertInvoiceTemplateSchema.extend({
        id: z.string().uuid().optional(), // Optional - if not provided, upserts the default template
        name: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      return upsertInvoiceTemplate(db, {
        ...input,
        teamId: teamId!,
        fromDetails: parseInputValue(input.fromDetails),
        paymentDetails: parseInputValue(input.paymentDetails),
        noteDetails: parseInputValue(input.noteDetails),
      });
    }),

  // Set a template as the default
  setDefault: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      return setDefaultTemplate(db, { id: input.id, teamId: teamId! });
    }),

  // Delete a template (returns the new default to switch to)
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      return deleteInvoiceTemplate(db, { id: input.id, teamId: teamId! });
    }),

  // Get template count for the team
  count: protectedProcedure.query(async ({ ctx: { db, teamId } }) => {
    return getInvoiceTemplateCount(db, teamId!);
  }),
});
