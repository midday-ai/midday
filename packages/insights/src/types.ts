/**
 * Core types for the @midday/insights package
 */

// Import and re-export InsightPredictions from schema (single source of truth)
import type { InsightPredictions } from "@midday/db/schema";
export type { InsightPredictions };

export type PeriodType = "weekly" | "monthly" | "quarterly" | "yearly";

export type ChangeDirection = "up" | "down" | "flat";

export type MetricCategory =
  | "financial"
  | "profitability"
  | "runway"
  | "invoicing"
  | "receivables"
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
  changeDescription?: string; // User-friendly: "up 50%" or "break-even this week"
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
 * Overdue invoice - money owed by a client that's past due date
 */
export type OverdueInvoiceDetail = {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail?: string;
  amount: number;
  currency: string;
  dueDate: string;
  daysOverdue: number;
  // Payment behavior anomaly detection
  typicalPayDays?: number;
  isUnusual?: boolean;
  unusualReason?: string;
};

/**
 * Draft invoice ready to send to a client (potential revenue)
 */
export type DraftInvoiceDetail = {
  id: string;
  invoiceNumber?: string;
  customerName: string;
  amount: number;
  currency: string;
  createdAt: string;
};

/**
 * "Money on the Table" - revenue waiting to be collected
 */
export type MoneyOnTable = {
  totalAmount: number;
  currency: string;
  overdueInvoices: OverdueInvoiceDetail[];
  draftInvoices: DraftInvoiceDetail[];
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
  largestPayment?: { customer: string; amount: number };
  newCustomers: number;
  receiptsMatched: number;
  transactionsCategorized: number;
  /** Recurring invoices scheduled to go out to clients (expected revenue) */
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
  /** Detailed "money on table" data for specific names/amounts */
  moneyOnTable?: MoneyOnTable;
  /** Comparison and momentum context for richer narratives */
  context?: InsightContext;
};

/**
 * Comparison and momentum context for richer narratives
 */
export type InsightContext = {
  /** Rolling averages from past weeks */
  rollingAverage?: {
    revenue: number;
    expenses: number;
    profit: number;
    weeksIncluded: number;
  };
  /** Current week vs rolling average */
  comparison?: {
    revenueVsAvg: number; // percentage above/below average
    description: string; // "20% above your usual"
  };
  /** Consecutive week patterns */
  streak?: {
    type:
      | "revenue_growth"
      | "revenue_decline"
      | "profitable"
      | "invoices_paid_on_time";
    count: number;
    description: string; // "3 consecutive growth weeks"
  };
};

/**
 * AI-generated content structure
 * "What Matters Now" format - action-first, specific names/amounts
 */
export type InsightContent = {
  title: string; // Short hook for widget cards (15-20 words)
  summary: string; // Detailed description with metrics for insight view (25-40 words)
  story: string; // 2-3 sentences adding context, patterns, implications
  actions: Array<{
    text: string;
    type?: string;
    entityType?: "invoice" | "project" | "customer" | "transaction";
    entityId?: string;
  }>;
  /** AI-generated script optimized for text-to-speech (natural spoken delivery) */
  audioScript?: string;
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
  /** Total cash across all bank accounts */
  cashBalance: number;
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
  /** Owner's locale for formatting (e.g., "en", "sv", "de") */
  locale?: string;
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

// InsightPredictions is defined in @midday/db/schema - import from there

/**
 * Context from previous week's predictions for follow-through
 */
export type PreviousPredictionsContext = {
  invoicesDue?: {
    predicted: number;
    currency: string;
  };
  streakAtRisk?: {
    type: string;
    count: number;
  };
};

/**
 * Momentum and recovery context
 */
export type MomentumContext = {
  momentum?: "accelerating" | "steady" | "decelerating";
  currentGrowthRate?: number;
  previousGrowthRate?: number;
  recovery?: {
    isRecovery: boolean;
    downWeeksBefore: number;
    strength?: "strong" | "moderate" | "mild";
    description?: string;
  };
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
  /** Forward-looking predictions for next week's follow-through */
  predictions?: InsightPredictions;
  /** Context from previous predictions for follow-through narrative */
  previousPredictions?: PreviousPredictionsContext;
  /** Momentum and recovery context */
  momentumContext?: MomentumContext;
};
