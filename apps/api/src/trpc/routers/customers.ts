import {
  deleteCustomerSchema,
  enrichCustomerSchema,
  getCustomerByIdSchema,
  getCustomerInvoiceSummarySchema,
  getCustomersSchema,
  upsertCustomerSchema,
} from "@api/schemas/customers";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import {
  deleteCustomer,
  getCustomerById,
  getCustomerInvoiceSummary,
  getCustomers,
  updateCustomerEnrichmentStatus,
  upsertCustomer,
} from "@midday/db/queries";
import { triggerJob } from "@midday/job-client";
import { TRPCError } from "@trpc/server";

export const customersRouter = createTRPCRouter({
  get: protectedProcedure
    .input(getCustomersSchema.optional())
    .query(async ({ ctx: { teamId, db }, input }) => {
      return getCustomers(db, {
        teamId: teamId!,
        ...input,
      });
    }),

  getById: protectedProcedure
    .input(getCustomerByIdSchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      return getCustomerById(db, {
        id: input.id,
        teamId: teamId!,
      });
    }),

  delete: protectedProcedure
    .input(deleteCustomerSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      return deleteCustomer(db, {
        id: input.id,
        teamId: teamId!,
      });
    }),

  upsert: protectedProcedure
    .input(upsertCustomerSchema)
    .mutation(async ({ ctx: { db, teamId, session }, input }) => {
      const isNewCustomer = !input.id;

      const customer = await upsertCustomer(db, {
        ...input,
        teamId: teamId!,
        userId: session.user.id,
      });

      // Auto-trigger enrichment for new customers with a website
      if (isNewCustomer && customer?.website && customer?.id) {
        try {
          await triggerJob(
            "enrich-customer",
            {
              customerId: customer.id,
              teamId: teamId!,
            },
            "customers",
          );
        } catch (error) {
          // Log but don't fail the customer creation
          console.error("Failed to trigger customer enrichment:", error);
        }
      }

      return customer;
    }),

  getInvoiceSummary: protectedProcedure
    .input(getCustomerInvoiceSummarySchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      return getCustomerInvoiceSummary(db, {
        customerId: input.id,
        teamId: teamId!,
      });
    }),

  enrich: protectedProcedure
    .input(enrichCustomerSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      const customer = await getCustomerById(db, {
        id: input.id,
        teamId: teamId!,
      });

      if (!customer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Customer not found",
        });
      }

      if (!customer.website) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Customer has no website - enrichment requires a website",
        });
      }

      // Mark as pending and trigger enrichment
      await updateCustomerEnrichmentStatus(db, {
        customerId: customer.id,
        status: "pending",
      });

      await triggerJob(
        "enrich-customer",
        {
          customerId: customer.id,
          teamId: teamId!,
        },
        "customers",
      );

      return { queued: true };
    }),

  cancelEnrichment: protectedProcedure
    .input(enrichCustomerSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      const customer = await getCustomerById(db, {
        id: input.id,
        teamId: teamId!,
      });

      if (!customer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Customer not found",
        });
      }

      // Reset status to null (no enrichment in progress)
      // The job may still complete in background but UI won't show as processing
      await updateCustomerEnrichmentStatus(db, {
        customerId: customer.id,
        status: null,
      });

      return { cancelled: true };
    }),
});
