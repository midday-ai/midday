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
  updateInvoice,
  updateInvoiceRecurring,
} from "@midday/db/queries";
import { calculateNextScheduledDate } from "@midday/db/utils/invoice-recurring";
import { Notifications } from "@midday/notifications";
import { TRPCError } from "@trpc/server";

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
        await updateInvoice(db, {
          id: invoiceId,
          teamId,
          invoiceRecurringId: result.id,
          recurringSequence: 1,
        });

        // Calculate the next scheduled date (since first invoice is already generated)
        const nextScheduledAt = calculateNextScheduledDate(
          {
            frequency: recurringData.frequency,
            frequencyDay: recurringData.frequencyDay ?? null,
            frequencyWeek: recurringData.frequencyWeek ?? null,
            frequencyInterval: recurringData.frequencyInterval ?? null,
            timezone: recurringData.timezone,
          },
          new Date(),
        );

        // Update the recurring series with correct next date and mark one invoice as generated
        await updateInvoiceRecurring(db, {
          id: result.id,
          teamId,
          invoicesGenerated: 1,
          nextScheduledAt: nextScheduledAt.toISOString(),
          lastGeneratedAt: new Date().toISOString(),
        });
      }

      // Send notification for recurring series started
      if (result?.id) {
        const notifications = new Notifications(db);
        // Fire and forget - don't block the response on notification
        notifications
          .create("recurring_series_started", teamId, {
            recurringId: result.id,
            invoiceId: invoiceId,
            customerName: recurringData.customerName ?? undefined,
            frequency: recurringData.frequency,
            endType: recurringData.endType,
            endDate: recurringData.endDate ?? undefined,
            endCount: recurringData.endCount ?? undefined,
          })
          .catch((error) => {
            console.error(
              "Failed to send recurring_series_started notification:",
              error,
            );
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

      // When frequencyDay is being updated without frequency, validate against existing frequency
      if (
        input.frequencyDay !== undefined &&
        input.frequencyDay !== null &&
        input.frequency === undefined
      ) {
        const existing = await getInvoiceRecurringById(db, {
          id: input.id,
          teamId,
        });

        if (!existing) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Recurring invoice series not found",
          });
        }

        // Validate frequencyDay against the existing frequency
        const existingFrequency = existing.frequency;

        if (
          (existingFrequency === "weekly" ||
            existingFrequency === "monthly_weekday") &&
          input.frequencyDay > 6
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `For ${existingFrequency} frequency, frequencyDay must be 0-6 (Sunday-Saturday)`,
          });
        }

        if (
          existingFrequency === "monthly_date" &&
          (input.frequencyDay < 1 || input.frequencyDay > 31)
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "For monthly_date frequency, frequencyDay must be 1-31 (day of month)",
          });
        }
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
