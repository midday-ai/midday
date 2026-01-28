import {
  deleteConnectionSchema,
  getAccountBalanceSchema,
  getAccountsSchema,
  getConnectionByReferenceSchema,
  getConnectionStatusSchema,
  getTransactionsSchema,
} from "@api/schemas/banking";
import { createTRPCRouter, serviceProcedure } from "@api/trpc/init";
import { GoCardLessApi, Provider } from "@midday/banking";
import { TRPCError } from "@trpc/server";

export const bankingServiceRouter = createTRPCRouter({
  getAccounts: serviceProcedure
    .input(getAccountsSchema)
    .query(async ({ input }) => {
      try {
        const provider = new Provider({ provider: input.provider });
        return provider.getAccounts({
          id: input.id,
          accessToken: input.accessToken,
          institutionId: input.institutionId,
        });
      } catch (error) {
        console.error("Failed to get accounts:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get accounts",
        });
      }
    }),

  getAccountBalance: serviceProcedure
    .input(getAccountBalanceSchema)
    .query(async ({ input }) => {
      try {
        const provider = new Provider({ provider: input.provider });
        return provider.getAccountBalance({
          accountId: input.accountId,
          accessToken: input.accessToken,
          accountType: input.accountType,
        });
      } catch (error) {
        console.error("Failed to get account balance:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get account balance",
        });
      }
    }),

  getConnectionStatus: serviceProcedure
    .input(getConnectionStatusSchema)
    .query(async ({ input }) => {
      try {
        const provider = new Provider({ provider: input.provider });
        return provider.getConnectionStatus({
          id: input.id,
          accessToken: input.accessToken,
        });
      } catch (error) {
        console.error("Failed to get connection status:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get connection status",
        });
      }
    }),

  getConnectionByReference: serviceProcedure
    .input(getConnectionByReferenceSchema)
    .query(async ({ input }) => {
      try {
        const api = new GoCardLessApi();
        const requisition = await api.getRequiestionByReference(
          input.reference,
        );

        if (!requisition) {
          return null;
        }

        return {
          id: requisition.id,
          status: requisition.status,
          accounts: requisition.accounts,
        };
      } catch (error) {
        console.error("Failed to get connection by reference:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get connection by reference",
        });
      }
    }),

  deleteConnection: serviceProcedure
    .input(deleteConnectionSchema)
    .mutation(async ({ input }) => {
      try {
        const provider = new Provider({ provider: input.provider });
        return provider.deleteConnection({
          id: input.id,
          accessToken: input.accessToken,
        });
      } catch (error) {
        console.error("Failed to delete connection:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete connection",
        });
      }
    }),

  getTransactions: serviceProcedure
    .input(getTransactionsSchema)
    .query(async ({ input }) => {
      try {
        const provider = new Provider({ provider: input.provider });
        return provider.getTransactions({
          accountId: input.accountId,
          accessToken: input.accessToken,
          latest: input.latest,
          accountType: input.accountType,
        });
      } catch (error) {
        console.error("Failed to get transactions:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get transactions",
        });
      }
    }),
});
