import {
  deleteCustomer,
  getCustomerById,
  getCustomers,
  upsertCustomer,
} from "@api/db/queries/customers";
import {
  deleteCustomerSchema,
  getCustomerByIdSchema,
  getCustomersSchema,
  upsertCustomerSchema,
} from "@api/schemas/customers";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { generateToken } from "@midday/invoice/token";

export const customersRouter = createTRPCRouter({
  get: protectedProcedure
    .input(getCustomersSchema.snake)
    .query(async ({ ctx: { teamId, db }, input }) => {
      return getCustomers(db, {
        teamId: teamId!,
        ...input,
      });
    }),

  getById: protectedProcedure
    .input(getCustomerByIdSchema)
    .query(async ({ ctx: { db }, input }) => {
      return getCustomerById(db, input.id);
    }),

  delete: protectedProcedure
    .input(deleteCustomerSchema)
    .mutation(async ({ ctx: { db }, input }) => {
      return deleteCustomer(db, input.id);
    }),

  upsert: protectedProcedure
    .input(upsertCustomerSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      const token = input.id ? await generateToken(input.id) : undefined;

      return upsertCustomer(db, {
        ...input,
        token,
        teamId: teamId!,
      });
    }),
});
