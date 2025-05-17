import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import {
  getBurnRateSchema,
  getExpensesSchema,
  getProfitSchema,
  getRevenueSchema,
  getRunwaySchema,
  getSpendingSchema,
} from "./schema";

export const metricsRouter = createTRPCRouter({
  revenue: protectedProcedure
    .input(getRevenueSchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      //   const data = await getMetricsQuery(db, {
      //     teamId: teamId!,
      //     from: input.from,
      //     to: input.to,
      //     currency: input.currency,
      //     type: "revenue",
      //   });
      //   return data;
    }),

  profit: protectedProcedure
    .input(getProfitSchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      //   const data = await getMetricsQuery(db, {
      //     teamId: teamId!,
      //     from: input.from,
      //     to: input.to,
      //     currency: input.currency,
      //     type: "profit",
      //   });
      //   return data;
    }),

  burnRate: protectedProcedure
    .input(getBurnRateSchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      //   const { data } = await getBurnRateQuery(db, {
      //     teamId: teamId!,
      //     from: input.from,
      //     to: input.to,
      //     currency: input.currency,
      //   });
      //   return data;
    }),

  runway: protectedProcedure
    .input(getRunwaySchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      //   const { data } = await getRunwayQuery(db, {
      //     teamId: teamId!,
      //     from: input.from,
      //     to: input.to,
      //     currency: input.currency,
      //   });
      //   return data;
    }),

  expense: protectedProcedure
    .input(getExpensesSchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      //   const data = await getExpensesQuery(db, {
      //     teamId: teamId!,
      //     from: input.from,
      //     to: input.to,
      //     currency: input.currency,
      //   });
      //   return data;
    }),

  spending: protectedProcedure
    .input(getSpendingSchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      //   const { data } = await getSpendingQuery(db, {
      //     teamId: teamId!,
      //     ...input,
      //   });
      //   return data;
    }),
});
