import { z } from "zod";

// Import all the schemas we defined earlier
// (Assume all the schemas are defined in a file called 'schemas.ts')
import * as schemas from "./schemas";

// Define types for all the schemas

export type MonthlyExpensesByCategory = z.infer<
  typeof schemas.MonthlyExpensesByCategorySchema
>;

export type Top5MerchantsByMonthlySpend = z.infer<
  typeof schemas.Top5MerchantsByMonthlySpendSchema
>;

export type AvgTransactionAmountByCategory = z.infer<
  typeof schemas.AvgTransactionAmountByCategorySchema
>;

export type DailyExpenseTrend = z.infer<typeof schemas.DailyExpenseTrendSchema>;

export type ExpenseDistributionByPaymentChannel = z.infer<
  typeof schemas.ExpenseDistributionByPaymentChannelSchema
>;

export type LargeTransactionsAnalysis = z.infer<
  typeof schemas.LargeTransactionsAnalysisSchema
>;

export type WeeklyExpenseVolatility = z.infer<
  typeof schemas.WeeklyExpenseVolatilitySchema
>;

export type RecurringExpenseDetection = z.infer<
  typeof schemas.RecurringExpenseDetectionSchema
>;

export type ExpenseFrequencyByCategory = z.infer<
  typeof schemas.ExpenseFrequencyByCategorySchema
>;

export type WeekendWeekdaySpending = z.infer<
  typeof schemas.WeekendWeekdaySpendingSchema
>;

export type MonthlyIncomeByCategory = z.infer<
  typeof schemas.MonthlyIncomeByCategorySchema
>;

export type IncomeSourceAnalysis = z.infer<
  typeof schemas.IncomeSourceAnalysisSchema
>;

export type IncomeFrequencyAnalysis = z.infer<
  typeof schemas.IncomeFrequencyAnalysisSchema
>;

export type IncomeTrendAnalysis = z.infer<
  typeof schemas.IncomeTrendAnalysisSchema
>;

export type IncomeStabilityAnalysis = z.infer<
  typeof schemas.IncomeStabilityAnalysisSchema
>;

export type IncomeByDayOfWeek = z.infer<typeof schemas.IncomeByDayOfWeekSchema>;

export type IncomeByTimeOfDay = z.infer<typeof schemas.IncomeByTimeOfDaySchema>;

export type LargeIncomeTransactions = z.infer<
  typeof schemas.LargeIncomeTransactionsSchema
>;

export type IncomeDiversityAnalysis = z.infer<
  typeof schemas.IncomeDiversityAnalysisSchema
>;

export type IncomeByPaymentChannel = z.infer<
  typeof schemas.IncomeByPaymentChannelSchema
>;

export type IncomeSeasonalityAnalysis = z.infer<
  typeof schemas.IncomeSeasonalityAnalysisSchema
>;

export type IncomeExpenseRatio = z.infer<
  typeof schemas.IncomeExpenseRatioSchema
>;

export type IncomeForecast = z.infer<typeof schemas.IncomeForecastSchema>;

export type IncomeByLocation = z.infer<typeof schemas.IncomeByLocationSchema>;

export type IncomeVolatility = z.infer<typeof schemas.IncomeVolatilitySchema>;

export type IncomeConcentration = z.infer<
  typeof schemas.IncomeConcentrationSchema
>;

export type IncomeToGoalRatio = z.infer<typeof schemas.IncomeToGoalRatioSchema>;

export type DailyBalanceSnapshot = z.infer<
  typeof schemas.DailyBalanceSnapshotSchema
>;

export type MonthlyAverageBalance = z.infer<
  typeof schemas.MonthlyAverageBalanceSchema
>;

export type BalanceVolatilityAnalysis = z.infer<
  typeof schemas.BalanceVolatilityAnalysisSchema
>;

export type BalanceTrendAnalysis = z.infer<
  typeof schemas.BalanceTrendAnalysisSchema
>;

export type LowBalanceFrequencyAnalysis = z.infer<
  typeof schemas.LowBalanceFrequencyAnalysisSchema
>;

export type BalanceGrowthRateAnalysis = z.infer<
  typeof schemas.BalanceGrowthRateAnalysisSchema
>;

export type BalancePercentileAnalysis = z.infer<
  typeof schemas.BalancePercentileAnalysisSchema
>;

export type WeekendWeekdayBalanceAnalysis = z.infer<
  typeof schemas.WeekendWeekdayBalanceAnalysisSchema
>;

export type BalanceConsistencyScore = z.infer<
  typeof schemas.BalanceConsistencyScoreSchema
>;

export type MultiCurrencyBalanceSummary = z.infer<
  typeof schemas.MultiCurrencyBalanceSummarySchema
>;

export type MonthlyBalanceChangeByUser = z.infer<
  typeof schemas.MonthlyBalanceChangeByUserSchema
>;
