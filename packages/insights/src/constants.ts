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
 */
export const METRIC_DEFINITIONS: MetricDefinition[] = [
  // Core financial (always candidates)
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
    type: "net_profit",
    label: "Net Profit",
    category: "financial",
    priority: 1,
    unit: "currency",
    description: "Revenue minus expenses",
  },
  {
    type: "cash_flow",
    label: "Cash Flow",
    category: "financial",
    priority: 1,
    unit: "currency",
    description: "Net change in cash position",
  },
  {
    type: "profit_margin",
    label: "Profit Margin",
    category: "financial",
    priority: 2,
    unit: "percentage",
    description: "Profit as percentage of revenue",
  },

  // Runway & sustainability
  {
    type: "runway_months",
    label: "Runway",
    category: "runway",
    priority: 2,
    unit: "months",
    description: "Months of operation at current burn rate",
  },

  // Invoice health
  {
    type: "invoices_overdue",
    label: "Overdue Invoices",
    category: "invoicing",
    priority: 1,
    unit: "count",
    description: "Number of unpaid invoices past due date",
  },
  {
    type: "outstanding_ar",
    label: "Outstanding AR",
    category: "invoicing",
    priority: 2,
    unit: "currency",
    description: "Total accounts receivable",
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
  {
    type: "unbilled_hours",
    label: "Unbilled Hours",
    category: "time",
    priority: 2,
    unit: "hours",
    description: "Hours not yet invoiced",
  },
  {
    type: "billable_amount",
    label: "Billable Amount",
    category: "time",
    priority: 2,
    unit: "currency",
    description: "Value of unbilled work",
  },

  // Operations
  {
    type: "receipts_matched",
    label: "Receipts Matched",
    category: "operations",
    priority: 3,
    unit: "count",
    description: "Receipts matched to transactions",
  },
  {
    type: "transactions_categorized",
    label: "Categorized",
    category: "operations",
    priority: 3,
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
  runwayCritical: 3,
  runwayWarning: 6,

  // Cash flow warnings
  negativeCashFlow: 0,
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
