import {
  deleteCustomerSchema,
  getCustomerByIdSchema,
  getCustomersSchema,
  upsertCustomerSchema,
} from "@api/schemas/customers";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import {
  deleteCustomer,
  getCustomerById,
  getCustomers,
  upsertCustomer,
} from "@midday/db/queries";

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
    .mutation(async ({ ctx: { db, teamId, session, events }, input }) => {
      const result = await upsertCustomer(db, {
        ...input,
        teamId: teamId!,
      });

      // Emit event for new customers only
      if (result.isNewCustomer) {
        events.emitEvent("customer.created", {
          teamId: teamId!,
          userId: session.user.id,
          customer: {
            id: result.id,
            name: result.name,
            email: result.email,
            website: result.website,
            country: result.country,
            city: result.city,
          },
        });
      }

      return result;
    }),
});
