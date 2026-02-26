import {
  createTRPCRouter,
  protectedProcedure,
} from "@api/trpc/init";
import {
  getExportTemplates,
  getExportTemplateById,
  createExportTemplate,
  updateExportTemplate,
  deleteExportTemplate,
  markExportTemplateExecuted,
} from "@midday/db/queries";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

const RECONCILIATION_ROLES = ["owner", "admin", "member", "bookkeeper"];

const ensureExportAccess = (role?: string | null) => {
  if (!role || !RECONCILIATION_ROLES.includes(role)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Export access required",
    });
  }
};

const exportTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  format: z.enum(["csv", "xlsx", "pdf", "quickbooks_iif", "xero_csv"]),
  columns: z.array(z.object({
    key: z.string(),
    label: z.string(),
    enabled: z.boolean().default(true),
  })),
  filters: z.record(z.unknown()).optional(),
  dateRange: z.enum(["daily", "weekly", "monthly", "custom"]).optional(),
  scheduleEnabled: z.boolean().optional(),
  scheduleCron: z.string().optional(),
  scheduleEmail: z.string().email().optional(),
});

export const exportTemplatesRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    ensureExportAccess(ctx.role);
    return getExportTemplates(ctx.db, { teamId: ctx.teamId! });
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      ensureExportAccess(ctx.role);
      return getExportTemplateById(ctx.db, {
        id: input.id,
        teamId: ctx.teamId!,
      });
    }),

  create: protectedProcedure
    .input(exportTemplateSchema)
    .mutation(async ({ input, ctx }) => {
      ensureExportAccess(ctx.role);
      return createExportTemplate(ctx.db, {
        ...input,
        teamId: ctx.teamId!,
      });
    }),

  update: protectedProcedure
    .input(
      exportTemplateSchema.partial().extend({
        id: z.string().uuid(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      ensureExportAccess(ctx.role);
      return updateExportTemplate(ctx.db, {
        ...input,
        teamId: ctx.teamId!,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      ensureExportAccess(ctx.role);
      return deleteExportTemplate(ctx.db, {
        id: input.id,
        teamId: ctx.teamId!,
      });
    }),

  execute: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      ensureExportAccess(ctx.role);

      const template = await getExportTemplateById(ctx.db, {
        id: input.id,
        teamId: ctx.teamId!,
      });

      if (!template) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Mark template as executed
      await markExportTemplateExecuted(ctx.db, {
        id: input.id,
        teamId: ctx.teamId!,
      });

      // Export execution would trigger a Trigger.dev task
      return { executing: true, templateId: input.id, format: template.format };
    }),
});
