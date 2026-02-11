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
import { isDateInFutureUTC } from "@midday/invoice/recurring";
import { decodeJobId, getQueue } from "@midday/job-client";
import { createLoggerWithContext } from "@midday/logger";
import { Notifications } from "@midday/notifications";
import { TRPCError } from "@trpc/server";

const logger = createLoggerWithContext("trpc:invoice-recurring");

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

      // Validate that the customer exists and has an email address for sending invoices
      // Recurring invoices auto-send, so we need a valid customer with email
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

      // Use a transaction to ensure atomicity of all operations
      // This prevents orphaned recurring series if invoice linking fails
      const result = await db.transaction(async (tx) => {
        // Determine the issue date from the existing invoice (if provided)
        const issueDate = existingInvoice?.issueDate ?? null;

        // Create the recurring series with the issue date
        // This allows the series to schedule the first invoice for a future date
        const recurring = await createInvoiceRecurring(tx, {
          teamId,
          userId: session.user.id,
          ...recurringData,
          issueDate,
        });

        if (!recurring?.id) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create recurring invoice series",
          });
        }

        // If a draft invoice ID is provided, link it as the first invoice in the series
        if (invoiceId) {
          // Verify the invoice exists and belongs to this team
          if (!existingInvoice) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Invoice not found or does not belong to this team",
            });
          }

          // Determine if the issue date is in the future (at the UTC day level)
          // Using isDateInFutureUTC ensures consistent behavior with the frontend
          const now = new Date();
          const issueDateParsed = issueDate ? new Date(issueDate) : now;
          const isIssueDateFuture = isDateInFutureUTC(issueDateParsed, now);

          // Update the invoice to link it to the recurring series
          await updateInvoice(tx, {
            id: invoiceId,
            teamId,
            invoiceRecurringId: recurring.id,
            recurringSequence: 1,
          });

          if (isIssueDateFuture) {
            // Issue date is in the future:
            // - The invoice is linked but not yet "generated" by the scheduler
            // - nextScheduledAt is already set to the issue date by createInvoiceRecurring
            // - invoicesGenerated stays at 0
            // - When the scheduler runs on/after issue date, it will process this invoice
            // No need to update the recurring series - it's already configured correctly
            return recurring;
          }

          // Issue date is today or in the past:
          // Calculate the next scheduled date from the invoice's issue date
          // This ensures "Monthly on the 15th" with issue date Jan 15 → next invoice Feb 15
          const nextScheduledAt = calculateNextScheduledDate(
            {
              frequency: recurringData.frequency,
              frequencyDay: recurringData.frequencyDay ?? null,
              frequencyWeek: recurringData.frequencyWeek ?? null,
              frequencyInterval: recurringData.frequencyInterval ?? null,
              timezone: recurringData.timezone,
            },
            issueDateParsed,
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
            logger.error(
              "Failed to send recurring_series_started notification",
              { error: error instanceof Error ? error.message : String(error) },
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

      // Cross-field validation for partial updates
      // NOTE: This validation cannot be done in the Zod schema because partial updates
      // need to validate against existing database values. The schema validates
      // individual field constraints; this validates cross-field dependencies that
      // require fetching existing data.

      // Frequencies that require frequencyDay as day of week (0-6)
      const dayOfWeekFrequencies = [
        "weekly",
        "biweekly",
        "monthly_weekday",
      ] as const;

      // Frequencies that require frequencyDay as day of month (1-31)
      const dayOfMonthFrequencies = [
        "monthly_date",
        "quarterly",
        "semi_annual",
        "annual",
      ] as const;

      // All frequencies that require a non-null frequencyDay value
      const frequenciesRequiringDay = [
        ...dayOfWeekFrequencies,
        ...dayOfMonthFrequencies,
      ] as const;

      // Validate cross-field constraints that require fetching existing data
      // Frequency-related cases:
      // Case 1: frequencyDay is being updated without frequency - validate against existing frequency
      // Case 2: frequency is being updated without frequencyDay - validate against existing frequencyDay
      // Case 3: frequency requires frequencyDay but frequencyDay is explicitly null - validate against existing
      // Case 4: frequencyWeek is being updated without frequency - validate against existing frequency
      // Case 5: frequency is being updated to monthly_weekday without frequencyWeek - validate against existing
      // Case 6: frequencyWeek is being set to null when frequency is monthly_weekday
      // Case 7: frequencyInterval is being set to null without frequency - validate against existing frequency
      // End type-related cases:
      // Case 8: endDate is being set to null without endType - validate against existing endType
      // Case 9: endCount is being set to null without endType - validate against existing endType
      const needsCrossFieldValidation =
        (input.frequencyDay !== undefined &&
          input.frequencyDay !== null &&
          input.frequency === undefined) ||
        (input.frequency !== undefined && input.frequencyDay === undefined) ||
        (input.frequency !== undefined &&
          frequenciesRequiringDay.includes(
            input.frequency as (typeof frequenciesRequiringDay)[number],
          ) &&
          input.frequencyDay === null) ||
        // frequencyWeek validation cases
        (input.frequencyWeek !== undefined &&
          input.frequencyWeek !== null &&
          input.frequency === undefined) ||
        (input.frequency === "monthly_weekday" &&
          input.frequencyWeek === undefined) ||
        (input.frequencyWeek === null && input.frequency === undefined) ||
        // frequencyInterval validation case - setting to null without changing frequency
        (input.frequencyInterval === null && input.frequency === undefined) ||
        // endDate/endCount validation cases - setting to null without changing endType
        (input.endDate === null && input.endType === undefined) ||
        (input.endCount === null && input.endType === undefined);

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

        // Determine effective frequency, frequencyDay, and frequencyWeek for validation
        const effectiveFrequency = input.frequency ?? existing.frequency;
        const effectiveFrequencyDay =
          input.frequencyDay === undefined
            ? existing.frequencyDay
            : input.frequencyDay;
        const effectiveFrequencyWeek =
          input.frequencyWeek === undefined
            ? existing.frequencyWeek
            : input.frequencyWeek;

        // Validate that frequencyDay is not being set to null when frequency requires it
        if (
          input.frequencyDay === null &&
          frequenciesRequiringDay.includes(
            effectiveFrequency as (typeof frequenciesRequiringDay)[number],
          )
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `frequencyDay is required for ${effectiveFrequency} frequency and cannot be null`,
          });
        }

        // Validate that frequencyWeek is not null when frequency is monthly_weekday
        if (
          effectiveFrequency === "monthly_weekday" &&
          effectiveFrequencyWeek === null
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "frequencyWeek is required for monthly_weekday frequency and cannot be null",
          });
        }

        // Validate frequencyDay range based on frequency type
        if (
          effectiveFrequencyDay !== null &&
          effectiveFrequencyDay !== undefined
        ) {
          // Validate day-of-week frequencies (0-6)
          if (
            dayOfWeekFrequencies.includes(
              effectiveFrequency as (typeof dayOfWeekFrequencies)[number],
            ) &&
            effectiveFrequencyDay > 6
          ) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `For ${effectiveFrequency} frequency, frequencyDay must be 0-6 (Sunday-Saturday)`,
            });
          }

          // Validate day-of-month frequencies (1-31)
          if (
            dayOfMonthFrequencies.includes(
              effectiveFrequency as (typeof dayOfMonthFrequencies)[number],
            ) &&
            (effectiveFrequencyDay < 1 || effectiveFrequencyDay > 31)
          ) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `For ${effectiveFrequency} frequency, frequencyDay must be 1-31 (day of month)`,
            });
          }
        }

        // Validate frequencyWeek range when frequency is monthly_weekday
        if (
          effectiveFrequency === "monthly_weekday" &&
          effectiveFrequencyWeek !== null &&
          effectiveFrequencyWeek !== undefined &&
          (effectiveFrequencyWeek < 1 || effectiveFrequencyWeek > 5)
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "For monthly_weekday frequency, frequencyWeek must be 1-5 (1st through 5th occurrence)",
          });
        }

        // Validate frequencyInterval is not being set to null when frequency is 'custom'
        if (
          input.frequencyInterval === null &&
          effectiveFrequency === "custom"
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "frequencyInterval is required for custom frequency and cannot be null",
          });
        }

        // Determine effective endType for validation
        const effectiveEndType = input.endType ?? existing.endType;

        // Validate endDate is not being set to null when endType is 'on_date'
        if (input.endDate === null && effectiveEndType === "on_date") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "endDate is required when endType is 'on_date' and cannot be null",
          });
        }

        // Validate endCount is not being set to null when endType is 'after_count'
        if (input.endCount === null && effectiveEndType === "after_count") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "endCount is required when endType is 'after_count' and cannot be null",
          });
        }
      }

      // If customerId is being updated, validate the new customer has an email
      // Recurring invoices auto-send, so we need a valid email destination
      if (input.customerId !== undefined) {
        const customer = await getCustomerById(db, {
          id: input.customerId,
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

      // Use a transaction to ensure both operations succeed or fail together
      const result = await db.transaction(async (tx) => {
        // Cancel the recurring series
        const recurring = await deleteInvoiceRecurring(tx, {
          id: input.id,
          teamId,
        });

        if (!recurring) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Recurring invoice series not found",
          });
        }

        // Find and update scheduled invoices linked to this series
        // This reverts any "scheduled" invoices back to "draft"
        const scheduledInvoices = await tx.query.invoices.findMany({
          where: (invoices, { eq, and }) =>
            and(
              eq(invoices.invoiceRecurringId, input.id),
              eq(invoices.teamId, teamId),
              eq(invoices.status, "scheduled"),
            ),
          columns: { id: true, scheduledJobId: true },
        });

        // Collect job IDs to remove AFTER transaction commits
        const jobIdsToRemove: string[] = [];

        // First, update all invoices within the transaction
        for (const invoice of scheduledInvoices) {
          // Collect job ID for removal after transaction
          if (invoice.scheduledJobId) {
            const { jobId: rawJobId } = decodeJobId(invoice.scheduledJobId);
            jobIdsToRemove.push(rawJobId);
          }

          // Revert the invoice to draft
          await updateInvoice(tx, {
            id: invoice.id,
            teamId,
            status: "draft",
            scheduledAt: null,
            scheduledJobId: null,
          });
        }

        return { recurring, jobIdsToRemove };
      });

      // Remove BullMQ jobs AFTER the transaction has committed successfully
      // This ensures we don't remove jobs if the database update fails
      const queue = getQueue("invoices");
      for (const jobId of result.jobIdsToRemove) {
        const job = await queue.getJob(jobId);
        if (job) {
          await job.remove();
        }
      }

      return { id: result.recurring.id };
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

      // Use a transaction to ensure both operations succeed or fail together
      const result = await db.transaction(async (tx) => {
        const recurring = await pauseInvoiceRecurring(tx, {
          id: input.id,
          teamId,
        });

        if (!recurring) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Recurring invoice series not found",
          });
        }

        // Revert any "scheduled" invoices back to "draft"
        // This prevents sending invoices while the series is paused
        const scheduledInvoices = await tx.query.invoices.findMany({
          where: (invoices, { eq, and }) =>
            and(
              eq(invoices.invoiceRecurringId, input.id),
              eq(invoices.teamId, teamId),
              eq(invoices.status, "scheduled"),
            ),
          columns: { id: true, scheduledJobId: true },
        });

        // Collect job IDs to remove AFTER transaction commits
        const jobIdsToRemove: string[] = [];

        // First, update all invoices within the transaction
        for (const invoice of scheduledInvoices) {
          // Collect job ID for removal after transaction
          if (invoice.scheduledJobId) {
            const { jobId: rawJobId } = decodeJobId(invoice.scheduledJobId);
            jobIdsToRemove.push(rawJobId);
          }

          // Revert the invoice to draft
          await updateInvoice(tx, {
            id: invoice.id,
            teamId,
            status: "draft",
            scheduledAt: null,
            scheduledJobId: null,
          });
        }

        return { recurring, jobIdsToRemove };
      });

      // Remove BullMQ jobs AFTER the transaction has committed successfully
      // This ensures we don't remove jobs if the database update fails
      const queue = getQueue("invoices");
      for (const jobId of result.jobIdsToRemove) {
        const job = await queue.getJob(jobId);
        if (job) {
          await job.remove();
        }
      }

      return result.recurring;
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
