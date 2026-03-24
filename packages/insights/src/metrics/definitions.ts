/**
 * Metric definitions and metadata
 */
import {
  CORE_FINANCIAL_METRICS,
  METRIC_DEFINITIONS,
  type MetricDefinition,
} from "../constants";
import type { MetricCategory } from "../types";

/**
 * Get a metric definition by type
 */
export function getMetricDefinition(
  type: string,
): MetricDefinition | undefined {
  return METRIC_DEFINITIONS.find((d) => d.type === type);
}

/**
 * Get all metrics in a category
 */
export function getMetricsByCategory(
  category: MetricCategory,
): MetricDefinition[] {
  return METRIC_DEFINITIONS.filter((d) => d.category === category);
}

/**
 * Check if a metric type is a core financial metric
 */
export function isCoreFinancialMetric(type: string): boolean {
  return CORE_FINANCIAL_METRICS.includes(type);
}

/**
 * Get the display label for a metric type
 */
export function getMetricLabel(type: string): string {
  const definition = getMetricDefinition(type);
  if (definition) {
    return definition.label;
  }

  // Fallback: convert snake_case to Title Case
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Get the unit type for a metric
 */
export function getMetricUnit(
  type: string,
): MetricDefinition["unit"] | undefined {
  return getMetricDefinition(type)?.unit;
}

/**
 * Get the priority for a metric (lower = higher priority)
 */
export function getMetricPriority(type: string): number {
  return getMetricDefinition(type)?.priority ?? 3;
}
