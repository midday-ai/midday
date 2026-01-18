import {
  getBurnRateSchema,
  getExpensesSchema,
  getProfitSchema,
  getRevenueSchema,
  getRunwaySchema,
  getSpendingSchema,
} from "@api/schemas/reports";
import {
  getBurnRate,
  getExpenses,
  getReports,
  getRunway,
  getSpending,
} from "@midday/db/queries";
import { READ_ONLY_ANNOTATIONS, type RegisterTools, hasScope } from "../types";

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
};
