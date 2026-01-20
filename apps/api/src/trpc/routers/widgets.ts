import {
  getAccountBalancesSchema,
  getBillableHoursSchema,
  getCashFlowSchema,
  getCategoryExpensesSchema,
  getCustomerLifetimeValueSchema,
  getGrowthRateSchema,
  getInboxStatsSchema,
  getMonthlySpendingSchema,
  getNetPositionSchema,
  getOutstandingInvoicesSchema,
  getOverdueInvoicesAlertSchema,
  getProfitMarginSchema,
  getRecurringExpensesSchema,
  getRevenueSummarySchema,
  getRunwaySchema,
  getTaxSummarySchema,
  getTrackedTimeSchema,
  getVaultActivitySchema,
  updateWidgetPreferencesSchema,
  // Japan-specific schemas (Midday-JP)
  getTrueCashSchema,
  getConsumptionTaxSummarySchema,
  getProjectROISchema,
} from "@api/schemas/widgets";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { widgetPreferencesCache } from "@midday/cache/widget-preferences-cache";
import {
  getBillableHours,
  getCashBalance,
  getCashFlow,
  getCustomerLifetimeValue,
  getGrowthRate,
  getInboxStats,
  getNetPosition,
  getOutstandingInvoices,
  getOverdueInvoicesAlert,
  getProfitMargin,
  getRecentDocuments,
  getRecurringExpenses,
  getReports,
  getRunway,
  getSpending,
  getSpendingForPeriod,
  getTaxSummary,
  getTopRevenueClient,
  getTrackedTime,
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
      };
    }),

  getTrackedTime: protectedProcedure
    .input(getTrackedTimeSchema)
    .query(async ({ ctx: { db, teamId, session }, input }) => {
      const trackedTime = await getTrackedTime(db, {
        teamId: teamId!,
        assignedId: input.assignedId ?? session.user.id,
        from: input.from,
        to: input.to,
      });

      return {
        result: trackedTime,
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

  getTaxSummary: protectedProcedure
    .input(getTaxSummarySchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      // Get both paid and collected taxes
      const [paidTaxes, collectedTaxes] = await Promise.all([
        getTaxSummary(db, {
          teamId: teamId!,
          type: "paid",
          from: input.from,
          to: input.to,
          currency: input.currency,
        }),
        getTaxSummary(db, {
          teamId: teamId!,
          type: "collected",
          from: input.from,
          to: input.to,
          currency: input.currency,
        }),
      ]);

      return {
        result: {
          paid: paidTaxes.summary,
          collected: collectedTaxes.summary,
          currency: paidTaxes.summary.currency || input.currency || "USD",
        },
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

  getOverdueInvoicesAlert: protectedProcedure
    .input(getOverdueInvoicesAlertSchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      const overdueData = await getOverdueInvoicesAlert(db, {
        teamId: teamId!,
        currency: input?.currency,
      });

      return {
        result: overdueData.summary,
      };
    }),

  getBillableHours: protectedProcedure
    .input(getBillableHoursSchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      return getBillableHours(db, {
        teamId: teamId!,
        date: input.date,
        view: input.view,
        weekStartsOnMonday: input.weekStartsOnMonday,
      });
    }),

  getCustomerLifetimeValue: protectedProcedure
    .input(getCustomerLifetimeValueSchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      const result = await getCustomerLifetimeValue(db, {
        teamId: teamId!,
        currency: input.currency,
      });

      return {
        result,
        toolCall: {
          toolName: "getCustomerLifetimeValue",
          toolParams: {
            currency: input.currency,
          },
        },
      };
    }),

  // Japan-specific widgets (Midday-JP)
  getTrueCash: protectedProcedure
    .input(getTrueCashSchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      // Get cash balance
      const cashBalanceData = await getNetPosition(db, {
        teamId: teamId!,
        currency: input.currency,
      });

      const cashBalance = cashBalanceData.cash ?? 0;

      // Estimate consumption tax reserve (10% of revenue transactions)
      // This is a simplified calculation - in production, you'd want to
      // track actual collected vs paid consumption tax
      const consumptionTaxReserve = Math.round(cashBalance * 0.05); // Rough estimate

      // Estimate income tax reserve (simplified: ~20-30% of profit for individuals)
      const incomeTaxReserve = Math.round(cashBalance * 0.15); // Rough estimate

      // True Cash = Cash Balance - Tax Reserves
      const trueCash = cashBalance - consumptionTaxReserve - incomeTaxReserve;

      return {
        result: {
          trueCash,
          cashBalance,
          consumptionTaxReserve,
          incomeTaxReserve,
          currency: input.currency || "JPY",
        },
      };
    }),

  getConsumptionTaxSummary: protectedProcedure
    .input(getConsumptionTaxSummarySchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      // Get tax summary data
      const [paidTaxes, collectedTaxes] = await Promise.all([
        getTaxSummary(db, {
          teamId: teamId!,
          type: "paid",
          from: input.from,
          to: input.to,
          currency: input.currency,
        }),
        getTaxSummary(db, {
          teamId: teamId!,
          type: "collected",
          from: input.from,
          to: input.to,
          currency: input.currency,
        }),
      ]);

      const collectedTax = collectedTaxes.summary.totalTaxAmount ?? 0;
      const paidTax = paidTaxes.summary.totalTaxAmount ?? 0;
      const netTaxPayable = collectedTax - paidTax;

      // Calculate qualified invoice ratio (placeholder - would need actual tracking)
      const qualifiedInvoiceRatio = 0.85; // Assume 85% have qualified invoices

      return {
        result: {
          collectedTax,
          paidTax,
          netTaxPayable,
          qualifiedInvoiceRatio,
          currency: input.currency || "JPY",
        },
      };
    }),

  getProjectROI: protectedProcedure
    .input(getProjectROISchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      // Get billable hours data to find projects
      const billableData = await getBillableHours(db, {
        teamId: teamId!,
        date: new Date().toISOString(),
        view: "month",
        weekStartsOnMonday: true,
      });

      // Extract project data from billable hours
      const projects = billableData.projectBreakdown ?? [];

      // Calculate ROI for each project
      const projectROIs = projects.slice(0, input.limit).map((project) => {
        // Use amount from billable data as revenue
        const revenue = project.amount;
        const laborCost = revenue * 0.3; // Estimate 30% labor cost
        const expenses = revenue * 0.1; // Estimate 10% project expenses

        const totalCost = laborCost + expenses;
        const profit = revenue - totalCost;
        const roi = totalCost > 0 ? (profit / totalCost) * 100 : 0;

        return {
          projectId: project.id,
          projectName: project.name,
          revenue,
          expenses,
          laborCost,
          trackedHours: project.duration / 3600,
          roi: Math.round(roi),
        };
      });

      const averageROI =
        projectROIs.length > 0
          ? projectROIs.reduce((sum: number, p: { roi: number }) => sum + p.roi, 0) / projectROIs.length
          : 0;

      return {
        result: {
          projects: projectROIs,
          averageROI: Math.round(averageROI),
          currency: input.currency || "JPY",
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
