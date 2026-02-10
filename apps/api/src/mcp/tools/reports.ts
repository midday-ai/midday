import {
  getBalanceSheetSchema,
  getBurnRateSchema,
  getCashFlowSchema,
  getExpensesSchema,
  getGrowthRateSchema,
  getProfitMarginSchema,
  getProfitSchema,
  getRecurringExpensesSchema,
  getRevenueForecastSchema,
  getRevenueSchema,
  getRunwaySchema,
  getSpendingSchema,
  getTaxSummarySchema,
} from "@api/schemas/reports";
import {
  getBalanceSheet,
  getBurnRate,
  getCashFlow,
  getExpenses,
  getGrowthRate,
  getProfitMargin,
  getRecurringExpenses,
  getReports,
  getRevenueForecast,
  getRunway,
  getSpending,
  getTaxSummary,
} from "@midday/db/queries";
import { hasScope, READ_ONLY_ANNOTATIONS, type RegisterTools } from "../types";

export const registerReportTools: RegisterTools = (server, ctx) => {
  const { db, teamId } = ctx;

  // Require reports.read scope
  if (!hasScope(ctx, "reports.read")) {
    return;
  }

  server.registerTool(
    "reports_revenue",
    {
      title: "Revenue Report",
      description:
        "Get revenue reports for a date range. Returns total revenue with comparisons to previous period.",
      inputSchema: getRevenueSchema.shape,
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async (params) => {
      const result = await getReports(db, {
        teamId,
        from: params.from,
        to: params.to,
        currency: params.currency,
        type: "revenue",
        revenueType: params.revenueType,
      });

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.registerTool(
    "reports_profit",
    {
      title: "Profit Report",
      description:
        "Get profit reports for a date range. Returns profit with revenue minus expenses.",
      inputSchema: getProfitSchema.shape,
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async (params) => {
      const result = await getReports(db, {
        teamId,
        from: params.from,
        to: params.to,
        currency: params.currency,
        type: "profit",
        revenueType: params.revenueType,
      });

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.registerTool(
    "reports_burn_rate",
    {
      title: "Burn Rate Report",
      description:
        "Get burn rate (monthly spending) for a date range. Useful for understanding cash outflow.",
      inputSchema: getBurnRateSchema.shape,
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async (params) => {
      const result = await getBurnRate(db, {
        teamId,
        from: params.from,
        to: params.to,
        currency: params.currency,
      });

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.registerTool(
    "reports_runway",
    {
      title: "Runway Report",
      description:
        "Get runway estimate (months of cash remaining based on burn rate). Critical for financial planning.",
      inputSchema: getRunwaySchema.shape,
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async (params) => {
      const result = await getRunway(db, {
        teamId,
        currency: params.currency,
      });

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.registerTool(
    "reports_expenses",
    {
      title: "Expenses Report",
      description:
        "Get expense reports for a date range. Returns expenses with recurring vs one-time breakdown.",
      inputSchema: getExpensesSchema.shape,
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async (params) => {
      const result = await getExpenses(db, {
        teamId,
        from: params.from,
        to: params.to,
        currency: params.currency,
      });

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.registerTool(
    "reports_spending",
    {
      title: "Spending by Category",
      description:
        "Get spending breakdown by category for a date range. Shows where money is being spent.",
      inputSchema: getSpendingSchema.shape,
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async (params) => {
      const result = await getSpending(db, {
        teamId,
        from: params.from,
        to: params.to,
        currency: params.currency,
      });

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.registerTool(
    "reports_tax_summary",
    {
      title: "Tax Summary Report",
      description:
        "Get tax summary for a date range. Shows total tax paid or collected, grouped by category and tax type.",
      inputSchema: getTaxSummarySchema.shape,
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async (params) => {
      const result = await getTaxSummary(db, {
        teamId,
        from: params.from,
        to: params.to,
        type: params.type,
        currency: params.currency,
        categorySlug: params.categorySlug,
        taxType: params.taxType,
      });

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.registerTool(
    "reports_growth_rate",
    {
      title: "Growth Rate Report",
      description:
        "Get revenue or profit growth rate comparing current period to previous period. Supports monthly, quarterly, or yearly comparisons.",
      inputSchema: getGrowthRateSchema.shape,
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async (params) => {
      const result = await getGrowthRate(db, {
        teamId,
        from: params.from,
        to: params.to,
        currency: params.currency,
        type: params.type,
        revenueType: params.revenueType,
        period: params.period,
      });

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.registerTool(
    "reports_profit_margin",
    {
      title: "Profit Margin Report",
      description:
        "Get profit margin analysis for a date range. Shows profit as percentage of revenue with monthly breakdown and trend.",
      inputSchema: getProfitMarginSchema.shape,
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async (params) => {
      const result = await getProfitMargin(db, {
        teamId,
        from: params.from,
        to: params.to,
        currency: params.currency,
        revenueType: params.revenueType,
      });

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.registerTool(
    "reports_cash_flow",
    {
      title: "Cash Flow Report",
      description:
        "Get cash flow analysis showing income vs expenses over time. Includes monthly breakdown and net cash flow.",
      inputSchema: getCashFlowSchema.shape,
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async (params) => {
      const result = await getCashFlow(db, {
        teamId,
        from: params.from,
        to: params.to,
        currency: params.currency,
        period: params.period,
      });

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.registerTool(
    "reports_recurring_expenses",
    {
      title: "Recurring Expenses Report",
      description:
        "Get list of recurring expenses with frequency breakdown (weekly, monthly, annually). Shows top recurring costs.",
      inputSchema: getRecurringExpensesSchema.shape,
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async (params) => {
      const result = await getRecurringExpenses(db, {
        teamId,
        from: params.from,
        to: params.to,
        currency: params.currency,
      });

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.registerTool(
    "reports_revenue_forecast",
    {
      title: "Revenue Forecast Report",
      description:
        "Get revenue forecast based on historical data, outstanding invoices, billable hours, and scheduled invoices. Projects future revenue.",
      inputSchema: getRevenueForecastSchema.shape,
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async (params) => {
      const result = await getRevenueForecast(db, {
        teamId,
        from: params.from,
        to: params.to,
        forecastMonths: params.forecastMonths,
        currency: params.currency,
        revenueType: params.revenueType,
      });

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.registerTool(
    "reports_balance_sheet",
    {
      title: "Balance Sheet Report",
      description:
        "Get balance sheet showing assets, liabilities, and equity. Provides a snapshot of financial position as of a specific date.",
      inputSchema: getBalanceSheetSchema.shape,
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async (params) => {
      const result = await getBalanceSheet(db, {
        teamId,
        asOf: params.asOf,
        currency: params.currency,
      });

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    },
  );
};
