// Chart type identifiers
export type ChartId =
  | "monthly-revenue"
  | "burn-rate"
  | "expenses"
  | "profit"
  | "revenue-forecast"
  | "runway"
  | "category-expenses";

// Report types for database storage
export type ReportType =
  | "profit"
  | "revenue"
  | "burn_rate"
  | "expense"
  | "monthly_revenue"
  | "revenue_forecast"
  | "runway"
  | "category_expenses";

// Default chart order matching current layout
export const DEFAULT_CHART_ORDER: ChartId[] = [
  "monthly-revenue",
  "burn-rate",
  "expenses",
  "profit",
  "revenue-forecast",
  "runway",
  "category-expenses",
];

// Mapping from ChartId to ReportType
const chartToReportMap: Record<ChartId, ReportType> = {
  "monthly-revenue": "monthly_revenue",
  "burn-rate": "burn_rate",
  expenses: "expense",
  profit: "profit",
  "revenue-forecast": "revenue_forecast",
  runway: "runway",
  "category-expenses": "category_expenses",
};

// Mapping from ReportType to ChartId
const reportToChartMap: Record<ReportType, ChartId> = {
  profit: "profit",
  revenue: "monthly-revenue",
  burn_rate: "burn-rate",
  expense: "expenses",
  monthly_revenue: "monthly-revenue",
  revenue_forecast: "revenue-forecast",
  runway: "runway",
  category_expenses: "category-expenses",
};

// Display names for chart types
const chartDisplayNames: Record<ReportType, string> = {
  profit: "Profit & Loss",
  revenue: "Monthly Revenue",
  burn_rate: "Average Monthly Burn Rate",
  expense: "Average Monthly Expenses",
  monthly_revenue: "Monthly Revenue",
  revenue_forecast: "Revenue Forecast",
  runway: "Runway",
  category_expenses: "Expenses by Category",
};

export function chartTypeToReportType(chartId: ChartId): ReportType {
  return chartToReportMap[chartId];
}

export function reportTypeToChartType(reportType: ReportType): ChartId {
  return reportToChartMap[reportType];
}

export function getChartDisplayName(reportType: ReportType): string {
  return chartDisplayNames[reportType];
}
