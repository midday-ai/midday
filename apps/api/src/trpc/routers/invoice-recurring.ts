import {
  createInvoiceRecurringSchema,
  deleteInvoiceRecurringSchema,
  getInvoiceRecurringByIdSchema,
  getInvoiceRecurringListSchema,
  getUpcomingInvoicesSchema,
  pauseResumeInvoiceRecurringSchema,
  updateInvoiceRecurringSchema,
} from "@api/schemas/invoice-recurring";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import {
  createInvoiceRecurring,
  deleteInvoiceRecurring,
  getInvoiceRecurringById,
  getInvoiceRecurringList,
  getUpcomingInvoices,
  pauseInvoiceRecurring,
  resumeInvoiceRecurring,
  updateInvoiceRecurring,
} from "@midday/db/queries";
import { invoices } from "@midday/db/schema";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";

export const invoiceRecurringRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createInvoiceRecurringSchema)
    .mutation(async ({ input, ctx: { db, teamId, session } }) => {
      if (!teamId || !session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Team and user context required",
        });
      }

      const { invoiceId, ...recurringData } = input;

      // Create the recurring series
      const result = await createInvoiceRecurring(db, {
        teamId,
        userId: session.user.id,
        ...recurringData,
      });

      // If a draft invoice ID is provided, link it as the first invoice in the series
      if (invoiceId && result?.id) {
        // Update the invoice to link it to the recurring series
        await db
          .update(invoices)
          .set({
            invoiceRecurringId: result.id,
            recurringSequence: 1,
          })
          .where(and(eq(invoices.id, invoiceId), eq(invoices.teamId, teamId)));

        // Update the recurring series to mark one invoice as generated
        await updateInvoiceRecurring(db, {
          id: result.id,
          teamId,
          invoicesGenerated: 1,
        });
      }

      return result;
    }),

  update: protectedProcedure
    .input(updateInvoiceRecurringSchema)
    .mutation(async ({ input, ctx: { db, teamId } }) => {
      if (!teamId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Team context required",
        });
      }

      const result = await updateInvoiceRecurring(db, {
        ...input,
        teamId,
      });

      if (!result) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Recurring invoice series not found",
        });
      }

      return result;
    }),

  get: protectedProcedure
    .input(getInvoiceRecurringByIdSchema)
    .query(async ({ input, ctx: { db, teamId } }) => {
      if (!teamId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Team context required",
        });
      }

      const result = await getInvoiceRecurringById(db, {
        id: input.id,
        teamId,
      });

      if (!result) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Recurring invoice series not found",
        });
      }

      return result;
    }),

  list: protectedProcedure
    .input(getInvoiceRecurringListSchema.optional())
    .query(async ({ input, ctx: { db, teamId } }) => {
      if (!teamId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Team context required",
        });
      }

      return getInvoiceRecurringList(db, {
        teamId,
        cursor: input?.cursor ?? null,
        pageSize: input?.pageSize ?? 25,
        status: input?.status ?? undefined,
        customerId: input?.customerId ?? undefined,
      });
    }),

  delete: protectedProcedure
    .input(deleteInvoiceRecurringSchema)
    .mutation(async ({ input, ctx: { db, teamId } }) => {
      if (!teamId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Team context required",
        });
      }

      const result = await deleteInvoiceRecurring(db, {
        id: input.id,
        teamId,
      });

      if (!result) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Recurring invoice series not found",
        });
      }

      return { id: result.id };
    }),

  pause: protectedProcedure
    .input(pauseResumeInvoiceRecurringSchema)
    .mutation(async ({ input, ctx: { db, teamId } }) => {
      if (!teamId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Team context required",
        });
      }

      const result = await pauseInvoiceRecurring(db, {
        id: input.id,
        teamId,
      });

      if (!result) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Recurring invoice series not found",
        });
      }

      return result;
    }),

  resume: protectedProcedure
    .input(pauseResumeInvoiceRecurringSchema)
    .mutation(async ({ input, ctx: { db, teamId } }) => {
      if (!teamId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Team context required",
        });
      }

      const result = await resumeInvoiceRecurring(db, {
        id: input.id,
        teamId,
      });

      if (!result) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Recurring invoice series not found or not paused",
        });
      }

      return result;
    }),

  getUpcoming: protectedProcedure
    .input(getUpcomingInvoicesSchema)
    .query(async ({ input, ctx: { db, teamId } }) => {
      if (!teamId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Team context required",
        });
      }

      const result = await getUpcomingInvoices(db, {
        id: input.id,
        teamId,
        limit: input.limit,
      });

      if (!result) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Recurring invoice series not found",
        });
      }

      return result;
    }),
});
