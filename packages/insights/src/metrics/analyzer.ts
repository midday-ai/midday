/**
 * Smart metric selection and anomaly detection
 */
import {
  ANOMALY_THRESHOLDS,
  DEFAULT_TOP_METRICS_COUNT,
  EXPENSE_ANOMALY_THRESHOLDS,
  MAX_METRICS_PER_CATEGORY,
  SCORING_WEIGHTS,
} from "../constants";
import type {
  CategorySpending,
  ExpenseAnomaly,
  InsightAnomaly,
  InsightMetric,
} from "../types";
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
 * Categories to exclude from top metrics display
 * These are bookkeeping metrics, not business KPIs
 */
const EXCLUDED_METRIC_CATEGORIES = new Set(["operations"]);

/**
 * Specific metric types to exclude from top metrics display
 * - invoices_overdue: Point-in-time status, not period activity. Shown in "Needs attention" instead.
 */
const EXCLUDED_METRIC_TYPES = new Set(["invoices_overdue"]);

/**
 * State metrics that should be allowed even when zero (useful for quiet weeks)
 * These are point-in-time values that provide context regardless of period activity
 */
const STATE_METRICS = new Set([
  "cash_balance",
  "overdue_amount",
  "runway_months",
]);

/**
 * Select the top N most relevant metrics for display
 *
 * Strategy:
 * - Exclude bookkeeping metrics (operations category)
 * - Score all metrics
 * - Ensure diversity (max 2 from same category)
 * - Always include at least 1 core financial metric
 * - Prioritize metrics with significant changes
 * - Fill remaining slots with state metrics if needed
 */
