/**
 * Core types for the @midday/insights package
 */

export type PeriodType = "weekly" | "monthly" | "quarterly" | "yearly";

export type ChangeDirection = "up" | "down" | "flat";

export type MetricCategory =
  | "financial"
  | "runway"
  | "invoicing"
  | "customers"
  | "time"
  | "operations"
  | "growth";

export type AnomalySeverity = "info" | "warning" | "alert";

/**
 * Category spending data from getSpending query
 */
export type CategorySpending = {
  name: string;
  slug: string;
  amount: number;
  currency: string;
  color: string;
  percentage: number;
};

/**
 * Expense anomaly detected in category-level spending
 */
export type ExpenseAnomaly = {
  type: "category_spike" | "new_category" | "category_decrease";
  severity: AnomalySeverity;
  categoryName: string;
  categorySlug: string;
  currentAmount: number;
  previousAmount: number;
  change: number; // percentage change
  currency: string;
  message: string;
  tip?: string; // actionable tip for the user
};

/**
 * A calculated metric with comparison to previous period
 */
export type InsightMetric = {
  type: string;
  label: string;
  value: number;
  previousValue: number;
  change: number; // percentage
  changeDirection: ChangeDirection;
  unit?: string;
  currency?: string;
  historicalContext?: string; // "Highest since October"
};

/**
 * Detected anomaly or notable pattern
 */
export type InsightAnomaly = {
  type: string;
  severity: AnomalySeverity;
  message: string;
  metricType?: string;
};

/**
 * Achievement milestone
 */
export type InsightMilestone = {
  type: string;
  description: string;
  achievedAt: string;
};

/**
 * Business activity summary for the period
 */
export type InsightActivity = {
  invoicesSent: number;
  invoicesPaid: number;
  invoicesOverdue: number;
  overdueAmount?: number;
  hoursTracked: number;
  unbilledHours: number;
  billableAmount?: number;
  largestPayment?: { customer: string; amount: number };
  newCustomers: number;
  receiptsMatched: number;
  transactionsCategorized: number;
  upcomingInvoices?: {
    count: number;
    totalAmount: number;
    nextDueDate?: string;
    items?: Array<{
      customerName: string;
      amount: number;
      scheduledAt: string;
      frequency?: string;
    }>;
  };
};

/**
 * AI-generated content structure (relief-first approach)
 */
export type InsightContent = {
  goodNews: string;
  story: string;
  actions: Array<{
    text: string;
    type?: string;
    deepLink?: string;
  }>;
  celebration?: string;
};

/**
 * Raw metrics data fetched from database queries
 */
export type MetricData = {
  revenue: number;
  expenses: number;
  netProfit: number;
  cashFlow: number;
  profitMargin: number;
  runwayMonths: number;
  /** Per-category spending breakdown */
  categorySpending?: CategorySpending[];
};

/**
 * Parameters for generating an insight
 */
export type GenerateInsightParams = {
  teamId: string;
  periodType: PeriodType;
  periodStart: Date;
  periodEnd: Date;
  periodLabel: string;
  periodYear: number;
  periodNumber: number;
  currency: string;
};

/**
 * Period date information
 */
export type PeriodInfo = {
  periodStart: Date;
  periodEnd: Date;
  periodLabel: string;
  periodNumber: number;
  periodYear: number;
};

/**
 * Result of insight generation
 */
export type InsightGenerationResult = {
  selectedMetrics: InsightMetric[];
  allMetrics: Record<string, InsightMetric>;
  anomalies: InsightAnomaly[];
  expenseAnomalies: ExpenseAnomaly[];
  milestones: InsightMilestone[];
  activity: InsightActivity;
  content: InsightContent;
};
