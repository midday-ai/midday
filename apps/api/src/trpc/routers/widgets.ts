import {
  getCashFlowSchema,
  getGrowthRateSchema,
  getInboxStatsSchema,
  getOutstandingInvoicesSchema,
  getProfitMarginSchema,
  getRevenueSummarySchema,
  getRunwaySchema,
  updateWidgetPreferencesSchema,
} from "@api/schemas/widgets";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { widgetPreferencesCache } from "@midday/cache/widget-preferences-cache";
import {
  getCashFlow,
  getGrowthRate,
  getInboxStats,
  getOutstandingInvoices,
  getProfitMargin,
  getRevenue,
  getRunway,
  getTopRevenueClient,
} from "@midday/db/queries";

export const widgetsRouter = createTRPCRouter({
  getRunway: protectedProcedure
    .input(getRunwaySchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      const runway = await getRunway(db, {
        teamId: teamId!,
        from: input.from,
        to: input.to,
        currency: input.currency,
      });

      return {
        result: runway,
        toolCall: {
          toolName: "getBurnRateAnalysis",
          toolParams: {
            from: input.from,
            to: input.to,
            currency: input.currency,
          },
        },
      };
    }),

  getTopCustomer: protectedProcedure.query(async ({ ctx: { db, teamId } }) => {
    const topCustomer = await getTopRevenueClient(db, {
      teamId: teamId!,
    });

    return {
      result: topCustomer,
      // toolCall: {
      //   toolName: "getCustomers",
      // },
    };
  }),

  getRevenueSummary: protectedProcedure
    .input(getRevenueSummarySchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      const revenue = await getRevenue(db, {
        teamId: teamId!,
        from: input.from,
        to: input.to,
        currency: input.currency,
        revenueType: input.revenueType,
      });

      // Calculate total revenue for the period
      const totalRevenue = revenue.reduce(
        (sum, item) => sum + Number.parseFloat(item.value),
        0,
      );

      return {
        result: {
          totalRevenue,
          currency: revenue[0]?.currency ?? input.currency ?? "USD",
          revenueType: input.revenueType,
          monthCount: revenue.length,
        },
        // toolCall: {
        //   toolName: "getRevenueAnalysis",
        //   toolParams: {
        //     from: input.from,
        //     to: input.to,
        //     currency: input.currency,
        //     revenueType: input.revenueType,
        //   },
        // },
      };
    }),

  getGrowthRate: protectedProcedure
    .input(getGrowthRateSchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      const growthData = await getGrowthRate(db, {
        teamId: teamId!,
        from: input.from,
        to: input.to,
        currency: input.currency,
        type: input.type,
        revenueType: input.revenueType,
        period: input.period,
      });

      return {
        result: {
          currentTotal: growthData.summary.currentTotal,
          prevTotal: growthData.summary.previousTotal,
          growthRate: growthData.summary.growthRate,
          quarterlyGrowthRate: growthData.summary.periodGrowthRate,
          currency: growthData.summary.currency,
          type: growthData.summary.type,
          revenueType: growthData.summary.revenueType,
          period: growthData.summary.period,
          trend: growthData.summary.trend,
          meta: growthData.meta,
        },
        // toolCall: {
        //   toolName: "getGrowthRateAnalysis",
        //   toolParams: {
        //     from: input.from,
        //     to: input.to,
        //     currency: input.currency,
        //     type: input.type,
        //     revenueType: input.revenueType,
        //     period: input.period,
        //   },
        // },
      };
    }),

  getProfitMargin: protectedProcedure
    .input(getProfitMarginSchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      const profitMarginData = await getProfitMargin(db, {
        teamId: teamId!,
        from: input.from,
        to: input.to,
        currency: input.currency,
        revenueType: input.revenueType,
      });

      return {
        result: {
          totalRevenue: profitMarginData.summary.totalRevenue,
          totalProfit: profitMarginData.summary.totalProfit,
          profitMargin: profitMarginData.summary.profitMargin,
          averageMargin: profitMarginData.summary.averageMargin,
          currency: profitMarginData.summary.currency,
          revenueType: profitMarginData.summary.revenueType,
          trend: profitMarginData.summary.trend,
          monthCount: profitMarginData.summary.monthCount,
          monthlyData: profitMarginData.result,
          meta: profitMarginData.meta,
        },
        // toolCall: {
        //   toolName: "getProfitMarginAnalysis",
        //   toolParams: {
        //     from: input.from,
        //     to: input.to,
        //     currency: input.currency,
        //     revenueType: input.revenueType,
        //   },
        // },
      };
    }),

  getCashFlow: protectedProcedure
    .input(getCashFlowSchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      const cashFlowData = await getCashFlow(db, {
        teamId: teamId!,
        from: input.from,
        to: input.to,
        currency: input.currency,
        period: input.period,
      });

      return {
        result: {
          netCashFlow: cashFlowData.summary.netCashFlow,
          currency: cashFlowData.summary.currency,
          period: cashFlowData.summary.period,
          meta: cashFlowData.meta,
        },
      };
    }),

  getOutstandingInvoices: protectedProcedure
    .input(getOutstandingInvoicesSchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      const invoicesData = await getOutstandingInvoices(db, {
        teamId: teamId!,
        currency: input.currency,
        status: input.status,
      });

      return {
        result: {
          count: invoicesData.summary.count,
          totalAmount: invoicesData.summary.totalAmount,
          currency: invoicesData.summary.currency,
          status: invoicesData.summary.status,
          meta: invoicesData.meta,
        },
      };
    }),

  getInboxStats: protectedProcedure
    .input(getInboxStatsSchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      const inboxStats = await getInboxStats(db, {
        teamId: teamId!,
        from: input.from,
        to: input.to,
        currency: input.currency,
      });

      return {
        result: inboxStats.result,
        // toolCall: {
        //   toolName: "getInboxAnalysis",
        //   toolParams: {
        //     from: input.from,
        //     to: input.to,
        //     currency: input.currency,
        //   },
        // },
      };
    }),

  getWidgetPreferences: protectedProcedure.query(
    async ({ ctx: { teamId, session } }) => {
      const preferences = await widgetPreferencesCache.getWidgetPreferences(
        teamId!,
        session.user.id,
      );
      return preferences;
    },
  ),

  updateWidgetPreferences: protectedProcedure
    .input(updateWidgetPreferencesSchema)
    .mutation(async ({ ctx: { teamId, session }, input }) => {
      const preferences = await widgetPreferencesCache.updatePrimaryWidgets(
        teamId!,
        session.user.id,
        input.primaryWidgets,
      );
      return preferences;
    }),
});