export function selectTopMetrics(
  metrics: InsightMetric[] | Record<string, InsightMetric>,
  count: number = DEFAULT_TOP_METRICS_COUNT,
): InsightMetric[] {
  // Convert to array if object
  const metricsArray = Array.isArray(metrics)
    ? metrics
    : Object.values(metrics);

  // Filter out bookkeeping metrics, point-in-time status metrics, and zero-value metrics
  // But allow state metrics even when zero
  const businessMetrics = metricsArray.filter((m) => {
    // Exclude specific metric types
    if (EXCLUDED_METRIC_TYPES.has(m.type)) return false;
    // Exclude zero-value metrics (no activity in current or previous period)
    // BUT allow state metrics even when zero (they provide context for quiet weeks)
    if (
      m.value === 0 &&
      (m.previousValue === 0 || m.previousValue === undefined)
    ) {
      // Still include state metrics - they're useful even at zero
      if (!STATE_METRICS.has(m.type)) return false;
    }
    // Exclude operational categories
    const definition = getMetricDefinition(m.type);
    return !EXCLUDED_METRIC_CATEGORIES.has(definition?.category ?? "other");
  });

  // Score all metrics
  const scoredMetrics = businessMetrics.map((m) => ({
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

  if (!hasFinancial && businessMetrics.length > 0) {
    const financialMetric = businessMetrics.find((m) =>
      isCoreFinancialMetric(m.type),
    );
    if (financialMetric) {
      selected.pop(); // Remove lowest priority
      selected.unshift(financialMetric); // Add financial at start
    }
  }

  // Fill remaining slots with state metrics if we don't have enough
  // This ensures quiet weeks still show meaningful data
  if (selected.length < count) {
    const selectedTypes = new Set(selected.map((m) => m.type));

    // Priority order for state metric fallbacks
    const stateMetricPriority = [
      "cash_balance",
      "overdue_amount",
      "runway_months",
    ];

    for (const metricType of stateMetricPriority) {
      if (selected.length >= count) break;
      if (selectedTypes.has(metricType)) continue;

      const stateMetric = metricsArray.find((m) => m.type === metricType);
      if (stateMetric) {
        selected.push(stateMetric);
        selectedTypes.add(metricType);
      }
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

    // Low runway warning with escalating urgency
    if (
      metric.type === "runway_months" &&
      metric.value < ANOMALY_THRESHOLDS.runwayWarning
    ) {
      let message: string;
      let severity: "info" | "warning" | "alert";

      if (metric.value < ANOMALY_THRESHOLDS.runwayUrgent) {
        // < 2 months = urgent alert
        severity = "alert";
        message = `URGENT: Only ${metric.value.toFixed(1)} months of runway remaining — prioritize collecting receivables and securing new revenue`;
      } else if (metric.value < ANOMALY_THRESHOLDS.runwayCritical) {
        // < 3 months = alert
        severity = "alert";
        message = `Runway is ${metric.value.toFixed(1)} months — focus on cash collection and revenue`;
      } else {
        // < 6 months = warning
        severity = "warning";
        message = `Runway is ${metric.value.toFixed(1)} months`;
      }

      anomalies.push({
        type: "low_runway",
        severity,
        message,
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

/**
 * Generate actionable tip based on category
 */
function getTipForCategory(categorySlug: string, isNew: boolean): string {
  if (isNew) {
    return "Review this new expense category to ensure it's expected.";
  }

  const tips: Record<string, string> = {
    software: "Review recent subscription signups or renewals.",
    subscriptions: "Check for new or upgraded subscriptions.",
    office: "Verify office supply orders are necessary.",
    travel: "Review travel bookings and reimbursements.",
    meals: "Check team meal and entertainment expenses.",
    marketing: "Review campaign spending and ROI.",
    advertising: "Evaluate ad performance vs spend increase.",
    equipment: "Verify equipment purchases were approved.",
    utilities: "Check for rate changes or usage spikes.",
    rent: "Review lease terms if rent increased.",
    professional: "Verify consulting or legal fees.",
    insurance: "Check for policy changes or renewals.",
  };

  return tips[categorySlug] ?? "Review recent transactions in this category.";
}

/**
 * Categories that are typically periodic (monthly, quarterly, annual)
 * and shouldn't trigger spike alerts since variability is expected
 */
const PERIODIC_EXPENSE_CATEGORIES = new Set([
  // Payroll & taxes (often paid on specific schedules)
  "payroll",
  "payroll_tax",
  "payroll-tax",
  "payroll_tax_remittances",
  "payroll-tax-remittances",
  "taxes",
  "tax",
  "income_tax",
  "sales_tax",
  // Insurance (typically annual or quarterly)
  "insurance",
  "capital_insurance",
  "capital-insurance",
  "health_insurance",
  "liability_insurance",
  // Subscriptions & memberships (can vary by billing cycle)
  "subscriptions",
  "memberships",
  "software",
  "saas",
  // Communications (often billed irregularly or with usage spikes)
  "telephone",
  "phone",
  "internet",
  "internet-and-telephone",
  "communications",
  // Banking & fees (vary by transaction volume)
  "fees",
  "bank_fees",
  "bank-fees",
  "transaction_fees",
  "payment_processing",
  // Rent & utilities (generally stable but can have seasonal variation)
  "rent",
  "utilities",
  // Uncategorized (too noisy, user should categorize)
  "uncategorized",
]);

/**
 * Check if a category matches any periodic category pattern
 * Checks both slug and name for flexibility
 */
function isPeriodicCategory(slug: string, name?: string): boolean {
  const normalizedSlug = slug.toLowerCase().replace(/[-_\s]/g, "_");
  const normalizedName = name?.toLowerCase().replace(/[-_\s]/g, "_") ?? "";

  // Direct match on slug
  if (PERIODIC_EXPENSE_CATEGORIES.has(normalizedSlug)) return true;

  // Check for partial matches in slug or name
  for (const periodic of PERIODIC_EXPENSE_CATEGORIES) {
    if (
      normalizedSlug.includes(periodic) ||
      periodic.includes(normalizedSlug) ||
      normalizedName.includes(periodic) ||
      periodic.includes(normalizedName)
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Detect anomalies in category-level spending
 *
 * Detection rules:
 * - Large spike: > 50% increase AND > $100 absolute = warning
 * - Moderate spike: > 30% increase AND > $50 absolute = info
 * - New category: First-time spend > $50 = info, > $500 = warning
 * - Significant decrease: > 50% decrease = info (good news, not warning)
 * - Periodic categories (payroll, insurance, etc.) are excluded from alerts
 */
export function detectExpenseAnomalies(
  currentSpending: CategorySpending[],
  previousSpending: CategorySpending[],
  currency: string,
): ExpenseAnomaly[] {
  const anomalies: ExpenseAnomaly[] = [];

  // Create a map of previous spending by slug for quick lookup
  const previousMap = new Map<string, CategorySpending>();
  for (const cat of previousSpending) {
    previousMap.set(cat.slug, cat);
  }

  // Check each current category
  for (const current of currentSpending) {
    // Skip periodic categories - their variability is expected
    if (isPeriodicCategory(current.slug, current.name)) {
      continue;
    }

    const previous = previousMap.get(current.slug);

    if (!previous) {
      // New category - first time spending
      if (current.amount >= EXPENSE_ANOMALY_THRESHOLDS.newCategoryMajor) {
        anomalies.push({
          type: "new_category",
          severity: "warning",
          categoryName: current.name,
          categorySlug: current.slug,
          currentAmount: current.amount,
          previousAmount: 0,
          change: 100,
          currency,
          message: `New expense category: ${current.name}`,
          tip: getTipForCategory(current.slug, true),
        });
      } else if (
        current.amount >= EXPENSE_ANOMALY_THRESHOLDS.newCategoryMinor
      ) {
        anomalies.push({
          type: "new_category",
          severity: "info",
          categoryName: current.name,
          categorySlug: current.slug,
          currentAmount: current.amount,
          previousAmount: 0,
          change: 100,
          currency,
          message: `New expense category: ${current.name}`,
          tip: getTipForCategory(current.slug, true),
        });
      }
    } else {
      // Existing category - check for significant changes
      const absoluteChange = current.amount - previous.amount;
      const percentChange =
        previous.amount > 0
          ? ((current.amount - previous.amount) / previous.amount) * 100
          : current.amount > 0
            ? 100
            : 0;

      // Large spike: > 50% increase AND > $100
      if (
        percentChange >= EXPENSE_ANOMALY_THRESHOLDS.largeSpikePercent &&
        absoluteChange >= EXPENSE_ANOMALY_THRESHOLDS.largeSpikeAbsolute
      ) {
        anomalies.push({
          type: "category_spike",
          severity: "warning",
          categoryName: current.name,
          categorySlug: current.slug,
          currentAmount: current.amount,
          previousAmount: previous.amount,
          change: Math.round(percentChange),
          currency,
          message: `${current.name} increased ${Math.round(percentChange)}%`,
          tip: getTipForCategory(current.slug, false),
        });
      }
      // Moderate spike: > 30% increase AND > $50
      else if (
        percentChange >= EXPENSE_ANOMALY_THRESHOLDS.moderateSpikePercent &&
        absoluteChange >= EXPENSE_ANOMALY_THRESHOLDS.moderateSpikeAbsolute
      ) {
        anomalies.push({
          type: "category_spike",
          severity: "info",
          categoryName: current.name,
          categorySlug: current.slug,
          currentAmount: current.amount,
          previousAmount: previous.amount,
          change: Math.round(percentChange),
          currency,
          message: `${current.name} increased ${Math.round(percentChange)}%`,
          tip: getTipForCategory(current.slug, false),
        });
      }
      // Significant decrease (> 50%) - could be good news
      else if (
        percentChange <= -EXPENSE_ANOMALY_THRESHOLDS.largeSpikePercent &&
        Math.abs(absoluteChange) >=
          EXPENSE_ANOMALY_THRESHOLDS.largeSpikeAbsolute
      ) {
        anomalies.push({
          type: "category_decrease",
          severity: "info",
          categoryName: current.name,
          categorySlug: current.slug,
          currentAmount: current.amount,
          previousAmount: previous.amount,
          change: Math.round(percentChange),
          currency,
          message: `${current.name} decreased ${Math.round(Math.abs(percentChange))}%`,
        });
      }
    }
  }

  // Sort by severity (warning first) then by absolute change amount
  anomalies.sort((a, b) => {
    const severityOrder = { alert: 0, warning: 1, info: 2 };
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) return severityDiff;

    // Then by absolute amount change
    const aChange = Math.abs(a.currentAmount - a.previousAmount);
    const bChange = Math.abs(b.currentAmount - b.previousAmount);
    return bChange - aChange;
  });

  // Limit to top 3 most significant anomalies to avoid overwhelming
  return anomalies.slice(0, 3);
}
