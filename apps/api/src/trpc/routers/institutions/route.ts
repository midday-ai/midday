import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { engineClient } from "@api/utils/engine-client";
import {
  getAccountsSchema,
  getInstitutionsSchema,
  updateUsageSchema,
} from "./schema";

export const institutionsRouter = createTRPCRouter({
  get: protectedProcedure
    .input(getInstitutionsSchema)
    .query(async ({ input }) => {
      const institutionsResponse = await engineClient.institutions.$get({
        query: input,
      });

      if (!institutionsResponse.ok) {
        throw new Error("Failed to get institutions");
      }

      const { data } = await institutionsResponse.json();

      return data;
    }),

  accounts: protectedProcedure
    .input(getAccountsSchema)
    .query(async ({ input }) => {
      const accountsResponse = await engineClient.accounts.$get({
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
      const usageResponse = await engineClient.institutions[":id"].usage.$put({
        param: input,
      });

      if (!usageResponse.ok) {
        throw new Error("Failed to update institution usage");
      }

      return usageResponse.json();
    }),
});
