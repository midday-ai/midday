// Chart type identifiers
export type ChartId =
  | "collection-performance"
  | "funding-activity"
  | "portfolio-composition"
  | "factor-rate-returns"
  | "rtr-aging"
  | "nsf-default-trends"
  | "repayment-velocity";

// Report types for database storage
export type ReportType =
  | "collection_performance"
  | "funding_activity"
  | "portfolio_composition"
  | "factor_rate_returns"
  | "rtr_aging"
  | "nsf_default_trends"
  | "repayment_velocity";

// Default chart order matching current layout
export const DEFAULT_CHART_ORDER: ChartId[] = [
  "collection-performance",
  "funding-activity",
  "portfolio-composition",
  "factor-rate-returns",
  "rtr-aging",
  "nsf-default-trends",
  "repayment-velocity",
];

// Mapping from ChartId to ReportType
const chartToReportMap: Record<ChartId, ReportType> = {
  "collection-performance": "collection_performance",
  "funding-activity": "funding_activity",
  "portfolio-composition": "portfolio_composition",
  "factor-rate-returns": "factor_rate_returns",
  "rtr-aging": "rtr_aging",
  "nsf-default-trends": "nsf_default_trends",
  "repayment-velocity": "repayment_velocity",
};

// Mapping from ReportType to ChartId
const reportToChartMap: Record<ReportType, ChartId> = {
  collection_performance: "collection-performance",
  funding_activity: "funding-activity",
  portfolio_composition: "portfolio-composition",
  factor_rate_returns: "factor-rate-returns",
  rtr_aging: "rtr-aging",
  nsf_default_trends: "nsf-default-trends",
  repayment_velocity: "repayment-velocity",
};

// Display names for chart types
const chartDisplayNames: Record<ReportType, string> = {
  collection_performance: "Collection Performance",
  funding_activity: "Funding Activity",
  portfolio_composition: "Portfolio Composition",
  factor_rate_returns: "Factor Rate Returns",
  rtr_aging: "RTR Aging",
  nsf_default_trends: "NSF & Default Trends",
  repayment_velocity: "Repayment Velocity",
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
