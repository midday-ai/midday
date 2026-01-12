/**
 * @midday/insights - AI-powered business insights generation
 *
 * This package provides:
 * - Smart metric selection and analysis
 * - AI-powered content generation
 * - Period date utilities
 * - Type definitions for insights
 */
import type { Database } from "@midday/db/client";
import {
  getCashFlow,
  getInsightActivityData,
  getOverdueInvoicesAlert,
  getProfit,
  getRevenue,
  getRunway,
  getSpending,
  getSpendingForPeriod,
  getUpcomingDueRecurringByTeam,
} from "@midday/db/queries";
import {
  ContentGenerator,
  type ContentGeneratorOptions,
} from "./content/generator";
import {
  addActivityMetrics,
  calculateAllMetrics,
  createMetric,
  detectAnomalies,
  detectExpenseAnomalies,
  selectTopMetrics,
} from "./metrics";
import {
  formatDateForQuery,
  getPreviousCompletePeriod,
  getPreviousPeriod,
} from "./period";
import type {
  ExpenseAnomaly,
  GenerateInsightParams,
  InsightActivity,
  InsightAnomaly,
  InsightContent,
  InsightGenerationResult,
  InsightMetric,
  MetricData,
  PeriodInfo,
  PeriodType,
} from "./types";

export type InsightsServiceOptions = {
  model?: string;
};

/**
 * Main service class for generating business insights
 */
export class InsightsService {
  private db: Database;
  private contentGenerator: ContentGenerator;

  constructor(db: Database, options: InsightsServiceOptions = {}) {
    this.db = db;
    this.contentGenerator = new ContentGenerator({
      model: options.model,
    });
  }

  /**
   * Generate a complete insight for a team and period
   */
  async generateInsight(
    params: GenerateInsightParams,
  ): Promise<InsightGenerationResult> {
    const {
      teamId,
      periodType,
      periodStart,
      periodEnd,
      periodLabel,
      periodYear,
      periodNumber,
      currency,
    } = params;

    // Create period info
    const currentPeriod: PeriodInfo = {
      periodStart,
      periodEnd,
      periodLabel,
      periodYear,
      periodNumber,
    };

    // Get previous period for comparison
    const previousPeriod = getPreviousPeriod(periodType, currentPeriod);

    // Fetch all data in parallel
    const [currentMetrics, previousMetrics, currentActivity, previousActivity] =
      await Promise.all([
        this.fetchMetricData(teamId, currentPeriod, currency),
        this.fetchMetricData(teamId, previousPeriod, currency),
        this.fetchActivityData(teamId, currentPeriod, currency),
        this.fetchActivityData(teamId, previousPeriod, currency),
      ]);

    // Calculate all metrics
    let allMetrics = calculateAllMetrics(
      currentMetrics,
      previousMetrics,
      currency,
    );

    // Add activity-based metrics
    allMetrics = addActivityMetrics(
      allMetrics,
      currentActivity,
      previousActivity,
      currency,
    );

    // Select top metrics
    const selectedMetrics = selectTopMetrics(allMetrics);

    // Detect anomalies
    const anomalies = detectAnomalies(allMetrics);

    // Detect expense category anomalies
    const expenseAnomalies = detectExpenseAnomalies(
      currentMetrics.categorySpending ?? [],
      previousMetrics.categorySpending ?? [],
      currency,
    );

    // Build activity summary
    const activity = await this.buildActivitySummary(
      teamId,
      currentPeriod,
      currency,
      currentActivity,
    );

    // Generate AI content
    const content = await this.contentGenerator.generate(
      selectedMetrics,
      anomalies,
      activity,
      periodLabel,
      periodType,
      currency,
      expenseAnomalies,
    );

    return {
      selectedMetrics,
      allMetrics,
      anomalies,
      expenseAnomalies,
      milestones: [], // TODO: Implement milestone detection
      activity,
      content,
    };
  }

