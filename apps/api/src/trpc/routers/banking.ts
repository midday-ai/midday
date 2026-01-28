import {
  createEnableBankingLinkSchema,
  createGoCardlessAgreementSchema,
  createGoCardlessLinkSchema,
  createPlaidLinkSchema,
  deleteAccountsSchema,
  deleteConnectionSchema,
  exchangeEnableBankingCodeSchema,
  exchangePlaidTokenSchema,
  getAccountBalanceSchema,
  getAccountsSchema,
  getConnectionStatusSchema,
  getTransactionsSchema,
} from "@api/schemas/banking";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@api/trpc/init";
import {
  EnableBankingApi,
  GoCardLessApi,
  PlaidApi,
  Provider,
} from "@midday/banking";
import { TRPCError } from "@trpc/server";

export const bankingRouter = createTRPCRouter({
  createPlaidLink: protectedProcedure
    .input(createPlaidLinkSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const api = new PlaidApi();
        const response = await api.linkTokenCreate({
          userId: input.userId ?? ctx.session.user.id,
          language: input.language,
          accessToken: input.accessToken,
          environment: input.environment,
        });

        return {
          link_token: response.data.link_token,
          expiration: response.data.expiration,
        };
      } catch (error) {
        console.error("Failed to create Plaid link:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create Plaid link token",
        });
      }
    }),

  exchangePlaidToken: protectedProcedure
    .input(exchangePlaidTokenSchema)
    .mutation(async ({ input }) => {
      try {
        const api = new PlaidApi();
        const response = await api.itemPublicTokenExchange({
          publicToken: input.publicToken,
        });

        return {
          access_token: response.data.access_token,
          item_id: response.data.item_id,
        };
      } catch (error) {
        console.error("Failed to exchange Plaid token:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to exchange Plaid public token",
        });
      }
    }),

  createGoCardlessAgreement: protectedProcedure
    .input(createGoCardlessAgreementSchema)
    .mutation(async ({ input }) => {
      try {
        const api = new GoCardLessApi();
        return api.createEndUserAgreement({
          institutionId: input.institutionId,
          transactionTotalDays: input.transactionTotalDays,
        });
      } catch (error) {
        console.error("Failed to create GoCardless agreement:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create GoCardless agreement",
        });
      }
    }),

  createGoCardlessLink: protectedProcedure
    .input(createGoCardlessLinkSchema)
    .mutation(async ({ input }) => {
      try {
        const api = new GoCardLessApi();
        return api.buildLink({
          institutionId: input.institutionId,
          agreement: input.agreement,
          redirect: input.redirect,
          reference: input.reference,
        });
      } catch (error) {
        console.error("Failed to create GoCardless link:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create GoCardless link",
        });
      }
    }),

  createEnableBankingLink: protectedProcedure
    .input(createEnableBankingLinkSchema)
    .mutation(async ({ input }) => {
      try {
        const api = new EnableBankingApi();
        return api.authenticate({
          country: input.country,
          institutionId: input.institutionId,
          teamId: input.teamId,
          validUntil: input.validUntil,
          state: input.state,
          type: input.type,
        });
      } catch (error) {
        console.error("Failed to create EnableBanking link:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create EnableBanking link",
        });
      }
    }),

  exchangeEnableBankingCode: protectedProcedure
    .input(exchangeEnableBankingCodeSchema)
    .query(async ({ input }) => {
      try {
        const api = new EnableBankingApi();
        return api.exchangeCode(input.code);
      } catch (error) {
        console.error("Failed to exchange EnableBanking code:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to exchange EnableBanking code",
        });
      }
    }),

  getAccounts: protectedProcedure
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

  getAccountBalance: protectedProcedure
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

  deleteAccounts: protectedProcedure
    .input(deleteAccountsSchema)
    .mutation(async ({ input }) => {
      try {
        const provider = new Provider({ provider: input.provider });
        return provider.deleteAccounts({
          accountId: input.accountId,
          accessToken: input.accessToken,
        });
      } catch (error) {
        console.error("Failed to delete accounts:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete accounts",
        });
      }
    }),

  getConnectionStatus: protectedProcedure
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

  deleteConnection: protectedProcedure
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

  getTransactions: protectedProcedure
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

  healthCheck: publicProcedure.query(async () => {
    try {
      const provider = new Provider();
      return provider.getHealthCheck();
    } catch (error) {
      console.error("Health check failed:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Health check failed",
      });
    }
  }),
});
