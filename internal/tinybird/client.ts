import { Tinybird } from "@chronark/zod-bird";
import {
  AccountBalanceHistoryInternalSchema,
  AvgTransactionAmountByCategorySchema,
  BalanceConsistencyScoreSchema,
  BalanceGrowthRateAnalysisSchema,
  BalancePercentileAnalysisSchema,
  BalanceTrendAnalysisSchema,
  BalanceVolatilityAnalysisSchema,
  DailyBalanceSnapshotSchema,
  DailyExpenseTrendSchema,
  ExpenseDistributionByPaymentChannelSchema,
  ExpenseFrequencyByCategorySchema,
  IncomeByDayOfWeekSchema,
  IncomeByLocationSchema,
  IncomeByPaymentChannelSchema,
  IncomeByTimeOfDaySchema,
  IncomeConcentrationSchema,
  IncomeDiversityAnalysisSchema,
  IncomeExpenseRatioSchema,
  IncomeForecastSchema,
  IncomeFrequencyAnalysisSchema,
  IncomeSeasonalityAnalysisSchema,
  IncomeSourceAnalysisSchema,
  IncomeStabilityAnalysisSchema,
  IncomeToGoalRatioSchema,
  IncomeTrendAnalysisSchema,
  IncomeVolatilitySchema,
  LargeIncomeTransactionsSchema,
  LargeTransactionsAnalysis,
  LowBalanceFrequencyAnalysisSchema,
  MonthlyAverageBalanceSchema,
  MonthlyBalanceChangeByUserSchema,
  MonthlyExpensesByCategorySchema,
  MonthlyIncomeByCategorySchema,
  MultiCurrencyBalanceSummarySchema,
  RecurringExpenseDetectionSchema,
  ReOccuringTransactionInternalSchema,
  Top5MerchantsByMonthlySpendSchema,
  TransactionInternalSchema,
  WeekendWeekdayBalanceAnalysisSchema,
  WeekendWeekdaySpendingSchema,
  WeeklyExpenseVolatilitySchema,
} from "@internal/zod/index";
import { Redis } from "@upstash/redis";
import { z } from "zod";

/**
 * TinybirdService class for managing Tinybird ingest endpoints and query endpoints.
 * This class provides methods to record transactions, balance history, recurring transactions,
 * and query materialized views.
 */
export class TinybirdService {
  private tb: Tinybird;
  private redis: Redis;
  private cacheTTL: number;

  // Ingest endpoints
  public recordTransactionInternal: ReturnType<
    typeof this.tb.buildIngestEndpoint
  >;
  public recordBalanceInternal: ReturnType<typeof this.tb.buildIngestEndpoint>;
  public recordRecurringTransactionInternal: ReturnType<
    typeof this.tb.buildIngestEndpoint
  >;

