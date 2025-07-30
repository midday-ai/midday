import {
  getBurnRateSchema,
  getExpensesSchema,
  getProfitSchema,
  getRevenueSchema,
  getRunwaySchema,
  getSpendingSchema,
  getTaxSummarySchema,
} from "@api/schemas/metrics";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import {
  getBurnRate,
  getExpenses,
  getMetrics,
  getRunway,
  getSpending,
  getTaxSummary,
} from "@midday/db/queries";

export const metricsRouter = createTRPCRouter({
  revenue: protectedProcedure
    .input(getRevenueSchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      return getMetrics(db, {
        teamId: teamId!,
        from: input.from,
        to: input.to,
        currency: input.currency,
        type: "revenue",
      });
    }),

  profit: protectedProcedure
    .input(getProfitSchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      return getMetrics(db, {
        teamId: teamId!,
        from: input.from,
        to: input.to,
        currency: input.currency,
        type: "profit",
      });
    }),

  burnRate: protectedProcedure
    .input(getBurnRateSchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      return getBurnRate(db, {
        teamId: teamId!,
        from: input.from,
        to: input.to,
        currency: input.currency,
      });
    }),

  runway: protectedProcedure
    .input(getRunwaySchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      return getRunway(db, {
        teamId: teamId!,
        from: input.from,
        to: input.to,
        currency: input.currency,
      });
    }),

  expense: protectedProcedure
    .input(getExpensesSchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      return getExpenses(db, {
        teamId: teamId!,
        from: input.from,
        to: input.to,
        currency: input.currency,
      });
    }),

  spending: protectedProcedure
    .input(getSpendingSchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      return getSpending(db, {
        teamId: teamId!,
        from: input.from,
        to: input.to,
        currency: input.currency,
      });
    }),

  taxSummary: protectedProcedure
    .input(getTaxSummarySchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      return getTaxSummary(db, {
        teamId: teamId!,
        from: input.from,
        to: input.to,
        currency: input.currency,
        type: input.type,
        categorySlug: input.categorySlug,
        taxType: input.taxType,
      });
    }),
});
