import {
  getAccountBalancesSchema,
  getActiveDealsSchema,
  getCashFlowSchema,
  getCategoryExpensesSchema,
  getCollectionRateSchema,
  getMerchantLifetimeValueSchema,
  getDealPipelineSchema,
  getGrowthRateSchema,
  getInboxStatsSchema,
  getMonthlySpendingSchema,
  getNetPositionSchema,
  getNsfAlertsSchema,
  getOutstandingDealsSchema,
  getOverdueDealsAlertSchema,
  getPortfolioOverviewSchema,
  getProfitMarginSchema,
  getRecurringExpensesSchema,
  getRevenueSummarySchema,
  getRunwaySchema,
  getVaultActivitySchema,
  updateWidgetPreferencesSchema,
} from "@api/schemas/widgets";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { widgetPreferencesCache } from "@midday/cache/widget-preferences-cache";
import {
  getCashBalance,
  getCashFlow,
  getMerchantLifetimeValue,
  getGrowthRate,
  getInboxStats,
  getMcaDealStats,
  getMcaDealStatusBreakdown,
  getMcaPaymentStats,
  getNetPosition,
  getOutstandingDeals,
  getOverdueDealsAlert,
  getProfitMargin,
  getRecentDocuments,
  getRecurringExpenses,
  getReports,
  getRunway,
  getSpending,
  getSpendingForPeriod,
  getTopRevenueMerchant,
} from "@midday/db/queries";

