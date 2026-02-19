import {
  connectionByReferenceSchema,
  connectionStatusSchema,
  deleteConnectionSchema,
  enablebankingExchangeSchema,
  enablebankingLinkSchema,
  getBalanceSchema,
  getProviderAccountsSchema,
  getProviderTransactionsSchema,
  gocardlessAgreementSchema,
  gocardlessLinkSchema,
  plaidExchangeSchema,
  plaidLinkSchema,
} from "@api/schemas/banking";
import {
  createTRPCRouter,
  internalProcedure,
  protectedOrInternalProcedure,
  protectedProcedure,
} from "@api/trpc/init";
import {
  EnableBankingApi,
  GoCardLessApi,
  getProviderErrorDetails,
  getRates,
  PlaidApi,
  Provider,
} from "@midday/banking";
import { getInstitutionById } from "@midday/db/queries";
import { createLoggerWithContext } from "@midday/logger";
import { TRPCError } from "@trpc/server";

const logger = createLoggerWithContext("trpc:banking");

export const bankingRouter = createTRPCRouter({
  plaidLink: protectedProcedure
    .input(plaidLinkSchema)
    .mutation(async ({ input, ctx }) => {
      const api = new PlaidApi();

      try {
        const { data } = await api.linkTokenCreate({
          userId: ctx.session.user.id,
          language: input?.language,
          accessToken: input?.accessToken,
        });

        return {
          data,
        };
      } catch (error) {
        logger.error(
          "Failed to create Plaid link token",
          getProviderErrorDetails(error),
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create Plaid link token",
        });
      }
    }),

  plaidExchange: protectedProcedure
    .input(plaidExchangeSchema)
    .mutation(async ({ input }) => {
      const api = new PlaidApi();

      try {
        const { data } = await api.itemPublicTokenExchange({
          publicToken: input.token,
        });

        return {
          data,
        };
      } catch (error) {
        logger.error(
          "Failed to exchange Plaid token",
          getProviderErrorDetails(error),
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to exchange Plaid token",
        });
      }
    }),

  gocardlessLink: protectedProcedure
    .input(gocardlessLinkSchema)
    .mutation(async ({ input }) => {
      const api = new GoCardLessApi();

      try {
        const data = await api.buildLink(input);
        return { data };
      } catch (error) {
        logger.error(
          "Failed to create GoCardless link",
          getProviderErrorDetails(error),
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create GoCardless link",
        });
      }
    }),

  gocardlessAgreement: protectedProcedure
    .input(gocardlessAgreementSchema)
    .mutation(async ({ input }) => {
      const api = new GoCardLessApi();

      try {
        const data = await api.createEndUserAgreement(input);
        return { data };
      } catch (error) {
        logger.error(
          "Failed to create GoCardless agreement",
          getProviderErrorDetails(error),
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create GoCardless agreement",
        });
      }
    }),

  enablebankingLink: protectedProcedure
    .input(enablebankingLinkSchema)
    .mutation(async ({ input, ctx: { teamId, db } }) => {
      const institution = await getInstitutionById(db, {
        id: input.institutionId,
      });

      if (!institution) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Institution not found",
        });
      }

      const country =
        input.countryCode && institution.countries?.includes(input.countryCode)
          ? input.countryCode
          : institution.countries?.[0];

      if (!country) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Institution has no country",
        });
      }

      const validUntil = new Date(
        Date.now() + (institution.maximumConsentValidity ?? 90 * 86400) * 1000,
      )
        .toISOString()
        .replace(/\.\d+Z$/, ".000000+00:00");

      const api = new EnableBankingApi();

      try {
        const data = await api.authenticate({
          institutionName: institution.name,
          country,
          type: (institution.type as "personal" | "business") ?? "business",
          teamId: teamId!,
          validUntil,
          state: input.state,
        });
        return { data: { url: data.url } };
      } catch (error) {
        logger.error("Failed to create EnableBanking link", {
          ...getProviderErrorDetails(error),
          institutionId: input.institutionId,
          institutionName: institution.name,
          country,
          type: institution.type,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create EnableBanking link",
        });
      }
    }),

  enablebankingExchange: protectedProcedure
    .input(enablebankingExchangeSchema)
    .mutation(async ({ input }) => {
      const api = new EnableBankingApi();

      try {
        const data = await api.exchangeCode(input.code);
        return {
          data: {
            session_id: data.session_id,
            expires_at: data.expires_at,
            accounts: data.accounts,
          },
        };
      } catch (error) {
        logger.error(
          "Failed to exchange EnableBanking code",
          getProviderErrorDetails(error),
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to exchange EnableBanking code",
        });
      }
    }),

  connectionStatus: internalProcedure
    .input(connectionStatusSchema)
    .query(async ({ input }) => {
      const api = new Provider({ provider: input.provider });

      try {
        const data = await api.getConnectionStatus({
          id: input.id,
          accessToken: input.accessToken,
        });
        return { data };
      } catch (error) {
        logger.error(
          "Failed to get connection status",
          getProviderErrorDetails(error),
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get connection status",
        });
      }
    }),

  deleteConnection: internalProcedure
    .input(deleteConnectionSchema)
    .mutation(async ({ input }) => {
      const api = new Provider({ provider: input.provider });

      try {
        await api.deleteConnection({
          id: input.id,
          accessToken: input.accessToken,
        });
        return { data: { success: true } };
      } catch (error) {
        logger.error(
          "Failed to delete connection",
          getProviderErrorDetails(error),
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete connection",
        });
      }
    }),

  connectionByReference: internalProcedure
    .input(connectionByReferenceSchema)
    .query(async ({ input }) => {
      const api = new GoCardLessApi();

      try {
        const data = await api.getRequisitionByReference(input.reference);
        if (!data) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Connection not found",
          });
        }
        return { data: { id: data.id, accounts: data.accounts } };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        logger.error(
          "Failed to get connection by reference",
          getProviderErrorDetails(error),
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get connection by reference",
        });
      }
    }),

  getProviderAccounts: protectedOrInternalProcedure
    .input(getProviderAccountsSchema)
    .query(async ({ input }) => {
      const api = new Provider({ provider: input.provider });

      try {
        const data = await api.getAccounts({
          id: input.id,
          accessToken: input.accessToken,
          institutionId: input.institutionId,
        });

        // Sort accounts by balance descending (highest first) for display
        const sorted = [...data].sort(
          (a, b) => b.balance.amount - a.balance.amount,
        );

        return { data: sorted };
      } catch (error) {
        logger.error(
          "Failed to get provider accounts",
          getProviderErrorDetails(error),
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get provider accounts",
        });
      }
    }),

  getBalance: internalProcedure
    .input(getBalanceSchema)
    .query(async ({ input }) => {
      const api = new Provider({ provider: input.provider });

      try {
        const data = await api.getAccountBalance({
          accessToken: input.accessToken,
          accountId: input.id,
          accountType: input.accountType,
        });
        return { data };
      } catch (error) {
        logger.error(
          "Failed to get account balance",
          getProviderErrorDetails(error),
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get account balance",
        });
      }
    }),

  getProviderTransactions: internalProcedure
    .input(getProviderTransactionsSchema)
    .query(async ({ input }) => {
      const api = new Provider({ provider: input.provider });

      try {
        const data = await api.getTransactions({
          accountId: input.accountId,
          accountType: input.accountType,
          latest: input.latest,
          accessToken: input.accessToken,
        });
        return { data };
      } catch (error) {
        logger.error(
          "Failed to get provider transactions",
          getProviderErrorDetails(error),
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get provider transactions",
        });
      }
    }),

  rates: internalProcedure.query(async () => {
    try {
      const data = await getRates();
      return { data };
    } catch (error) {
      logger.error(
        "Failed to get exchange rates",
        getProviderErrorDetails(error),
      );
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get exchange rates",
      });
    }
  }),
});
