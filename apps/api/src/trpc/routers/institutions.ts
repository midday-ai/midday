import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { client } from "@midday/engine/client";
import { z } from "zod";

export const institutionsRouter = createTRPCRouter({
  get: protectedProcedure
    .input(
      z.object({
        q: z.string().optional(),
        countryCode: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const institutionsResponse = await client.institutions.$get({
        query: input,
      });

      if (!institutionsResponse.ok) {
        throw new Error("Failed to get institutions");
      }

      const { data } = await institutionsResponse.json();

      return data;
    }),

  accounts: protectedProcedure
    .input(
      z.object({
        id: z.string().optional(), // EnableBanking & GoCardLess
        accessToken: z.string().optional(),
        institutionId: z.string().optional(), // Plaid
        provider: z.enum(["gocardless", "teller", "plaid", "enablebanking"]),
      }),
    )
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
    .input(z.object({ id: z.string() }))
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
