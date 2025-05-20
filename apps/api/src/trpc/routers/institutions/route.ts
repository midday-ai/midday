import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { client } from "@midday/engine-client";
import {
  getAccountsSchema,
  getInstitutionsSchema,
  updateUsageSchema,
} from "./schema";

export const institutionsRouter = createTRPCRouter({
  get: protectedProcedure
    .input(getInstitutionsSchema)
    .query(async ({ input }) => {
      const institutionsResponse = await client.institutions.$get({
        query: input,
      });

      if (!institutionsResponse.ok) {
        throw new Error("Failed to get institutions");
      }

      const { data } = await institutionsResponse.json();

      return data.map((institution) => ({
        ...institution,
        availableHistory: institution.available_history,
        maximumConsentValidity: institution.maximum_consent_validity,
        type: institution.type,
        provider: institution.provider!,
      }));
    }),

  accounts: protectedProcedure
    .input(getAccountsSchema)
    .query(async ({ input }) => {
      const accountsResponse = await client.accounts.$get({
        query: input,
      });

      if (!accountsResponse.ok) {
        throw new Error("Failed to get accounts");
      }

      const { data } = await accountsResponse.json();

      return data.sort((a, b) => b.balance.amount - a.balance.amount);
    }),

  updateUsage: protectedProcedure
    .input(updateUsageSchema)
    .mutation(async ({ input }) => {
      const usageResponse = await client.institutions[":id"].usage.$put({
        param: input,
      });

      if (!usageResponse.ok) {
        throw new Error("Failed to update institution usage");
      }

      return usageResponse.json();
    }),
});
