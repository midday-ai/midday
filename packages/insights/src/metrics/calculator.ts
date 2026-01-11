/**
 * Metric value calculations and transformations
 */
import type { ChangeDirection, InsightMetric, MetricData } from "../types";
import { getMetricLabel, getMetricUnit } from "./definitions";

/**
 * Calculate the percentage change between two values
 */
export function calculatePercentageChange(
  current: number,
  previous: number,
): number {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }
  return ((current - previous) / Math.abs(previous)) * 100;
}

/**
 * Determine the direction of change
 */
export function getChangeDirection(change: number): ChangeDirection {
  if (change > 0.5) return "up";
  if (change < -0.5) return "down";
  return "flat";
}

/**
 * Create an InsightMetric from raw values
 */
export function createMetric(
  type: string,
  currentValue: number,
  previousValue: number,
  currency?: string,
): InsightMetric {
  const change = calculatePercentageChange(currentValue, previousValue);
  const unit = getMetricUnit(type);

  return {
    type,
    label: getMetricLabel(type),
    value: currentValue,
    previousValue,
    change: Math.round(change * 10) / 10, // Round to 1 decimal
    changeDirection: getChangeDirection(change),
    unit: unit === "currency" ? undefined : unit,
    currency: unit === "currency" ? currency : undefined,
  };
}

/**
 * Calculate all metrics from raw period data
 */
export function calculateAllMetrics(
  currentData: MetricData,
  previousData: MetricData,
  currency: string,
): Record<string, InsightMetric> {
  const metrics: Record<string, InsightMetric> = {};

  // Financial metrics
  metrics.revenue = createMetric(
    "revenue",
    currentData.revenue,
    previousData.revenue,
    currency,
  );

  metrics.expenses = createMetric(
    "expenses",
    currentData.expenses,
    previousData.expenses,
    currency,
  );

  metrics.net_profit = createMetric(
    "net_profit",
    currentData.netProfit,
    previousData.netProfit,
    currency,
  );

  metrics.cash_flow = createMetric(
    "cash_flow",
    currentData.cashFlow,
    previousData.cashFlow,
    currency,
  );

  metrics.profit_margin = createMetric(
    "profit_margin",
    currentData.profitMargin,
    previousData.profitMargin,
  );

  // Runway
  metrics.runway_months = createMetric(
    "runway_months",
    currentData.runwayMonths,
    previousData.runwayMonths,
  );

  return metrics;
}

/**
 * Add activity-based metrics to the metrics map
 */
export function addActivityMetrics(
  metrics: Record<string, InsightMetric>,
  currentActivity: {
    invoicesSent: number;
    invoicesPaid: number;
    invoicesOverdue: number;
    hoursTracked: number;
    unbilledHours: number;
    billableAmount?: number;
    newCustomers: number;
    receiptsMatched: number;
    transactionsCategorized: number;
  },
  previousActivity: {
    invoicesSent: number;
    invoicesPaid: number;
    invoicesOverdue: number;
    hoursTracked: number;
    unbilledHours: number;
    billableAmount?: number;
    newCustomers: number;
    receiptsMatched: number;
    transactionsCategorized: number;
  },
  currency: string,
): Record<string, InsightMetric> {
  // Invoicing metrics
  metrics.invoices_sent = createMetric(
    "invoices_sent",
    currentActivity.invoicesSent,
    previousActivity.invoicesSent,
  );

  metrics.invoices_paid = createMetric(
    "invoices_paid",
    currentActivity.invoicesPaid,
    previousActivity.invoicesPaid,
  );

  metrics.invoices_overdue = createMetric(
    "invoices_overdue",
    currentActivity.invoicesOverdue,
    previousActivity.invoicesOverdue,
  );

  // Time tracking metrics
  metrics.hours_tracked = createMetric(
    "hours_tracked",
    currentActivity.hoursTracked,
    previousActivity.hoursTracked,
  );

  metrics.unbilled_hours = createMetric(
    "unbilled_hours",
    currentActivity.unbilledHours,
    previousActivity.unbilledHours,
  );

  if (
    currentActivity.billableAmount !== undefined ||
    previousActivity.billableAmount !== undefined
  ) {
    metrics.billable_amount = createMetric(
      "billable_amount",
      currentActivity.billableAmount ?? 0,
      previousActivity.billableAmount ?? 0,
      currency,
    );
  }

  // Customer metrics
  metrics.new_customers = createMetric(
    "new_customers",
    currentActivity.newCustomers,
    previousActivity.newCustomers,
  );

  // Operations metrics
  metrics.receipts_matched = createMetric(
    "receipts_matched",
    currentActivity.receiptsMatched,
    previousActivity.receiptsMatched,
  );

  metrics.transactions_categorized = createMetric(
    "transactions_categorized",
    currentActivity.transactionsCategorized,
    previousActivity.transactionsCategorized,
  );

  return metrics;
}

/**
 * Format a metric value for display
 */
export function formatMetricValue(
  value: number,
  type: string,
  currency: string,
  locale = "en-US",
): string {
  const unit = getMetricUnit(type);

  switch (unit) {
    case "currency":
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);

    case "percentage":
      return `${value.toFixed(1)}%`;

    case "hours":
      return `${value.toFixed(1)}h`;

    case "months":
      return `${value.toFixed(1)} months`;

    case "count":
      return value.toLocaleString(locale);

    default:
      // Check if it looks like currency based on metric type
      if (["revenue", "expenses", "net_profit", "cash_flow"].includes(type)) {
        return new Intl.NumberFormat(locale, {
          style: "currency",
          currency,
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(value);
      }
      return value.toLocaleString(locale);
  }
}