  /**
   * Fetch financial metric data for a period
   */
  private async fetchMetricData(
    teamId: string,
    period: PeriodInfo,
    currency: string,
  ): Promise<MetricData> {
    const from = formatDateForQuery(period.periodStart);
    const to = formatDateForQuery(period.periodEnd);

    const [
      revenueData,
      profitData,
      cashFlowData,
      spendingData,
      runwayData,
      categorySpendingData,
    ] = await Promise.all([
      getRevenue(this.db, { teamId, from, to, currency }).catch(() => []),
      getProfit(this.db, { teamId, from, to, currency }).catch(() => []),
      getCashFlow(this.db, { teamId, from, to, currency }).catch(() => null),
      getSpendingForPeriod(this.db, { teamId, from, to, currency }).catch(
        () => null,
      ),
      getRunway(this.db, { teamId, from, to, currency }).catch(() => 0),
      getSpending(this.db, { teamId, from, to, currency }).catch(() => []),
    ]);

    // Sum up monthly values for revenue
    const revenueTotal = Array.isArray(revenueData)
      ? revenueData.reduce((sum, item) => sum + Number(item.value || 0), 0)
      : 0;

    // Sum up monthly values for profit
    const profitTotal = Array.isArray(profitData)
      ? profitData.reduce((sum, item) => sum + Number(item.value || 0), 0)
      : 0;

    // Get cash flow values
    const cashIn = cashFlowData?.summary?.totalIncome ?? 0;
    const cashOut = cashFlowData?.summary?.totalExpenses ?? 0;
    const netCashFlow = cashIn - cashOut;

    // Get expenses from spending
    const expenses = spendingData?.totalSpending ?? 0;

    // Calculate profit margin
    const profitMargin =
      revenueTotal > 0 ? (profitTotal / revenueTotal) * 100 : 0;

    return {
      revenue: revenueTotal,
      expenses,
      netProfit: profitTotal,
      cashFlow: netCashFlow,
      profitMargin,
      runwayMonths: typeof runwayData === "number" ? runwayData : 0,
      categorySpending: categorySpendingData,
    };
  }

  /**
   * Fetch activity data for a period
   */
  private async fetchActivityData(
    teamId: string,
    period: PeriodInfo,
    currency: string,
  ): Promise<{
    invoicesSent: number;
    invoicesPaid: number;
    invoicesOverdue: number;
    hoursTracked: number;
    unbilledHours: number;
    billableAmount?: number;
    largestPayment?: { customer: string; amount: number };
    newCustomers: number;
    receiptsMatched: number;
    transactionsCategorized: number;
  }> {
    const from = formatDateForQuery(period.periodStart);
    const to = formatDateForQuery(period.periodEnd);

    const activityData = await getInsightActivityData(this.db, {
      teamId,
      from,
      to,
      currency,
    }).catch(() => null);

    return {
      invoicesSent: activityData?.invoicesSent ?? 0,
      invoicesPaid: activityData?.invoicesPaid ?? 0,
      invoicesOverdue: 0, // Fetched separately for current only
      hoursTracked: activityData?.hoursTracked ?? 0,
      unbilledHours: activityData?.unbilledHours ?? 0,
      billableAmount: activityData?.billableAmount,
      largestPayment: activityData?.largestPayment,
      newCustomers: activityData?.newCustomers ?? 0,
      receiptsMatched: activityData?.receiptsMatched ?? 0,
      transactionsCategorized: activityData?.transactionsCategorized ?? 0,
    };
  }

