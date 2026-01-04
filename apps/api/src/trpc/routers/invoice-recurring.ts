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
  getCustomerById,
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

      // If an invoice ID is provided, check if it's already linked to a recurring series
      // This prevents creating duplicate series if the user retries after a partial failure
      let existingInvoice: {
        id: string;
        invoiceRecurringId: string | null;
        issueDate: string | null;
      } | null = null;

      if (invoiceId) {
        const foundInvoice = await db.query.invoices.findFirst({
          where: (invoices, { eq, and }) =>
            and(eq(invoices.id, invoiceId), eq(invoices.teamId, teamId)),
          columns: {
            id: true,
            invoiceRecurringId: true,
            issueDate: true,
          },
        });
        existingInvoice = foundInvoice ?? null;

        if (existingInvoice?.invoiceRecurringId) {
          // Invoice is already linked to a series - return the existing series
          // This makes the operation idempotent
          const existingSeries = await getInvoiceRecurringById(db, {
            id: existingInvoice.invoiceRecurringId,
            teamId,
          });

          if (existingSeries) {
            return existingSeries;
          }
        }
      }

      // Validate that the customer has an email address for sending invoices
      // Recurring invoices auto-send, so we need a valid email destination
      if (recurringData.customerId) {
        const customer = await getCustomerById(db, {
          id: recurringData.customerId,
          teamId,
        });

        if (!customer) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Customer not found",
          });
        }

        const customerEmail = customer.billingEmail || customer.email;
        if (!customerEmail) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Customer must have an email address to receive recurring invoices. Please add an email to the customer profile.",
          });
        }
      }

      // Use a transaction to ensure atomicity of all operations
      // This prevents orphaned recurring series if invoice linking fails
      const result = await db.transaction(async (tx) => {
        // Create the recurring series
        const recurring = await createInvoiceRecurring(tx, {
          teamId,
          userId: session.user.id,
          ...recurringData,
        });

        if (!recurring?.id) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create recurring invoice series",
          });
        }

        // If a draft invoice ID is provided, link it as the first invoice in the series
        if (invoiceId) {
          // Update the invoice to link it to the recurring series
          await updateInvoice(tx, {
            id: invoiceId,
            teamId,
            invoiceRecurringId: recurring.id,
            recurringSequence: 1,
          });

          // Calculate the next scheduled date from the invoice's issue date
          // This ensures "Monthly on the 15th" with issue date Jan 15 → next invoice Feb 15
          const referenceDate = existingInvoice?.issueDate
            ? new Date(existingInvoice.issueDate)
            : new Date();

          const nextScheduledAt = calculateNextScheduledDate(
            {
              frequency: recurringData.frequency,
              frequencyDay: recurringData.frequencyDay ?? null,
              frequencyWeek: recurringData.frequencyWeek ?? null,
              frequencyInterval: recurringData.frequencyInterval ?? null,
              timezone: recurringData.timezone,
            },
            referenceDate,
          );

          // Update the recurring series with correct next date and mark one invoice as generated
          // Return the updated record to ensure the client receives current data
          const updatedRecurring = await updateInvoiceRecurring(tx, {
            id: recurring.id,
            teamId,
            invoicesGenerated: 1,
            nextScheduledAt: nextScheduledAt.toISOString(),
            lastGeneratedAt: new Date().toISOString(),
          });

          return updatedRecurring ?? recurring;
        }

        return recurring;
      });

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

      // Validate frequency/frequencyDay cross-field constraints
      // Case 1: frequencyDay is being updated without frequency - validate against existing frequency
      // Case 2: frequency is being updated without frequencyDay - validate against existing frequencyDay
      const needsCrossFieldValidation =
        (input.frequencyDay !== undefined &&
          input.frequencyDay !== null &&
          input.frequency === undefined) ||
        (input.frequency !== undefined && input.frequencyDay === undefined);

      if (needsCrossFieldValidation) {
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

        // Determine effective frequency and frequencyDay for validation
        const effectiveFrequency = input.frequency ?? existing.frequency;
        const effectiveFrequencyDay =
          input.frequencyDay ?? existing.frequencyDay;

        // Only validate if we have a frequencyDay to check
        if (
          effectiveFrequencyDay !== null &&
          effectiveFrequencyDay !== undefined
        ) {
          if (
            (effectiveFrequency === "weekly" ||
              effectiveFrequency === "biweekly" ||
              effectiveFrequency === "monthly_weekday") &&
            effectiveFrequencyDay > 6
          ) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `For ${effectiveFrequency} frequency, frequencyDay must be 0-6 (Sunday-Saturday)`,
            });
          }

          if (
            effectiveFrequency === "monthly_date" &&
            (effectiveFrequencyDay < 1 || effectiveFrequencyDay > 31)
          ) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message:
                "For monthly_date frequency, frequencyDay must be 1-31 (day of month)",
            });
          }
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