  // Query endpoints
  public queryMonthlyExpensesByCategory: ReturnType<typeof this.tb.buildPipe>;
  public queryTop5MerchantsByMonthlySpend: ReturnType<typeof this.tb.buildPipe>;
  public queryAvgTransactionAmountByCategory: ReturnType<
    typeof this.tb.buildPipe
  >;
  public queryDailyExpenseTrend: ReturnType<typeof this.tb.buildPipe>;
  public queryExpenseDistributionByPaymentChannel: ReturnType<
    typeof this.tb.buildPipe
  >;
  public queryLargeTransactionsAnalysis: ReturnType<typeof this.tb.buildPipe>;
  public queryWeeklyExpenseVolatility: ReturnType<typeof this.tb.buildPipe>;
  public queryRecurringExpenseDetection: ReturnType<typeof this.tb.buildPipe>;
  public queryExpenseFrequencyByCategory: ReturnType<typeof this.tb.buildPipe>;
  public queryWeekendWeekdaySpending: ReturnType<typeof this.tb.buildPipe>;
  public queryMonthlyIncomeByCategory: ReturnType<typeof this.tb.buildPipe>;
  public queryIncomeSourceAnalysis: ReturnType<typeof this.tb.buildPipe>;
  public queryIncomeFrequencyAnalysis: ReturnType<typeof this.tb.buildPipe>;
  public queryIncomeTrendAnalysis: ReturnType<typeof this.tb.buildPipe>;
  public queryIncomeStabilityAnalysis: ReturnType<typeof this.tb.buildPipe>;
  public queryIncomeByDayOfWeek: ReturnType<typeof this.tb.buildPipe>;
  public queryIncomeByTimeOfDay: ReturnType<typeof this.tb.buildPipe>;
  public queryLargeIncomeTransactions: ReturnType<typeof this.tb.buildPipe>;
  public queryIncomeDiversityAnalysis: ReturnType<typeof this.tb.buildPipe>;
  public queryIncomeByPaymentChannel: ReturnType<typeof this.tb.buildPipe>;
  public queryIncomeSeasonalityAnalysis: ReturnType<typeof this.tb.buildPipe>;
  public queryIncomeExpenseRatio: ReturnType<typeof this.tb.buildPipe>;
  public queryIncomeForecast: ReturnType<typeof this.tb.buildPipe>;
  public queryIncomeByLocation: ReturnType<typeof this.tb.buildPipe>;
  public queryIncomeVolatility: ReturnType<typeof this.tb.buildPipe>;
  public queryIncomeConcentration: ReturnType<typeof this.tb.buildPipe>;
  public queryIncomeToGoalRatio: ReturnType<typeof this.tb.buildPipe>;
  public queryDailyBalanceSnapshot: ReturnType<typeof this.tb.buildPipe>;
  public queryMonthlyAverageBalance: ReturnType<typeof this.tb.buildPipe>;
  public queryBalanceVolatilityAnalysis: ReturnType<typeof this.tb.buildPipe>;
  public queryBalanceTrendAnalysis: ReturnType<typeof this.tb.buildPipe>;
  public queryLowBalanceFrequencyAnalysis: ReturnType<typeof this.tb.buildPipe>;
  public queryBalanceGrowthRateAnalysis: ReturnType<typeof this.tb.buildPipe>;
  public queryBalancePercentileAnalysis: ReturnType<typeof this.tb.buildPipe>;
  public queryWeekendWeekdayBalanceAnalysis: ReturnType<
    typeof this.tb.buildPipe
  >;
  public queryBalanceConsistencyScore: ReturnType<typeof this.tb.buildPipe>;
  public queryMultiCurrencyBalanceSummary: ReturnType<typeof this.tb.buildPipe>;
  public queryMonthlyBalanceChangeByUser: ReturnType<typeof this.tb.buildPipe>;

