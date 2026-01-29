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
  deleteAccounts,
  deleteConnection,
  enableBankingOperations,
  getAccountBalance,
  getAccounts,
  getConnectionStatus,
  getTransactions,
  goCardlessOperations,
  healthCheck,
  plaidOperations,
} from "@api/services/banking";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@api/trpc/init";

export const bankingRouter = createTRPCRouter({
  // Plaid operations
  createPlaidLink: protectedProcedure
    .input(createPlaidLinkSchema)
    .mutation(async ({ ctx, input }) => {
      return plaidOperations.createLink({
        userId: input.userId ?? ctx.session.user.id,
        language: input.language,
        accessToken: input.accessToken,
        environment: input.environment,
      });
    }),

  exchangePlaidToken: protectedProcedure
    .input(exchangePlaidTokenSchema)
    .mutation(async ({ input }) => {
      return plaidOperations.exchangeToken(input.publicToken);
    }),

  // GoCardless operations
  createGoCardlessAgreement: protectedProcedure
    .input(createGoCardlessAgreementSchema)
    .mutation(async ({ input }) => {
      return goCardlessOperations.createAgreement({
        institutionId: input.institutionId,
        transactionTotalDays: input.transactionTotalDays,
      });
    }),

  createGoCardlessLink: protectedProcedure
    .input(createGoCardlessLinkSchema)
    .mutation(async ({ input }) => {
      return goCardlessOperations.createLink({
        institutionId: input.institutionId,
        agreement: input.agreement,
        redirect: input.redirect,
        reference: input.reference,
      });
    }),

  // EnableBanking operations
  createEnableBankingLink: protectedProcedure
    .input(createEnableBankingLinkSchema)
    .mutation(async ({ input }) => {
      return enableBankingOperations.createLink({
        country: input.country,
        institutionId: input.institutionId,
        teamId: input.teamId,
        validUntil: input.validUntil,
        state: input.state,
        type: input.type,
      });
    }),

  exchangeEnableBankingCode: protectedProcedure
    .input(exchangeEnableBankingCodeSchema)
    .query(async ({ input }) => {
      return enableBankingOperations.exchangeCode(input.code);
    }),

  // Shared provider operations
  getAccounts: protectedProcedure
    .input(getAccountsSchema)
    .query(async ({ input }) => {
      return getAccounts(input);
    }),

  getAccountBalance: protectedProcedure
    .input(getAccountBalanceSchema)
    .query(async ({ input }) => {
      return getAccountBalance(input);
    }),

  deleteAccounts: protectedProcedure
    .input(deleteAccountsSchema)
    .mutation(async ({ input }) => {
      return deleteAccounts(input);
    }),

  getConnectionStatus: protectedProcedure
    .input(getConnectionStatusSchema)
    .query(async ({ input }) => {
      return getConnectionStatus(input);
    }),

  deleteConnection: protectedProcedure
    .input(deleteConnectionSchema)
    .mutation(async ({ input }) => {
      return deleteConnection(input);
    }),

  getTransactions: protectedProcedure
    .input(getTransactionsSchema)
    .query(async ({ input }) => {
      return getTransactions(input);
    }),

  healthCheck: publicProcedure.query(async () => {
    return healthCheck();
  }),
});
