import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react/schema";
import { z } from "zod";

const barSeriesSchema = z.object({
  dataKey: z.string(),
  fill: z
    .enum(["primary", "secondary", "pattern"])
    .optional()
    .describe(
      "Bar fill style: primary (solid), secondary (muted), or pattern (diagonal lines)",
    ),
  yAxisId: z.string().optional(),
  name: z.string().optional().describe("Display name in tooltip"),
});

const lineSeriesSchema = z.object({
  dataKey: z.string(),
  dashed: z.boolean().optional(),
  color: z.string().optional(),
  strokeWidth: z.number().optional(),
  dot: z.boolean().optional(),
  yAxisId: z.string().optional(),
  name: z.string().optional().describe("Display name in tooltip"),
});

const areaSeriesSchema = z.object({
  dataKey: z.string(),
  gradient: z.boolean().optional().describe("Use vertical gradient fill"),
  pattern: z.boolean().optional().describe("Use diagonal line pattern fill"),
  name: z.string().optional().describe("Display name in tooltip"),
});

const legendItemSchema = z.object({
  label: z.string(),
  type: z.enum(["solid", "dashed", "pattern"]),
});

const metricItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  value: z.string(),
  subtitle: z.string().optional(),
});

const tableColumnSchema = z.object({
  header: z.string(),
  accessorKey: z.string(),
  align: z.enum(["left", "right", "center"]).optional(),
});

const balanceSheetLineItemSchema = z.object({
  label: z.string(),
  amount: z.number(),
});

