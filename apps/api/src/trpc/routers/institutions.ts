import {
  getAccountsSchema,
  getInstitutionsSchema,
  updateUsageSchema,
} from "@api/schemas/institutions";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { Provider } from "@midday/banking";
import {
  getInstitutionById,
  getInstitutions,
  incrementInstitutionPopularity,
} from "@midday/db/queries";
import { TRPCError } from "@trpc/server";

export const institutionsRouter = createTRPCRouter({
  get: protectedProcedure
    .input(getInstitutionsSchema)
    .query(async ({ ctx: { db }, input }) => {
      const institutions = await getInstitutions(db, {
        countryCode: input.countryCode,
        query: input.q,
        limit: 50,
      });

      return institutions.map((institution) => ({
        id: institution.id,
        name: institution.name,
        logo: institution.logoUrl,
        availableHistory: institution.availableHistory,
        maximumConsentValidity: institution.maximumConsentValidity,
        type: institution.type,
        provider: institution.provider,
      }));
    }),

  getById: protectedProcedure
    .input(updateUsageSchema)
    .query(async ({ ctx: { db }, input }) => {
      const institution = await getInstitutionById(db, input.id);

      if (!institution) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Institution not found",
        });
      }

      return {
        id: institution.id,
        name: institution.name,
        logo: institution.logoUrl,
        availableHistory: institution.availableHistory,
        maximumConsentValidity: institution.maximumConsentValidity,
        type: institution.type,
        provider: institution.provider,
      };
    }),

  accounts: protectedProcedure
    .input(getAccountsSchema)
    .query(async ({ input }) => {
      try {
        const provider = new Provider({ provider: input.provider });
        const accounts = await provider.getAccounts({
          id: input.id,
          accessToken: input.accessToken,
          institutionId: input.institutionId,
        });

        return accounts.sort((a, b) => b.balance.amount - a.balance.amount);
      } catch (error) {
        console.log(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get accounts",
        });
      }
    }),

  updateUsage: protectedProcedure
    .input(updateUsageSchema)
    .mutation(async ({ ctx: { db }, input }) => {
      const result = await incrementInstitutionPopularity(db, input.id);

      if (!result) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Institution not found",
        });
      }

      return { success: true };
    }),
});