  /**
   * Creates an instance of TinybirdService.
   * @param {string} token - The Tinybird API token.
   * @param {string} baseUrl - The base URL for the Tinybird API.
   */
  constructor(
    token: string,
    baseUrl: string,
    redisUrl: string,
    redisToken: string,
    cacheTTL: number = 60 * 60, // Default TTL: 1 hour (in seconds)
  ) {
    this.tb = new Tinybird({
      token: token,
      baseUrl: baseUrl,
    });

    this.redis = new Redis({
      url: redisUrl,
      token: redisToken,
    });

    this.cacheTTL = cacheTTL;

    // Initialize ingest endpoints
    this.recordTransactionInternal = this.tb.buildIngestEndpoint({
      datasource: "TransactionInternal",
      event: TransactionInternalSchema,
    });

    this.recordBalanceInternal = this.tb.buildIngestEndpoint({
      datasource: "AccountBalanceHistoryInternal",
      event: AccountBalanceHistoryInternalSchema,
    });

    this.recordRecurringTransactionInternal = this.tb.buildIngestEndpoint({
      datasource: "ReOccuringTransactionInternal",
      event: ReOccuringTransactionInternalSchema,
    });

    // Initialize query endpoints
    const baseParams = z.object({
      userId: z.string(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    });

    this.queryMonthlyExpensesByCategory = this.tb.buildPipe({
      pipe: "monthly_expenses_by_category_mv",
      parameters: baseParams,
      data: z.array(MonthlyExpensesByCategorySchema),
      opts: {
        next: {
          // cache for 15 minutes
          revalidate: 900,
        },
      },
    });

    this.queryTop5MerchantsByMonthlySpend = this.tb.buildPipe({
      pipe: "top_5_merchants_by_monthly_spend_mv",
      parameters: baseParams,
      data: z.array(Top5MerchantsByMonthlySpendSchema),
      opts: {
        next: {
          // cache for 15 minutes
          revalidate: 900,
        },
      },
    });

    this.queryAvgTransactionAmountByCategory = this.tb.buildPipe({
      pipe: "avg_transaction_amount_by_category_mv",
      parameters: baseParams,
      data: z.array(AvgTransactionAmountByCategorySchema),
      opts: {
        next: {
          // cache for 15 minutes
          revalidate: 900,
        },
      },
    });

    this.queryDailyExpenseTrend = this.tb.buildPipe({
      pipe: "daily_expense_trend_mv",
      parameters: baseParams,
      data: z.array(DailyExpenseTrendSchema),
      opts: {
        next: {
          // cache for 15 minutes
          revalidate: 900,
        },
      },
    });

    this.queryExpenseDistributionByPaymentChannel = this.tb.buildPipe({
      pipe: "expense_distribution_by_payment_channel_mv",
      parameters: baseParams,
      data: z.array(ExpenseDistributionByPaymentChannelSchema),
      opts: {
        next: {
          // cache for 15 minutes
          revalidate: 900,
        },
      },
    });

    this.queryLargeTransactionsAnalysis = this.tb.buildPipe({
      pipe: "large_transactions_analysis_mv",
      parameters: baseParams,
      data: z.array(LargeIncomeTransactionsSchema),
      opts: {
        next: {
          // cache for 15 minutes
          revalidate: 900,
        },
      },
    });

    this.queryWeeklyExpenseVolatility = this.tb.buildPipe({
      pipe: "weekly_expense_volatility_mv",
      parameters: baseParams,
      data: z.array(WeeklyExpenseVolatilitySchema),
      opts: {
        next: {
          // cache for 15 minutes
          revalidate: 900,
        },
      },
    });

    this.queryRecurringExpenseDetection = this.tb.buildPipe({
      pipe: "recurring_expense_detection_mv",
      parameters: baseParams,
      data: z.array(RecurringExpenseDetectionSchema),
      opts: {
        next: {
          // cache for 15 minutes
          revalidate: 900,
        },
      },
    });

    this.queryExpenseFrequencyByCategory = this.tb.buildPipe({
      pipe: "expense_frequency_by_category_mv",
      parameters: baseParams,
      data: z.array(ExpenseFrequencyByCategorySchema),
      opts: {
        next: {
          // cache for 15 minutes
          revalidate: 900,
        },
      },
    });

    this.queryWeekendWeekdaySpending = this.tb.buildPipe({
      pipe: "weekend_weekday_spending_mv",
      parameters: baseParams,
      data: z.array(WeekendWeekdaySpendingSchema),
      opts: {
        next: {
          // cache for 15 minutes
          revalidate: 900,
        },
      },
    });

    this.queryMonthlyIncomeByCategory = this.tb.buildPipe({
      pipe: "monthly_income_by_category_mv",
      parameters: baseParams,
      data: z.array(MonthlyIncomeByCategorySchema),
      opts: {
        next: {
          // cache for 15 minutes
          revalidate: 900,
        },
      },
    });

    this.queryIncomeSourceAnalysis = this.tb.buildPipe({
      pipe: "income_source_analysis_mv",
      parameters: baseParams,
      data: z.array(IncomeSourceAnalysisSchema),
      opts: {
        next: {
          // cache for 15 minutes
          revalidate: 900,
        },
      },
    });

    this.queryIncomeFrequencyAnalysis = this.tb.buildPipe({
      pipe: "income_frequency_analysis_mv",
      parameters: baseParams,
      data: z.array(IncomeFrequencyAnalysisSchema),
      opts: {
        next: {
          // cache for 15 minutes
          revalidate: 900,
        },
      },
    });

    this.queryIncomeTrendAnalysis = this.tb.buildPipe({
      pipe: "income_trend_analysis_mv",
      parameters: baseParams,
      data: z.array(IncomeTrendAnalysisSchema),
      opts: {
        next: {
          // cache for 15 minutes
          revalidate: 900,
        },
      },
    });

    this.queryIncomeStabilityAnalysis = this.tb.buildPipe({
      pipe: "income_stability_analysis_mv",
      parameters: baseParams,
      data: z.array(IncomeStabilityAnalysisSchema),
      opts: {
        next: {
          // cache for 15 minutes
          revalidate: 900,
        },
      },
    });

    this.queryIncomeByDayOfWeek = this.tb.buildPipe({
      pipe: "income_by_day_of_week_mv",
      parameters: baseParams,
      data: z.array(IncomeByDayOfWeekSchema),
      opts: {
        next: {
          // cache for 15 minutes
          revalidate: 900,
        },
      },
    });

    this.queryIncomeByTimeOfDay = this.tb.buildPipe({
      pipe: "income_by_time_of_day_mv",
      parameters: baseParams,
      data: z.array(IncomeByTimeOfDaySchema),
      opts: {
        next: {
          // cache for 15 minutes
          revalidate: 900,
        },
      },
    });

    this.queryLargeIncomeTransactions = this.tb.buildPipe({
      pipe: "large_income_transactions_mv",
      parameters: baseParams,
      data: z.array(LargeIncomeTransactionsSchema),
      opts: {
        next: {
          // cache for 15 minutes
          revalidate: 900,
        },
      },
    });

    this.queryIncomeDiversityAnalysis = this.tb.buildPipe({
      pipe: "income_diversity_analysis_mv",
      parameters: baseParams,
      data: z.array(IncomeDiversityAnalysisSchema),
      opts: {
        next: {
          // cache for 15 minutes
          revalidate: 900,
        },
      },
    });

    this.queryIncomeByPaymentChannel = this.tb.buildPipe({
      pipe: "income_by_payment_channel_mv",
      parameters: baseParams,
      data: z.array(IncomeByPaymentChannelSchema),
      opts: {
        next: {
          // cache for 15 minutes
          revalidate: 900,
        },
      },
    });

    this.queryIncomeSeasonalityAnalysis = this.tb.buildPipe({
      pipe: "income_seasonality_analysis_mv",
      parameters: baseParams,
      data: z.array(IncomeSeasonalityAnalysisSchema),
      opts: {
        next: {
          // cache for 15 minutes
          revalidate: 900,
        },
      },
    });

    this.queryIncomeExpenseRatio = this.tb.buildPipe({
      pipe: "income_expense_ratio_mv",
      parameters: baseParams,
      data: z.array(IncomeExpenseRatioSchema),
      opts: {
        next: {
          // cache for 15 minutes
          revalidate: 900,
        },
      },
    });

    this.queryIncomeForecast = this.tb.buildPipe({
      pipe: "income_forecast_mv",
      parameters: baseParams,
      data: z.array(IncomeForecastSchema),
      opts: {
        next: {
          // cache for 15 minutes
          revalidate: 900,
        },
      },
    });

    this.queryIncomeByLocation = this.tb.buildPipe({
      pipe: "income_by_location_mv",
      parameters: baseParams,
      data: z.array(IncomeByLocationSchema),
      opts: {
        next: {
          // cache for 15 minutes
          revalidate: 900,
        },
      },
    });

    this.queryIncomeVolatility = this.tb.buildPipe({
      pipe: "income_volatility_mv",
      parameters: baseParams,
      data: z.array(IncomeVolatilitySchema),
      opts: {
        next: {
          // cache for 15 minutes
          revalidate: 900,
        },
      },
    });

    this.queryIncomeConcentration = this.tb.buildPipe({
      pipe: "income_concentration_mv",
      parameters: baseParams,
      data: z.array(IncomeConcentrationSchema),
      opts: {
        next: {
          // cache for 15 minutes
          revalidate: 900,
        },
      },
    });

    this.queryIncomeToGoalRatio = this.tb.buildPipe({
      pipe: "income_to_goal_ratio_mv",
      parameters: baseParams,
      data: z.array(IncomeToGoalRatioSchema),
      opts: {
        next: {
          // cache for 15 minutes
          revalidate: 900,
        },
      },
    });

    this.queryDailyBalanceSnapshot = this.tb.buildPipe({
      pipe: "daily_balance_snapshot_mv",
      parameters: baseParams,
      data: z.array(DailyBalanceSnapshotSchema),
      opts: {
        next: {
          // cache for 15 minutes
          revalidate: 900,
        },
      },
    });

    this.queryMonthlyAverageBalance = this.tb.buildPipe({
      pipe: "monthly_average_balance_mv",
      parameters: baseParams,
      data: z.array(MonthlyAverageBalanceSchema),
      opts: {
        next: {
          // cache for 15 minutes
          revalidate: 900,
        },
      },
    });

    this.queryBalanceVolatilityAnalysis = this.tb.buildPipe({
      pipe: "balance_volatility_analysis_mv",
      parameters: baseParams,
      data: z.array(BalanceVolatilityAnalysisSchema),
      opts: {
        next: {
          // cache for 15 minutes
          revalidate: 900,
        },
      },
    });

    this.queryBalanceTrendAnalysis = this.tb.buildPipe({
      pipe: "balance_trend_analysis_mv",
      parameters: baseParams,
      data: z.array(BalanceTrendAnalysisSchema),
      opts: {
        next: {
          // cache for 15 minutes
          revalidate: 900,
        },
      },
    });

    this.queryLowBalanceFrequencyAnalysis = this.tb.buildPipe({
      pipe: "low_balance_frequency_analysis_mv",
      parameters: baseParams,
      data: z.array(LowBalanceFrequencyAnalysisSchema),
      opts: {
        next: {
          // cache for 15 minutes
          revalidate: 900,
        },
      },
    });

    this.queryBalanceGrowthRateAnalysis = this.tb.buildPipe({
      pipe: "balance_growth_rate_analysis_mv",
      parameters: baseParams,
      data: z.array(BalanceGrowthRateAnalysisSchema),
      opts: {
        next: {
          // cache for 15 minutes
          revalidate: 900,
        },
      },
    });

    this.queryBalancePercentileAnalysis = this.tb.buildPipe({
      pipe: "balance_percentile_analysis_mv",
      parameters: baseParams,
      data: z.array(BalancePercentileAnalysisSchema),
      opts: {
        next: {
          // cache for 15 minutes
          revalidate: 900,
        },
      },
    });

    this.queryWeekendWeekdayBalanceAnalysis = this.tb.buildPipe({
      pipe: "weekend_weekday_balance_analysis_mv",
      parameters: baseParams,
      data: z.array(WeekendWeekdayBalanceAnalysisSchema),
      opts: {
        next: {
          // cache for 15 minutes
          revalidate: 900,
        },
      },
    });

    this.queryBalanceConsistencyScore = this.tb.buildPipe({
      pipe: "balance_consistency_score_mv",
      parameters: baseParams,
      data: z.array(BalanceConsistencyScoreSchema),
      opts: {
        next: {
          // cache for 15 minutes
          revalidate: 900,
        },
      },
    });

    this.queryMultiCurrencyBalanceSummary = this.tb.buildPipe({
      pipe: "multi_currency_balance_summary_mv",
      parameters: baseParams,
      data: z.array(MultiCurrencyBalanceSummarySchema),
      opts: {
        next: {
          // cache for 15 minutes
          revalidate: 900,
        },
      },
    });

    this.queryMonthlyBalanceChangeByUser = this.tb.buildPipe({
      pipe: "monthly_balance_change_by_user_mv",
      parameters: baseParams,
      data: z.array(MonthlyBalanceChangeByUserSchema),
      opts: {
        next: {
          // cache for 15 minutes
          revalidate: 900,
        },
      },
    });
  }

  /**
   * Executes a query with caching.
   *
   * @template T - The type of the query result.
   * @param {(params: any) => Promise<T>} queryFn - The query function to execute.
   * @param {any} params - The parameters for the query function.
   * @param {string} cacheKey - The key to use for caching the result.
   * @returns {Promise<T>} The query result, either from cache or from a new query execution.
   * @private
   */
  private async cachedQuery<T>(
    queryFn: (params: any) => Promise<T>,
    params: any,
    cacheKey: string,
  ): Promise<T> {
    const cachedResult = await this.redis.get(cacheKey);
    if (cachedResult) {
      return JSON.parse(cachedResult as string) as T;
    }

    const result = await queryFn(params);
    await this.redis.set(cacheKey, JSON.stringify(result), {
      ex: this.cacheTTL,
    });
    return result;
  }

  /**
   * Clears all cached data for this service.
   *
   * @returns {Promise<void>}
   */
  async clearCache(): Promise<void> {
    const keys = await this.redis.keys("tinybird:*");
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  /**
   * Clears all cached data for a specific user.
   *
   * @param {string} userId - The ID of the user whose cache should be cleared.
   * @returns {Promise<void>}
   */
  async clearUserCache(userId: string): Promise<void> {
    const keys = await this.redis.keys(`tinybird:*:${userId}:*`);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  // Query execution methods

  /**
   * Executes a query on the MonthlyExpensesByCategory materialized view.
   * @param {string} userId - The user ID to query for.
   * @param {string} [startDate] - Optional start date for the query range.
   * @param {string} [endDate] - Optional end date for the query range.
   * @returns {Promise<Array<z.infer<typeof MonthlyExpensesByCategorySchema>>>} The query results.
   */
  async getMonthlyExpensesByCategory(
    userId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<z.infer<typeof MonthlyExpensesByCategorySchema>[]> {
    const cacheKey = `tinybird:monthlyExpenses:${userId}:${startDate}:${endDate}`;
    const result = await this.cachedQuery(
      this.queryMonthlyExpensesByCategory,
      { userId, startDate, endDate },
      cacheKey,
    );
    return result as unknown as z.infer<
      typeof MonthlyExpensesByCategorySchema
    >[];
  }

  /**
   * Executes a query on the Top5MerchantsByMonthlySpend materialized view.
   * @param {string} userId - The user ID to query for.
   * @param {string} [startDate] - Optional start date for the query range.
   * @param {string} [endDate] - Optional end date for the query range.
   * @returns {Promise<Array<z.infer<typeof Top5MerchantsByMonthlySpendSchema>>>} The query results.
   */
  async getTop5MerchantsByMonthlySpend(
    userId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<z.infer<typeof Top5MerchantsByMonthlySpendSchema>[]> {
    const cacheKey = `tinybird:top5Merchants:${userId}:${startDate}:${endDate}`;
    const result = await this.cachedQuery(
      this.queryTop5MerchantsByMonthlySpend,
      { userId, startDate, endDate },
      cacheKey,
    );
    return result as unknown as z.infer<
      typeof Top5MerchantsByMonthlySpendSchema
    >[];
  }
}

/**
 * Instance of TinybirdService configured with environment variables.
 * @type {TinybirdService}
 */
// Create and export an instance of the service
export const tinybirdService = new TinybirdService(
  process.env.TINYBIRD_API_KEY!,
  process.env.TINYBIRD_API_URL!,
  process.env.UPSTASH_REDIS_REST_URL!,
  process.env.UPSTASH_REDIS_REST_TOKEN!,
  30 * 60, // 30 minutes cache TTL
);

// Export individual ingest and query methods for convenience
export const {
  // Ingest methods
  recordTransactionInternal,
  recordBalanceInternal,
  recordRecurringTransactionInternal,

  // Query methods
  getMonthlyExpensesByCategory,
  getTop5MerchantsByMonthlySpend,
} = tinybirdService;
