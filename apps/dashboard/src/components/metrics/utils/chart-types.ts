// Chart type identifiers
export type ChartId =
  | "monthly-revenue"
  | "burn-rate"
  | "expenses"
  | "profit"
  | "revenue-forecast"
  | "runway"
  | "category-expenses";

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
