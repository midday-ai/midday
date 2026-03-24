/**
 * Constants and configuration for @midday/insights
 */
import type { MetricCategory, PeriodType } from "./types";

/**
 * Metric definition with display and scoring metadata
 */
export type MetricDefinition = {
  type: string;
  label: string;
  category: MetricCategory;
  priority: number; // 1 = highest priority
  unit?: "currency" | "percentage" | "hours" | "months" | "count";
  description?: string;
};

/**
 * All available metric definitions
 *
 * Priority guide for SMB owners:
 * - Priority 1: Core metrics every business owner needs (revenue, expenses, profit, runway)
 * - Priority 2: Important supporting metrics (margins, AR, time tracking)
 * - Priority 3+: Nice-to-have activity metrics
 */
export const METRIC_DEFINITIONS: MetricDefinition[] = [
  // Core financial - Revenue & Expenses (the inputs)
  {
    type: "revenue",
    label: "Revenue",
    category: "financial",
    priority: 1,
    unit: "currency",
    description: "Total income for the period",
  },
  {
    type: "expenses",
    label: "Expenses",
    category: "financial",
    priority: 1,
    unit: "currency",
    description: "Total spending for the period",
  },
  {
    type: "cash_flow",
    label: "Cash Flow",
    category: "financial",
    priority: 2,
    unit: "currency",
    description: "Net change in cash position",
  },

  // Profitability - The bottom line (separate category so it doesn't compete with revenue/expenses)
  {
    type: "net_profit",
    label: "Profit",
    category: "profitability",
    priority: 1,
    unit: "currency",
    description: "Revenue minus expenses - the bottom line",
  },
  {
    type: "profit_margin",
    label: "Profit Margin",
    category: "profitability",
    priority: 2,
    unit: "percentage",
    description: "Profit as percentage of revenue",
  },

  // Runway & sustainability
  {
    type: "runway_months",
    label: "Runway",
    category: "runway",
    priority: 1,
    unit: "months",
    description: "Months of operation at current burn rate",
  },

  // State metrics - Point-in-time values (useful for quiet weeks)
  {
    type: "cash_balance",
    label: "Cash Balance",
    category: "financial",
    priority: 2,
    unit: "currency",
    description: "Total cash across all bank accounts",
  },
  {
    type: "overdue_amount",
    label: "Overdue",
    category: "receivables",
    priority: 2,
    unit: "currency",
    description: "Total overdue invoices to collect",
  },

  // Invoice health - Money owed to you
  {
    type: "invoices_overdue",
    label: "Overdue Invoices",
    category: "invoicing",
    priority: 5, // Low priority - shown in "Needs attention" section instead
    unit: "count",
    description: "Number of unpaid invoices past due date",
  },
  {
    type: "outstanding_ar",
    label: "Outstanding",
    category: "invoicing",
    priority: 1, // High priority - money customers owe you matters
    unit: "currency",
    description: "Total accounts receivable - money owed to you",
  },
  {
    type: "invoices_sent",
    label: "Invoices Sent",
    category: "invoicing",
    priority: 3,
    unit: "count",
    description: "Invoices sent during the period",
  },
  {
    type: "invoices_paid",
    label: "Invoices Paid",
    category: "invoicing",
    priority: 3,
    unit: "count",
    description: "Invoices paid during the period",
  },

  // Customer metrics
  {
    type: "active_customers",
    label: "Active Customers",
    category: "customers",
    priority: 2,
    unit: "count",
    description: "Customers with activity this period",
  },
  {
    type: "new_customers",
    label: "New Customers",
    category: "customers",
    priority: 2,
    unit: "count",
    description: "New customers added this period",
  },

  // Time tracking
  {
    type: "hours_tracked",
    label: "Hours Tracked",
    category: "time",
    priority: 2,
    unit: "hours",
    description: "Total hours logged",
  },

  // Operations (low priority - internal bookkeeping, not key business metrics)
  {
    type: "receipts_matched",
    label: "Receipts Matched",
    category: "operations",
    priority: 5, // Very low - bookkeeping metric, not business KPI
    unit: "count",
    description: "Receipts matched to transactions",
  },
  {
    type: "transactions_categorized",
    label: "Categorized",
    category: "operations",
    priority: 5, // Very low - bookkeeping metric, not business KPI
    unit: "count",
    description: "Transactions categorized",
  },
];

/**
 * Core financial metrics that should always be considered
 */
export const CORE_FINANCIAL_METRICS = [
  "revenue",
  "net_profit",
  "cash_flow",
  "expenses",
];

/**
 * Period type display names
 */
export const PERIOD_TYPE_LABELS: Record<PeriodType, string> = {
  weekly: "Week",
  monthly: "Month",
  quarterly: "Quarter",
  yearly: "Year",
};

/**
 * Thresholds for anomaly detection
 */
export const ANOMALY_THRESHOLDS = {
  // Percentage change thresholds
  significantChange: 20,
  moderateChange: 10,
  minorChange: 5,

  // Runway warning levels (months)
  runwayUrgent: 2, // < 2 months = urgent alert with specific messaging
  runwayCritical: 3, // < 3 months = alert
  runwayWarning: 6, // < 6 months = warning

  // Cash flow warnings
  negativeCashFlow: 0,
};

/**
 * Thresholds for expense category anomaly detection
 */
export const EXPENSE_ANOMALY_THRESHOLDS = {
  // Large spike: > 50% increase AND > $100 absolute = warning
  largeSpikePercent: 50,
  largeSpikeAbsolute: 100,

  // Moderate spike: > 30% increase AND > $50 absolute = info
  moderateSpikePercent: 30,
  moderateSpikeAbsolute: 50,

  // New category thresholds
  newCategoryMinor: 50, // First-time spend > $50 = info
  newCategoryMajor: 500, // First-time spend > $500 = warning
};

/**
 * Scoring weights for metric selection
 */
export const SCORING_WEIGHTS = {
  basePriority: 25, // Max points for priority 1
  priorityDecrement: 5, // Points lost per priority level
  hasMeaningfulData: 25,
  significantChange: 20,
  moderateChange: 12,
  minorChange: 6,
  anomalyBoost: 15,
  coreMetricBoost: 10,
};

/**
 * Maximum metrics per category for diversity
 */
export const MAX_METRICS_PER_CATEGORY = 2;

/**
 * Default number of top metrics to select
 */
export const DEFAULT_TOP_METRICS_COUNT = 4;