export const widgetsRouter = createTRPCRouter({
  // ========================================================================
  // MCA Portfolio Widgets
  // ========================================================================

  getPortfolioOverview: protectedProcedure
    .input(getPortfolioOverviewSchema)
    .query(async ({ ctx: { db, teamId } }) => {
      const stats = await getMcaDealStats(db, { teamId: teamId! });

      return {
        result: {
          totalFunded: stats?.totalFunded ?? 0,
          totalDeals: stats?.totalDeals ?? 0,
          totalOutstanding: stats?.totalOutstanding ?? 0,
          totalPayback: stats?.totalPayback ?? 0,
        },
      };
    }),

  getActiveDeals: protectedProcedure
    .input(getActiveDealsSchema)
    .query(async ({ ctx: { db, teamId } }) => {
      const stats = await getMcaDealStats(db, { teamId: teamId! });

      return {
        result: {
          activeDeals: stats?.activeDeals ?? 0,
          totalDeals: stats?.totalDeals ?? 0,
        },
      };
    }),

  getCollectionRate: protectedProcedure
    .input(getCollectionRateSchema)
    .query(async ({ ctx: { db, teamId } }) => {
      const stats = await getMcaDealStats(db, { teamId: teamId! });
      const totalPayback = stats?.totalPayback ?? 0;
      const totalPaid = stats?.totalPaid ?? 0;
      const collectionRate =
        totalPayback > 0
          ? Math.round((totalPaid / totalPayback) * 1000) / 10
          : 0;

      return {
        result: {
          collectionRate,
          totalPaid,
          totalPayback,
        },
      };
    }),

  getNsfAlerts: protectedProcedure
    .input(getNsfAlertsSchema)
    .query(async ({ ctx: { db, teamId } }) => {
      const [dealStats, paymentStats] = await Promise.all([
        getMcaDealStats(db, { teamId: teamId! }),
        getMcaPaymentStats(db, { teamId: teamId! }),
      ]);

      return {
        result: {
          totalNsfCount: dealStats?.totalNsfCount ?? 0,
          returnedPayments: paymentStats?.returnedPayments ?? 0,
          totalNsfFees: paymentStats?.totalNsfFees ?? 0,
        },
      };
    }),

  getDealPipeline: protectedProcedure
    .input(getDealPipelineSchema)
    .query(async ({ ctx: { db, teamId } }) => {
      const breakdown = await getMcaDealStatusBreakdown(db, {
        teamId: teamId!,
      });

      return {
        result: breakdown,
      };
    }),

  // ========================================================================
  // Generic Financial Widgets
  // ========================================================================

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

  getTopMerchant: protectedProcedure.query(async ({ ctx: { db, teamId } }) => {
    const topMerchant = await getTopRevenueMerchant(db, {
      teamId: teamId!,
    });

    return {
      result: topMerchant,
    };
  }),

  getRevenueSummary: protectedProcedure
    .input(getRevenueSummarySchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      const result = await getReports(db, {
        teamId: teamId!,
        from: input.from,
        to: input.to,
        currency: input.currency,
        type: "revenue",
        revenueType: input.revenueType,
      });

      return {
        result: {
          totalRevenue: result.summary.currentTotal,
          currency: result.summary.currency,
          revenueType: input.revenueType,
          monthCount: result.result.length,
        },
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

  getOutstandingDeals: protectedProcedure
    .input(getOutstandingDealsSchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      const dealsData = await getOutstandingDeals(db, {
        teamId: teamId!,
        currency: input.currency,
        status: input.status,
      });

      return {
        result: {
          count: dealsData.summary.count,
          totalAmount: dealsData.summary.totalAmount,
          currency: dealsData.summary.currency,
          status: dealsData.summary.status,
          meta: dealsData.meta,
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
      };
    }),

  getVaultActivity: protectedProcedure
    .input(getVaultActivitySchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      const vaultActivity = await getRecentDocuments(db, {
        teamId: teamId!,
        limit: input.limit,
      });

      return {
        result: vaultActivity,
      };
    }),

  getAccountBalances: protectedProcedure
    .input(getAccountBalancesSchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      const accountBalances = await getCashBalance(db, {
        teamId: teamId!,
        currency: input.currency,
      });

      return {
        result: accountBalances,
      };
    }),

  getNetPosition: protectedProcedure
    .input(getNetPositionSchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      const netPosition = await getNetPosition(db, {
        teamId: teamId!,
        currency: input.currency,
      });

      return {
        result: netPosition,
      };
    }),

  getMonthlySpending: protectedProcedure
    .input(getMonthlySpendingSchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      const spending = await getSpendingForPeriod(db, {
        teamId: teamId!,
        from: input.from,
        to: input.to,
        currency: input.currency,
      });

      return {
        result: spending,
        toolCall: {
          toolName: "getSpendingAnalysis",
          toolParams: {
            from: input.from,
            to: input.to,
            currency: input.currency,
          },
        },
      };
    }),

  getRecurringExpenses: protectedProcedure
    .input(getRecurringExpensesSchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      const recurringExpenses = await getRecurringExpenses(db, {
        teamId: teamId!,
        from: input.from,
        to: input.to,
        currency: input.currency,
      });

      return {
        result: recurringExpenses,
      };
    }),

  getCategoryExpenses: protectedProcedure
    .input(getCategoryExpensesSchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      const categoryExpenses = await getSpending(db, {
        teamId: teamId!,
        from: input.from,
        to: input.to,
        currency: input.currency,
      });

      // Get top N categories by amount
      const topCategories = categoryExpenses
        .sort((a, b) => b.amount - a.amount)
        .slice(0, input.limit || 5);

      const totalAmount = topCategories.reduce(
        (sum, cat) => sum + cat.amount,
        0,
      );

      return {
        result: {
          categories: topCategories,
          totalAmount,
          currency: topCategories[0]?.currency || input.currency || "USD",
          totalCategories: categoryExpenses.length,
        },
      };
    }),

  getOverdueDealsAlert: protectedProcedure
    .input(getOverdueDealsAlertSchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      const overdueData = await getOverdueDealsAlert(db, {
        teamId: teamId!,
        currency: input?.currency,
      });

      return {
        result: overdueData.summary,
      };
    }),

  getMerchantLifetimeValue: protectedProcedure
    .input(getMerchantLifetimeValueSchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      const result = await getMerchantLifetimeValue(db, {
        teamId: teamId!,
        currency: input.currency,
      });

      return {
        result,
        toolCall: {
          toolName: "getMerchantLifetimeValue",
          toolParams: {
            currency: input.currency,
          },
        },
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
