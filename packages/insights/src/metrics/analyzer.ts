/**
 * Smart metric selection and anomaly detection
 */
import {
  ANOMALY_THRESHOLDS,
  DEFAULT_TOP_METRICS_COUNT,
  MAX_METRICS_PER_CATEGORY,
  SCORING_WEIGHTS,
} from "../constants";
import type { InsightAnomaly, InsightMetric } from "../types";
import { getMetricDefinition, isCoreFinancialMetric } from "./definitions";

/**
 * Score a metric based on multiple factors for selection
 */
function scoreMetric(metric: InsightMetric): number {
  let score = 0;

  // Find metric definition
  const definition = getMetricDefinition(metric.type);
  const priority = definition?.priority ?? 3;

  // 1. Base priority score (25 points max - priority 1 = 25, priority 4 = 10)
  score += Math.max(
    10,
    SCORING_WEIGHTS.basePriority - priority * SCORING_WEIGHTS.priorityDecrement,
  );

  // 2. Has meaningful data (25 points)
  if (metric.value !== 0 || metric.previousValue !== 0) {
    score += SCORING_WEIGHTS.hasMeaningfulData;
  }

  // 3. Significant change - the "story" factor (20 points max)
  const changePercent = Math.abs(metric.change);
  if (changePercent > ANOMALY_THRESHOLDS.significantChange) {
    score += SCORING_WEIGHTS.significantChange;
  } else if (changePercent > ANOMALY_THRESHOLDS.moderateChange) {
    score += SCORING_WEIGHTS.moderateChange;
  } else if (changePercent > ANOMALY_THRESHOLDS.minorChange) {
    score += SCORING_WEIGHTS.minorChange;
  }

  // 4. Anomaly/alert boost (15 points)
  if (
    metric.type === "runway_months" &&
    metric.value < ANOMALY_THRESHOLDS.runwayWarning
  ) {
    score += SCORING_WEIGHTS.anomalyBoost;
  }
  if (metric.type === "net_profit" && metric.value < 0) {
    score += SCORING_WEIGHTS.anomalyBoost;
  }
  if (
    metric.type === "cash_flow" &&
    metric.value < ANOMALY_THRESHOLDS.negativeCashFlow
  ) {
    score += SCORING_WEIGHTS.anomalyBoost;
  }

  // 5. Ensure core metrics get visibility (10 points)
  if (isCoreFinancialMetric(metric.type)) {
    score += SCORING_WEIGHTS.coreMetricBoost;
  }

  return score;
}

/**
 * Select the top N most relevant metrics for display
 *
 * Strategy:
 * - Score all metrics
 * - Ensure diversity (max 2 from same category)
 * - Always include at least 1 core financial metric
 * - Prioritize metrics with significant changes
 */
export function selectTopMetrics(
  metrics: InsightMetric[] | Record<string, InsightMetric>,
  count: number = DEFAULT_TOP_METRICS_COUNT,
): InsightMetric[] {
  // Convert to array if object
  const metricsArray = Array.isArray(metrics)
    ? metrics
    : Object.values(metrics);

  // Score all metrics
  const scoredMetrics = metricsArray.map((m) => ({
    metric: m,
    score: scoreMetric(m),
  }));

  // Sort by score descending
  scoredMetrics.sort((a, b) => b.score - a.score);

  // Select with diversity constraint
  const selected: InsightMetric[] = [];
  const categoryCounts = new Map<string, number>();

  for (const { metric } of scoredMetrics) {
    if (selected.length >= count) break;

    const definition = getMetricDefinition(metric.type);
    const category = definition?.category ?? "other";

    // Max 2 from same category for diversity
    const categoryCount = categoryCounts.get(category) ?? 0;
    if (categoryCount >= MAX_METRICS_PER_CATEGORY) continue;

    selected.push(metric);
    categoryCounts.set(category, categoryCount + 1);
  }

  // Ensure at least one core financial metric
  const hasFinancial = selected.some((m) => isCoreFinancialMetric(m.type));

  if (!hasFinancial && metricsArray.length > 0) {
    const financialMetric = metricsArray.find((m) =>
      isCoreFinancialMetric(m.type),
    );
    if (financialMetric) {
      selected.pop(); // Remove lowest priority
      selected.unshift(financialMetric); // Add financial at start
    }
  }

  return selected;
}

/**
 * Detect anomalies in the metrics
 */
export function detectAnomalies(
  metrics: InsightMetric[] | Record<string, InsightMetric>,
): InsightAnomaly[] {
  const anomalies: InsightAnomaly[] = [];
  const metricsArray = Array.isArray(metrics)
    ? metrics
    : Object.values(metrics);

  for (const metric of metricsArray) {
    // Significant positive changes
    if (metric.change > ANOMALY_THRESHOLDS.significantChange) {
      const isExpenseMetric =
        metric.type === "expenses" || metric.type === "burn_rate";
      anomalies.push({
        type: isExpenseMetric
          ? "significant_expense_increase"
          : "significant_increase",
        severity: isExpenseMetric ? "warning" : "info",
        message: `${metric.label} increased by ${Math.abs(metric.change).toFixed(0)}%`,
        metricType: metric.type,
      });
    }

    // Significant negative changes
    if (metric.change < -ANOMALY_THRESHOLDS.significantChange) {
      const isExpenseMetric =
        metric.type === "expenses" || metric.type === "burn_rate";
      anomalies.push({
        type: isExpenseMetric
          ? "significant_expense_decrease"
          : "significant_decrease",
        severity: isExpenseMetric ? "info" : "warning",
        message: `${metric.label} decreased by ${Math.abs(metric.change).toFixed(0)}%`,
        metricType: metric.type,
      });
    }

    // Low runway warning
    if (
      metric.type === "runway_months" &&
      metric.value < ANOMALY_THRESHOLDS.runwayWarning
    ) {
      anomalies.push({
        type: "low_runway",
        severity:
          metric.value < ANOMALY_THRESHOLDS.runwayCritical
            ? "alert"
            : "warning",
        message: `Runway is ${metric.value.toFixed(1)} months`,
        metricType: metric.type,
      });
    }

    // Negative profit
    if (metric.type === "net_profit" && metric.value < 0) {
      anomalies.push({
        type: "negative_profit",
        severity: "warning",
        message: "Business is currently unprofitable",
        metricType: metric.type,
      });
    }

    // Negative cash flow
    if (
      metric.type === "cash_flow" &&
      metric.value < ANOMALY_THRESHOLDS.negativeCashFlow
    ) {
      anomalies.push({
        type: "negative_cash_flow",
        severity: "warning",
        message: "Negative cash flow this period",
        metricType: metric.type,
      });
    }

    // Overdue invoices
    if (metric.type === "invoices_overdue" && metric.value > 0) {
      anomalies.push({
        type: "overdue_invoices",
        severity: metric.value > 5 ? "alert" : "warning",
        message: `${metric.value} overdue invoice${metric.value > 1 ? "s" : ""} need attention`,
        metricType: metric.type,
      });
    }
  }

  return anomalies;
}