  /**
   * Build the complete activity summary including overdue and upcoming invoices
   */
  private async buildActivitySummary(
    teamId: string,
    period: PeriodInfo,
    currency: string,
    activityData: {
      invoicesSent: number;
      invoicesPaid: number;
      invoicesOverdue: number;
      hoursTracked: number;
      unbilledHours: number;
      billableAmount?: number;
      largestPayment?: { customer: string; amount: number };
      newCustomers: number;
      receiptsMatched: number;
      transactionsCategorized: number;
    },
  ): Promise<InsightActivity> {
    // Fetch overdue and upcoming invoices
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const [overdueData, upcomingRecurring] = await Promise.all([
      getOverdueInvoicesAlert(this.db, { teamId, currency }).catch(() => null),
      getUpcomingDueRecurringByTeam(this.db, {
        teamId,
        before: sevenDaysFromNow,
      }).catch(() => []),
    ]);

    // Build upcoming invoices summary
    type UpcomingInvoice = (typeof upcomingRecurring)[number];
    const upcomingInvoices =
      upcomingRecurring.length > 0
        ? {
            count: upcomingRecurring.length,
            totalAmount: upcomingRecurring.reduce(
              (sum: number, inv: UpcomingInvoice) => sum + (inv.amount ?? 0),
              0,
            ),
            nextDueDate: upcomingRecurring[0]?.nextScheduledAt ?? undefined,
            items: upcomingRecurring.map((inv: UpcomingInvoice) => ({
              customerName: inv.customerName ?? "Unknown",
              amount: inv.amount ?? 0,
              scheduledAt: inv.nextScheduledAt ?? "",
              frequency: inv.frequency ?? undefined,
            })),
          }
        : undefined;

    return {
      invoicesSent: activityData.invoicesSent,
      invoicesPaid: activityData.invoicesPaid,
      invoicesOverdue: overdueData?.summary?.count ?? 0,
      overdueAmount: overdueData?.summary?.totalAmount ?? 0,
      hoursTracked: activityData.hoursTracked,
      unbilledHours: activityData.unbilledHours,
      billableAmount: activityData.billableAmount,
      largestPayment: activityData.largestPayment,
      newCustomers: activityData.newCustomers,
      receiptsMatched: activityData.receiptsMatched,
      transactionsCategorized: activityData.transactionsCategorized,
      upcomingInvoices,
    };
  }
}

/**
 * Create an InsightsService instance
 */
export function createInsightsService(
  db: Database,
  options?: InsightsServiceOptions,
): InsightsService {
  return new InsightsService(db, options);
}

/**
 * Get the list of team IDs enabled for insights generation.
 * Returns undefined if all teams should receive insights.
 * Returns empty array if no teams are configured (safe default).
 */
export function getEnabledTeamIds(): string[] | undefined {
  const envValue = process.env.INSIGHTS_ENABLED_TEAM_IDS;

  // Not set = disabled (safe default for staging)
  if (!envValue) {
    return [];
  }

  // "*" = all teams enabled
  if (envValue.trim() === "*") {
    return undefined;
  }

  // Parse comma-separated list
  return envValue
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

/**
 * Check if a specific team is enabled for insights generation.
 */
export function isTeamEnabledForInsights(teamId: string): boolean {
  const enabledIds = getEnabledTeamIds();

  // undefined = all teams enabled
  if (enabledIds === undefined) {
    return true;
  }

  // Empty array = no teams enabled
  if (enabledIds.length === 0) {
    return false;
  }

  return enabledIds.includes(teamId);
}

// Re-export all types
export type {
  AnomalySeverity,
  CategorySpending,
  ChangeDirection,
  ExpenseAnomaly,
  GenerateInsightParams,
  InsightActivity,
  InsightAnomaly,
  InsightContent,
  InsightGenerationResult,
  InsightMetric,
  InsightMilestone,
  MetricCategory,
  MetricData,
  PeriodInfo,
  PeriodType,
} from "./types";

// Re-export constants
export {
  ANOMALY_THRESHOLDS,
  CORE_FINANCIAL_METRICS,
  DEFAULT_TOP_METRICS_COUNT,
  EXPENSE_ANOMALY_THRESHOLDS,
  MAX_METRICS_PER_CATEGORY,
  type MetricDefinition,
  METRIC_DEFINITIONS,
  PERIOD_TYPE_LABELS,
  SCORING_WEIGHTS,
} from "./constants";

// Re-export metrics utilities
export {
  addActivityMetrics,
  calculateAllMetrics,
  calculatePercentageChange,
  createMetric,
  detectAnomalies,
  detectExpenseAnomalies,
  formatMetricValue,
  getChangeDirection,
  getMetricDefinition,
  getMetricLabel,
  getMetricPriority,
  getMetricsByCategory,
  getMetricUnit,
  isCoreFinancialMetric,
  selectTopMetrics,
} from "./metrics";

// Re-export period utilities
export {
  formatDateForQuery,
  formatDateForStorage,
  getCurrentPeriod,
  getPeriodInfo,
  getPeriodLabel,
  getPreviousCompletePeriod,
  getPreviousPeriod,
} from "./period";

// Re-export content utilities
export {
  ContentGenerator,
  type ContentGeneratorOptions,
  createContentGenerator,
} from "./content";