export const catalog = defineCatalog(schema, {
  components: {
    BarChart: {
      description:
        "Bar chart for comparing values across categories or time periods. Use for monthly revenue, expenses, profit, or any time series. Pass data as array of objects with the xAxisKey field and one or more numeric fields for bars.",
      props: z.object({
        data: z.array(z.record(z.string(), z.unknown())),
        xAxisKey: z.string(),
        bars: z.array(barSeriesSchema),
        lines: z.array(lineSeriesSchema).optional(),
        height: z.number().optional(),
        currency: z.string().optional(),
        locale: z.string().optional(),
        referenceLineY: z.number().optional(),
        dualYAxis: z
          .object({
            rightAxisId: z.string(),
            tickSuffix: z.string().optional(),
          })
          .optional(),
      }),
      example: {
        data: [
          { month: "Jan", revenue: 9200 },
          { month: "Feb", revenue: 10100 },
          { month: "Mar", revenue: 11500 },
        ],
        xAxisKey: "month",
        bars: [{ dataKey: "revenue", fill: "primary", name: "Revenue" }],
        currency: "USD",
        locale: "en-US",
      },
    },
    LineChart: {
      description:
        "Line chart for trends, projections, and comparisons over time. Use for growth rates, forecasts, or multi-series comparisons. Supports solid and dashed lines.",
      props: z.object({
        data: z.array(z.record(z.string(), z.unknown())),
        xAxisKey: z.string(),
        lines: z.array(lineSeriesSchema),
        height: z.number().optional(),
        currency: z.string().optional(),
        locale: z.string().optional(),
        referenceLineY: z.number().optional(),
        xAxisLabel: z.string().optional(),
      }),
      example: {
        data: [
          { month: "Jan", actual: 8000, forecast: 8500 },
          { month: "Feb", actual: 9200, forecast: 9000 },
          { month: "Mar", actual: null, forecast: 9800 },
        ],
        xAxisKey: "month",
        lines: [
          { dataKey: "actual", name: "Actual" },
          { dataKey: "forecast", dashed: true, name: "Forecast" },
        ],
        currency: "USD",
      },
    },
    AreaChart: {
      description:
        "Area chart with filled regions for showing volume over time. Use for cash flow, cumulative totals, or income vs expenses. Supports gradient and pattern fills.",
      props: z.object({
        data: z.array(z.record(z.string(), z.unknown())),
        xAxisKey: z.string(),
        areas: z.array(areaSeriesSchema),
        lines: z.array(lineSeriesSchema).optional(),
        height: z.number().optional(),
        currency: z.string().optional(),
        locale: z.string().optional(),
      }),
      example: {
        data: [
          { month: "Jan", income: 12000, expenses: 8000 },
          { month: "Feb", income: 14000, expenses: 9200 },
        ],
        xAxisKey: "month",
        areas: [
          { dataKey: "income", gradient: true, name: "Income" },
          { dataKey: "expenses", pattern: true, name: "Expenses" },
        ],
        currency: "USD",
      },
    },
    DonutChart: {
      description:
        "Donut chart for category breakdowns and proportions. Use for spending by category, expense distribution, or any part-of-whole visualization.",
      props: z.object({
        data: z.array(
          z.object({
            name: z.string(),
            value: z.number(),
            percentage: z.number().optional(),
          }),
        ),
        height: z.number().optional(),
        currency: z.string().optional(),
        locale: z.string().optional(),
      }),
      example: {
        data: [
          { name: "Software", value: 4500, percentage: 35 },
          { name: "Marketing", value: 3200, percentage: 25 },
          { name: "Payroll", value: 5100, percentage: 40 },
        ],
        currency: "USD",
      },
    },
    ChartContainer: {
      description:
        "Wrapper that adds a title and optional legend above a chart. Always wrap BarChart, LineChart, AreaChart, or DonutChart in this.",
      props: z.object({
        title: z.string(),
        legend: z.array(legendItemSchema).optional(),
      }),
      slots: ["default"],
      example: {
        title: "Monthly Revenue",
        legend: [{ label: "Revenue", type: "solid" }],
      },
    },
    MetricGrid: {
      description:
        "Grid of metric cards for key numbers. Use for totals, percentages, and comparisons. Format values as display strings (e.g. '$12,500', '+8.3%').",
      props: z.object({
        items: z.array(metricItemSchema),
        layout: z.enum(["1/1", "2/2", "2/3", "4/4"]).optional(),
      }),
      example: {
        items: [
          { id: "total", title: "Total Revenue", value: "$125,400" },
          { id: "change", title: "vs Previous", value: "+12.5%" },
          { id: "avg", title: "Monthly Average", value: "$10,450" },
        ],
        layout: "2/3",
      },
    },
    Section: {
      description:
        "Text section with a title and content. Use for analysis summaries or recommendations.",
      props: z.object({
        title: z.string().optional(),
        content: z.string(),
      }),
      example: {
        title: "Analysis",
        content:
          "Revenue grew 12.5% compared to the previous period. March was your strongest month.",
      },
    },
    DataTable: {
      description:
        "Data table for lists of transactions, invoices, or any tabular data. Define columns with header/accessorKey and pass rows as array of objects.",
      props: z.object({
        columns: z.array(tableColumnSchema),
        rows: z.array(z.record(z.string(), z.unknown())),
      }),
      example: {
        columns: [
          { header: "Date", accessorKey: "date" },
          { header: "Description", accessorKey: "description" },
          { header: "Amount", accessorKey: "amount", align: "right" },
        ],
        rows: [
          { date: "Mar 15", description: "Client payment", amount: "$5,200" },
          {
            date: "Mar 12",
            description: "Software subscription",
            amount: "-$99",
          },
        ],
      },
    },
    BalanceSheet: {
      description:
        "Full balance sheet financial statement. Shows assets (current/non-current), liabilities (current/non-current), equity, totals, and financial ratios. Use when the getBalanceSheet tool returns data.",
      props: z.object({
        asOf: z
          .string()
          .describe("Date the balance sheet is as of (e.g. '2025-12-31')"),
        currency: z.string(),
        locale: z.string().optional(),
        assets: z.object({
          current: z.array(balanceSheetLineItemSchema),
          nonCurrent: z.array(balanceSheetLineItemSchema),
        }),
        liabilities: z.object({
          current: z.array(balanceSheetLineItemSchema),
          nonCurrent: z.array(balanceSheetLineItemSchema),
        }),
        equity: z.object({
          items: z.array(balanceSheetLineItemSchema),
        }),
        ratios: z
          .object({
            currentRatio: z.number().optional(),
            debtToEquity: z.number().optional(),
            workingCapital: z.number().optional(),
            equityRatio: z.number().optional(),
          })
          .optional(),
      }),
      example: {
        asOf: "2025-12-31",
        currency: "USD",
        locale: "en-US",
        assets: {
          current: [
            { label: "Cash and Cash Equivalents", amount: 50000 },
            { label: "Accounts Receivable", amount: 12000 },
            { label: "Inventory", amount: 3000 },
            { label: "Prepaid Expenses", amount: 1500 },
          ],
          nonCurrent: [
            { label: "Fixed Assets (Equipment)", amount: 25000 },
            { label: "Accumulated Depreciation", amount: -5000 },
            { label: "Software & Technology", amount: 8000 },
          ],
        },
        liabilities: {
          current: [
            { label: "Accounts Payable", amount: 8000 },
            { label: "Accrued Expenses", amount: 2000 },
            { label: "Credit Card Debt", amount: 1500 },
          ],
          nonCurrent: [
            { label: "Long-term Debt", amount: 15000 },
            { label: "Deferred Revenue", amount: 3000 },
          ],
        },
        equity: {
          items: [
            { label: "Capital Investment", amount: 40000 },
            { label: "Owner Draws", amount: -2000 },
            { label: "Retained Earnings", amount: 28000 },
          ],
        },
        ratios: {
          currentRatio: 5.78,
          debtToEquity: 0.45,
          workingCapital: 55000,
          equityRatio: 69.8,
        },
      },
    },
  },
  actions: {},
});

export type AppCatalog = typeof catalog;
