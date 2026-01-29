import {
  deleteConnectionSchema,
  getAccountBalanceSchema,
  getAccountsSchema,
  getConnectionByReferenceSchema,
  getConnectionStatusSchema,
  getTransactionsSchema,
} from "@api/schemas/banking";
import {
  deleteConnection,
  getAccountBalance,
  getAccounts,
  getConnectionByReference,
  getConnectionStatus,
  getTransactions,
} from "@api/services/banking";
import { createTRPCRouter, serviceProcedure } from "@api/trpc/init";

/**
 * Banking service router for internal service-to-service calls.
 * Used by worker/jobs to interact with banking providers.
 * Authenticates via x-service-secret header.
 */
export const bankingServiceRouter = createTRPCRouter({
  getAccounts: serviceProcedure
    .input(getAccountsSchema)
    .query(async ({ input }) => {
      return getAccounts(input);
    }),

  getAccountBalance: serviceProcedure
    .input(getAccountBalanceSchema)
    .query(async ({ input }) => {
      return getAccountBalance(input);
    }),

  getConnectionStatus: serviceProcedure
    .input(getConnectionStatusSchema)
    .query(async ({ input }) => {
      return getConnectionStatus(input);
    }),

  getConnectionByReference: serviceProcedure
    .input(getConnectionByReferenceSchema)
    .query(async ({ input }) => {
      return getConnectionByReference(input.reference);
    }),

  deleteConnection: serviceProcedure
    .input(deleteConnectionSchema)
    .mutation(async ({ input }) => {
      return deleteConnection(input);
    }),

  getTransactions: serviceProcedure
    .input(getTransactionsSchema)
    .query(async ({ input }) => {
      return getTransactions(input);
    }),
});
