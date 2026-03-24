/**
 * Metrics module - metric analysis and selection
 */
export {
  detectAnomalies,
  detectExpenseAnomalies,
  selectTopMetrics,
} from "./analyzer";

export {
  addActivityMetrics,
  calculateAllMetrics,
  calculatePercentageChange,
  createMetric,
  formatMetricValue,
  getChangeDirection,
} from "./calculator";

export {
  getMetricDefinition,
  getMetricLabel,
  getMetricPriority,
  getMetricsByCategory,
  getMetricUnit,
  isCoreFinancialMetric,
} from "./definitions";
