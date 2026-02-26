import { upsertDealTemplateSchema } from "@api/schemas/deal";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { parseInputValue } from "@api/utils/parse";
import {
  createDealTemplate,
  deleteDealTemplate,
  getDealTemplateById,
  getDealTemplateCount,
  getDealTemplates,
  setDefaultTemplate,
  upsertDealTemplate,
} from "@midday/db/queries";
import { z } from "zod";

export const dealTemplateRouter = createTRPCRouter({
  // List all templates for the team
  list: protectedProcedure.query(async ({ ctx: { db, teamId } }) => {
    return getDealTemplates(db, teamId!);
  }),

  // Get a single template by ID
  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx: { db, teamId }, input }) => {
      return getDealTemplateById(db, { id: input.id, teamId: teamId! });
    }),

  // Create a new template
  create: protectedProcedure
    .input(
      upsertDealTemplateSchema.extend({
        name: z.string().min(1, "Template name is required"),
        isDefault: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      return createDealTemplate(db, {
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
      upsertDealTemplateSchema.extend({
        id: z.string().uuid().optional(), // Optional - if not provided, upserts the default template
        name: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      return upsertDealTemplate(db, {
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
      return deleteDealTemplate(db, { id: input.id, teamId: teamId! });
    }),

  // Get template count for the team
  count: protectedProcedure.query(async ({ ctx: { db, teamId } }) => {
    return getDealTemplateCount(db, teamId!);
  }),
});
