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
import { z } from "zod";
import { hasScope, READ_ONLY_ANNOTATIONS, type RegisterTools } from "../types";
import { withErrorHandling } from "../utils";

const periodResultSchema = {
  summary: z.record(z.string(), z.any()),
  meta: z.record(z.string(), z.any()),
  result: z.array(z.record(z.string(), z.any())),
};

export const registerReportTools: RegisterTools = (server, ctx) => {
  const { db, teamId } = ctx;

  if (!hasScope(ctx, "reports.read")) {
    return;
  }

  server.registerTool(
    "reports_revenue",
    {
      title: "Revenue Report",
      description:
        "Get revenue for a date range with period-over-period comparison. Returns summary (currentTotal, prevTotal, currency), meta, and a monthly result array with current/previous values and percentage change.",
      inputSchema: getRevenueSchema.shape,
      outputSchema: periodResultSchema,
      annotations: READ_ONLY_ANNOTATIONS,
    },
    withErrorHandling(async (params) => {
      const result = await getReports(db, {
        teamId,
        from: params.from,
        to: params.to,
        currency: params.currency,
        type: "revenue",
        revenueType: params.revenueType,
      });

      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
        structuredContent: result,
      };
    }, "Failed to get revenue report"),
  );

  server.registerTool(
    "reports_profit",
    {
      title: "Profit Report",
      description:
        "Get profit (revenue minus expenses) for a date range with period-over-period comparison. Returns summary (currentTotal, prevTotal, currency), meta, and a monthly result array.",
      inputSchema: getProfitSchema.shape,
      outputSchema: periodResultSchema,
      annotations: READ_ONLY_ANNOTATIONS,
    },
    withErrorHandling(async (params) => {
      const result = await getReports(db, {
        teamId,
        from: params.from,
        to: params.to,
        currency: params.currency,
        type: "profit",
        revenueType: params.revenueType,
      });

      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
        structuredContent: result,
      };
    }, "Failed to get profit report"),
  );

  server.registerTool(
    "reports_burn_rate",
    {
      title: "Burn Rate Report",
      description:
        "Get monthly burn rate (total spending) for a date range. Returns an array of { date, value, currency } objects showing cash outflow per month.",
      inputSchema: getBurnRateSchema.shape,
      outputSchema: {
        data: z.array(z.record(z.string(), z.any())),
      },
      annotations: READ_ONLY_ANNOTATIONS,
    },
    withErrorHandling(async (params) => {
      const result = await getBurnRate(db, {
        teamId,
        from: params.from,
        to: params.to,
        currency: params.currency,
      });

      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
        structuredContent: { data: result },
      };
    }, "Failed to get burn rate report"),
  );

  server.registerTool(
    "reports_runway",
    {
      title: "Runway Report",
      description:
        "Get estimated months of cash remaining based on current burn rate and available balance. Returns a single number representing months of runway.",
      inputSchema: getRunwaySchema.shape,
      outputSchema: {
        months: z.number(),
      },
      annotations: READ_ONLY_ANNOTATIONS,
    },
    withErrorHandling(async (params) => {
      const result = await getRunway(db, {
        teamId,
        currency: params.currency,
      });

      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
        structuredContent: { months: result.months },
      };
    }, "Failed to get runway report"),
  );

  server.registerTool(
    "reports_expenses",
    {
      title: "Expenses Report",
      description:
        "Get expense totals for a date range with recurring vs one-time breakdown. Returns summary (averageExpense, currency), meta, and monthly result array with value, recurring, and total fields.",
      inputSchema: getExpensesSchema.shape,
      outputSchema: periodResultSchema,
      annotations: READ_ONLY_ANNOTATIONS,
    },
    withErrorHandling(async (params) => {
      const result = await getExpenses(db, {
        teamId,
        from: params.from,
        to: params.to,
        currency: params.currency,
      });

      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
        structuredContent: result,
      };
    }, "Failed to get expenses report"),
  );

  server.registerTool(
    "reports_spending",
    {
      title: "Spending by Category",
      description:
        "Get spending breakdown by category for a date range. Returns an array of categories with name, slug, amount, currency, color, and percentage of total.",
      inputSchema: getSpendingSchema.shape,
      outputSchema: {
        data: z.array(z.record(z.string(), z.any())),
      },
      annotations: READ_ONLY_ANNOTATIONS,
    },
    withErrorHandling(async (params) => {
      const result = await getSpending(db, {
        teamId,
        from: params.from,
        to: params.to,
        currency: params.currency,
      });

      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
        structuredContent: { data: result },
      };
    }, "Failed to get spending report"),
  );

  server.registerTool(
    "reports_tax_summary",
    {
      title: "Tax Summary Report",
      description:
        "Get tax summary for a date range. Shows total tax paid or collected, grouped by category and tax type. Filter by type (paid/collected), category slug, or specific tax type.",
      inputSchema: getTaxSummarySchema.shape,
      outputSchema: {
        data: z.array(z.record(z.string(), z.any())),
      },
      annotations: READ_ONLY_ANNOTATIONS,
    },
    withErrorHandling(async (params) => {
      const result = await getTaxSummary(db, {
        teamId,
        from: params.from,
        to: params.to,
        type: params.type,
        currency: params.currency,
        categorySlug: params.categorySlug,
        taxType: params.taxType,
      });

      const data = Array.isArray(result) ? result : [result];

      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
        structuredContent: { data },
      };
    }, "Failed to get tax summary"),
  );

  server.registerTool(
    "reports_growth_rate",
    {
      title: "Growth Rate Report",
      description:
        "Get revenue or profit growth rate comparing current period to previous period. Supports monthly, quarterly, or yearly comparison periods. Returns growth percentage and trend direction.",
      inputSchema: getGrowthRateSchema.shape,
      outputSchema: {
        data: z.record(z.string(), z.any()),
      },
      annotations: READ_ONLY_ANNOTATIONS,
    },
    withErrorHandling(async (params) => {
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
        content: [{ type: "text", text: JSON.stringify(result) }],
        structuredContent: { data: result },
      };
    }, "Failed to get growth rate report"),
  );

  server.registerTool(
    "reports_profit_margin",
    {
      title: "Profit Margin Report",
      description:
        "Get profit margin analysis for a date range. Returns profit as a percentage of revenue with monthly breakdown, overall margin, and trend direction.",
      inputSchema: getProfitMarginSchema.shape,
      outputSchema: {
        data: z.record(z.string(), z.any()),
      },
      annotations: READ_ONLY_ANNOTATIONS,
    },
    withErrorHandling(async (params) => {
      const result = await getProfitMargin(db, {
        teamId,
        from: params.from,
        to: params.to,
        currency: params.currency,
        revenueType: params.revenueType,
      });

      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
        structuredContent: { data: result },
      };
    }, "Failed to get profit margin report"),
  );

  server.registerTool(
    "reports_cash_flow",
    {
      title: "Cash Flow Report",
      description:
        "Get cash flow analysis showing income vs expenses over time. Returns monthly or quarterly breakdown with income, expenses, and net cash flow per period.",
      inputSchema: getCashFlowSchema.shape,
      outputSchema: {
        data: z.record(z.string(), z.any()),
      },
      annotations: READ_ONLY_ANNOTATIONS,
    },
    withErrorHandling(async (params) => {
      const result = await getCashFlow(db, {
        teamId,
        from: params.from,
        to: params.to,
        currency: params.currency,
        period: params.period,
      });

      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
        structuredContent: { data: result },
      };
    }, "Failed to get cash flow report"),
  );

  server.registerTool(
    "reports_recurring_expenses",
    {
      title: "Recurring Expenses Report",
      description:
        "Get detected recurring expenses with frequency analysis (weekly, monthly, annually). Returns a list of recurring costs with merchant name, amount, frequency, and next expected date.",
      inputSchema: getRecurringExpensesSchema.shape,
      outputSchema: {
        data: z.array(z.record(z.string(), z.any())),
      },
      annotations: READ_ONLY_ANNOTATIONS,
    },
    withErrorHandling(async (params) => {
      const result = await getRecurringExpenses(db, {
        teamId,
        from: params.from,
        to: params.to,
        currency: params.currency,
      });

      const data = Array.isArray(result) ? result : [result];

      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
        structuredContent: { data },
      };
    }, "Failed to get recurring expenses"),
  );

  server.registerTool(
    "reports_revenue_forecast",
    {
      title: "Revenue Forecast Report",
      description:
        "Get revenue forecast based on historical data, outstanding invoices, billable hours, and scheduled invoices. Returns summary with projections, historical data, forecast with confidence bounds and source breakdown, and combined timeline.",
      inputSchema: getRevenueForecastSchema.shape,
      outputSchema: {
        summary: z.record(z.string(), z.any()),
        historical: z.array(z.record(z.string(), z.any())),
        forecast: z.array(z.record(z.string(), z.any())),
        combined: z.array(z.record(z.string(), z.any())),
        meta: z.record(z.string(), z.any()),
      },
      annotations: READ_ONLY_ANNOTATIONS,
    },
    withErrorHandling(async (params) => {
      const result = await getRevenueForecast(db, {
        teamId,
        from: params.from,
        to: params.to,
        forecastMonths: params.forecastMonths,
        currency: params.currency,
        revenueType: params.revenueType,
      });

      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
        structuredContent: result,
      };
    }, "Failed to get revenue forecast"),
  );

  server.registerTool(
    "reports_balance_sheet",
    {
      title: "Balance Sheet Report",
      description:
        "Get balance sheet snapshot showing assets, liabilities, and equity as of a specific date. Defaults to today if no date is provided.",
      inputSchema: getBalanceSheetSchema.shape,
      outputSchema: {
        data: z.record(z.string(), z.any()),
      },
      annotations: READ_ONLY_ANNOTATIONS,
    },
    withErrorHandling(async (params) => {
      const result = await getBalanceSheet(db, {
        teamId,
        asOf: params.asOf,
        currency: params.currency,
      });

      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
        structuredContent: { data: result },
      };
    }, "Failed to get balance sheet"),
  );
};
