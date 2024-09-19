import { UTCDate } from "@date-fns/utc";
import { z } from "zod";
import type { Client } from "../types";

/**
 * Converts a date string to a UTCDate object.
 * @param dateString - The date string to convert.
 * @returns A UTCDate object representing the input date string.
 */
function toUTCDate(dateString: string): UTCDate {
  return new UTCDate(dateString);
}

// Base schema for common parameters
const baseQueryParamsSchema = z.object({
  teamId: z.string(),
  from: z.string(),
  to: z.string(),
  currency: z.string().optional().default("USD"),
});

// Schema for getMonthlyExpensesQuery
const getMonthlyExpensesQueryParamsSchema = baseQueryParamsSchema;

/**
 * Retrieves monthly expenses for a specified team and date range.
 * @param supabase - The Supabase client instance.
 * @param params - The parameters for the query.
 * @returns A promise that resolves to the monthly expenses data.
 */
export async function getMonthlyExpensesQuery(
  supabase: Client,
  params: z.infer<typeof getMonthlyExpensesQueryParamsSchema>
) {
  const { teamId, from, to, currency } =
    getMonthlyExpensesQueryParamsSchema.parse(params);
  return supabase.rpc("get_monthly_expenses", {
    team_id: teamId,
    start_date: toUTCDate(from).toDateString(),
    end_date: toUTCDate(to).toDateString(),
    currency: currency,
  });
}

// Schema for getExpensesByCategoryQuery
const getExpensesByCategoryQueryParamsSchema = baseQueryParamsSchema;

/**
 * Retrieves expenses by category for a specified team and date range.
 * @param supabase - The Supabase client instance.
 * @param params - The parameters for the query.
 * @returns A promise that resolves to the expenses by category data.
 */
export async function getExpensesByCategoryQuery(
  supabase: Client,
  params: z.infer<typeof getExpensesByCategoryQueryParamsSchema>
) {
  const { teamId, from, to, currency } =
    getExpensesByCategoryQueryParamsSchema.parse(params);
  return supabase.rpc("get_expenses_by_category", {
    team_id: teamId,
    start_date: toUTCDate(from).toDateString(),
    end_date: toUTCDate(to).toDateString(),
    currency: currency,
  });
}

// Schema for getDailyExpensesQuery
const getDailyExpensesQueryParamsSchema = baseQueryParamsSchema;

/**
 * Retrieves daily expenses for a specified team and date range.
 * @param supabase - The Supabase client instance.
 * @param params - The parameters for the query.
 * @returns A promise that resolves to the daily expenses data.
 */
export async function getDailyExpensesQuery(
  supabase: Client,
  params: z.infer<typeof getDailyExpensesQueryParamsSchema>
) {
  const { teamId, from, to, currency } =
    getDailyExpensesQueryParamsSchema.parse(params);
  const dailyExpenses = await supabase.rpc("get_daily_expenses", {
    team_id: teamId,
    start_date: toUTCDate(from).toDateString(),
    end_date: toUTCDate(to).toDateString(),
    currency: currency,
  });

  return dailyExpenses;
}

// Schema for getTopExpenseCategoriesQuery
const getTopExpenseCategoriesQueryParamsSchema = baseQueryParamsSchema.extend({
  limit: z.number().optional().default(5),
});

/**
 * Retrieves the top expense categories for a specified team and date range.
 * @param supabase - The Supabase client instance.
 * @param params - The parameters for the query.
 * @returns A promise that resolves to the top expense categories data.
 */
export async function getTopExpenseCategoriesQuery(
  supabase: Client,
  params: z.infer<typeof getTopExpenseCategoriesQueryParamsSchema>
) {
  const { teamId, from, to, currency, limit } =
    getTopExpenseCategoriesQueryParamsSchema.parse(params);
  return supabase.rpc("get_top_expense_categories", {
    team_id: teamId,
    start_date: toUTCDate(from).toDateString(),
    end_date: toUTCDate(to).toDateString(),
    currency: currency,
    limit_count: limit,
  });
}

// Schema for getExpensesByMerchantQuery
const getExpensesByMerchantQueryParamsSchema = baseQueryParamsSchema.extend({
  limit: z.number().optional().default(10),
});

/**
 * Retrieves expenses by merchant for a specified team and date range.
 * @param supabase - The Supabase client instance.
 * @param params - The parameters for the query.
 * @returns A promise that resolves to the expenses by merchant data.
 */
export async function getExpensesByMerchantQuery(
  supabase: Client,
  params: z.infer<typeof getExpensesByMerchantQueryParamsSchema>
) {
  const { teamId, from, to, currency, limit } =
    getExpensesByMerchantQueryParamsSchema.parse(params);
  return supabase.rpc("get_expenses_by_merchant", {
    team_id: teamId,
    start_date: toUTCDate(from).toDateString(),
    end_date: toUTCDate(to).toDateString(),
    currency: currency,
    limit_count: limit,
  });
}

// Schema for getWeeklyExpenseTrendsQuery
const getWeeklyExpenseTrendsQueryParamsSchema = baseQueryParamsSchema;

/**
 * Retrieves weekly expense trends for a specified team and date range.
 * @param supabase - The Supabase client instance.
 * @param params - The parameters for the query.
 * @returns A promise that resolves to the weekly expense trends data.
 */
export async function getWeeklyExpenseTrendsQuery(
  supabase: Client,
  params: z.infer<typeof getWeeklyExpenseTrendsQueryParamsSchema>
) {
  const { teamId, from, to, currency } =
    getWeeklyExpenseTrendsQueryParamsSchema.parse(params);
  return supabase.rpc("get_weekly_expense_trends", {
    team_id: teamId,
    start_date: toUTCDate(from).toDateString(),
    end_date: toUTCDate(to).toDateString(),
    currency: currency,
  });
}

// Schema for getExpensesByPaymentChannelQuery
const getExpensesByPaymentChannelQueryParamsSchema = baseQueryParamsSchema;

/**
 * Retrieves expenses by payment channel for a specified team and date range.
 * @param supabase - The Supabase client instance.
 * @param params - The parameters for the query.
 * @returns A promise that resolves to the expenses by payment channel data.
 */
export async function getExpensesByPaymentChannelQuery(
  supabase: Client,
  params: z.infer<typeof getExpensesByPaymentChannelQueryParamsSchema>
) {
  const { teamId, from, to, currency } =
    getExpensesByPaymentChannelQueryParamsSchema.parse(params);
  return supabase.rpc("get_expenses_by_payment_channel", {
    team_id: teamId,
    start_date: toUTCDate(from).toDateString(),
    end_date: toUTCDate(to).toDateString(),
    currency: currency,
  });
}

// Schema for getRecurringExpensesQuery
const getRecurringExpensesQueryParamsSchema = baseQueryParamsSchema.extend({
  minOccurrences: z.number().optional().default(3),
});

/**
 * Retrieves recurring expenses for a specified team and date range.
 * @param supabase - The Supabase client instance.
 * @param params - The parameters for the query.
 * @returns A promise that resolves to the recurring expenses data.
 */
export async function getRecurringExpensesQuery(
  supabase: Client,
  params: z.infer<typeof getRecurringExpensesQueryParamsSchema>
) {
  const { teamId, from, to, currency, minOccurrences } =
    getRecurringExpensesQueryParamsSchema.parse(params);
  return supabase.rpc("get_recurring_expenses", {
    team_id: teamId,
    start_date: toUTCDate(from).toDateString(),
    end_date: toUTCDate(to).toDateString(),
    currency: currency,
    min_occurrences: minOccurrences,
  });
}

// Schema for getExpenseDistributionByDayOfWeekQuery
const getExpenseDistributionByDayOfWeekQueryParamsSchema =
  baseQueryParamsSchema;

/**
 * Retrieves expense distribution by day of week for a specified team and date range.
 * @param supabase - The Supabase client instance.
 * @param params - The parameters for the query.
 * @returns A promise that resolves to the expense distribution by day of week data.
 */
export async function getExpenseDistributionByDayOfWeekQuery(
  supabase: Client,
  params: z.infer<typeof getExpenseDistributionByDayOfWeekQueryParamsSchema>
) {
  const { teamId, from, to, currency } =
    getExpenseDistributionByDayOfWeekQueryParamsSchema.parse(params);
  return supabase.rpc("get_expense_distribution_by_day_of_week", {
    team_id: teamId,
    start_date: toUTCDate(from).toDateString(),
    end_date: toUTCDate(to).toDateString(),
    currency: currency,
  });
}

// Schema for getExpenseGrowthRateQuery
const getExpenseGrowthRateQueryParamsSchema = baseQueryParamsSchema.extend({
  intervalType: z.string().optional().default("month"),
});

/**
 * Retrieves expense growth rate for a specified team and date range.
 * @param supabase - The Supabase client instance.
 * @param params - The parameters for the query.
 * @returns A promise that resolves to the expense growth rate data.
 */
export async function getExpenseGrowthRateQuery(
  supabase: Client,
  params: z.infer<typeof getExpenseGrowthRateQueryParamsSchema>
) {
  const { teamId, from, to, currency, intervalType } =
    getExpenseGrowthRateQueryParamsSchema.parse(params);
  return supabase.rpc("get_expense_growth_rate", {
    team_id: teamId,
    start_date: toUTCDate(from).toDateString(),
    end_date: toUTCDate(to).toDateString(),
    currency: currency,
    interval_type: intervalType,
  });
}

// Schema for getExpenseForecastQuery
const getExpenseForecastQueryParamsSchema = z.object({
  teamId: z.string(),
  forecastDate: z.string(),
  currency: z.string().optional().default("USD"),
  lookbackMonths: z.number().optional().default(3),
});

/**
 * Retrieves expense forecast for a specified team and forecast date.
 * @param supabase - The Supabase client instance.
 * @param params - The parameters for the query.
 * @returns A promise that resolves to the expense forecast data.
 */
export async function getExpenseForecastQuery(
  supabase: Client,
  params: z.infer<typeof getExpenseForecastQueryParamsSchema>
) {
  const { teamId, forecastDate, currency, lookbackMonths } =
    getExpenseForecastQueryParamsSchema.parse(params);
  return supabase.rpc("get_expense_forecast", {
    team_id: teamId,
    forecast_date: toUTCDate(forecastDate).toDateString(),
    currency: currency,
    lookback_months: lookbackMonths,
  });
}

// Schema for getExpenseAnomaliesQuery
const getExpenseAnomaliesQueryParamsSchema = baseQueryParamsSchema.extend({
  thresholdPercentage: z.number().optional().default(50),
});

/**
 * Retrieves expense anomalies for a specified team and date range.
 * @param supabase - The Supabase client instance.
 * @param params - The parameters for the query.
 * @returns A promise that resolves to the expense anomalies data.
 */
export async function getExpenseAnomaliesQuery(
  supabase: Client,
  params: z.infer<typeof getExpenseAnomaliesQueryParamsSchema>
) {
  const { teamId, from, to, currency, thresholdPercentage } =
    getExpenseAnomaliesQueryParamsSchema.parse(params);
  return supabase.rpc("get_expense_anomalies", {
    team_id: teamId,
    start_date: toUTCDate(from).toDateString(),
    end_date: toUTCDate(to).toDateString(),
    currency: currency,
    threshold_percentage: thresholdPercentage,
  });
}

// Schema for getExpenseTrendsByTimeOfDayQuery
const getExpenseTrendsByTimeOfDayQueryParamsSchema = baseQueryParamsSchema;

/**
 * Retrieves expense trends by time of day for a specified team and date range.
 * @param supabase - The Supabase client instance.
 * @param params - The parameters for the query.
 * @returns A promise that resolves to the expense trends by time of day data.
 */
export async function getExpenseTrendsByTimeOfDayQuery(
  supabase: Client,
  params: z.infer<typeof getExpenseTrendsByTimeOfDayQueryParamsSchema>
) {
  const { teamId, from, to, currency } =
    getExpenseTrendsByTimeOfDayQueryParamsSchema.parse(params);
  return supabase.rpc("get_expense_trends_by_time_of_day", {
    team_id: teamId,
    start_date: toUTCDate(from).toDateString(),
    end_date: toUTCDate(to).toDateString(),
    currency: currency,
  });
}

// Schema for getExpenseComparisonQuery
const getExpenseComparisonQueryParamsSchema = z.object({
  teamId: z.string(),
  currentFrom: z.string(),
  currentTo: z.string(),
  currency: z.string().optional().default("USD"),
});

/**
 * Retrieves expense comparison data for a specified team and date range.
 * @param supabase - The Supabase client instance.
 * @param params - The parameters for the query.
 * @returns A promise that resolves to the expense comparison data.
 */
export async function getExpenseComparisonQuery(
  supabase: Client,
  params: z.infer<typeof getExpenseComparisonQueryParamsSchema>
) {
  const { teamId, currentFrom, currentTo, currency } =
    getExpenseComparisonQueryParamsSchema.parse(params);
  return supabase.rpc("get_expense_comparison", {
    team_id: teamId,
    current_start_date: toUTCDate(currentFrom).toDateString(),
    current_end_date: toUTCDate(currentTo).toDateString(),
    currency: currency,
  });
}

// Schema for getExpenseByPersonalFinanceCategoryQuery
const getExpenseByPersonalFinanceCategoryQueryParamsSchema =
  baseQueryParamsSchema;

/**
 * Retrieves expenses by personal finance category for a specified team and date range.
 * @param supabase - The Supabase client instance.
 * @param params - The parameters for the query.
 * @returns A promise that resolves to the expenses by personal finance category data.
 */
export async function getExpenseByPersonalFinanceCategoryQuery(
  supabase: Client,
  params: z.infer<typeof getExpenseByPersonalFinanceCategoryQueryParamsSchema>
) {
  const { teamId, from, to, currency } =
    getExpenseByPersonalFinanceCategoryQueryParamsSchema.parse(params);
  return supabase.rpc("get_expense_by_personal_finance_category", {
    team_id: teamId,
    start_date: toUTCDate(from).toDateString(),
    end_date: toUTCDate(to).toDateString(),
    currency: currency,
  });
}

// Schema for getInventoryCostAnalysisQuery
const getInventoryCostAnalysisQueryParamsSchema = baseQueryParamsSchema;

/**
 * Retrieves inventory cost analysis data for a specified team and date range.
 * @param supabase - The Supabase client instance.
 * @param params - The parameters for the query.
 * @returns A promise that resolves to the inventory cost analysis data.
 */
export async function getInventoryCostAnalysisQuery(
  supabase: Client,
  params: z.infer<typeof getInventoryCostAnalysisQueryParamsSchema>
) {
  const { teamId, from, to, currency } =
    getInventoryCostAnalysisQueryParamsSchema.parse(params);
  return supabase.rpc("get_inventory_cost_analysis", {
    team_id: teamId,
    start_date: toUTCDate(from).toDateString(),
    end_date: toUTCDate(to).toDateString(),
    currency: currency,
  });
}

// Schema for getRentAndUtilitiesAnalysisQuery
const getRentAndUtilitiesAnalysisQueryParamsSchema = baseQueryParamsSchema;

/**
 * Retrieves rent and utilities analysis data for a specified team and date range.
 * @param supabase - The Supabase client instance.
 * @param params - The parameters for the query.
 * @returns A promise that resolves to the rent and utilities analysis data.
 */
export async function getRentAndUtilitiesAnalysisQuery(
  supabase: Client,
  params: z.infer<typeof getRentAndUtilitiesAnalysisQueryParamsSchema>
) {
  const { teamId, from, to, currency } =
    getRentAndUtilitiesAnalysisQueryParamsSchema.parse(params);
  return supabase.rpc("get_rent_and_utilities_analysis", {
    team_id: teamId,
    start_date: toUTCDate(from).toDateString(),
    end_date: toUTCDate(to).toDateString(),
    currency: currency,
  });
}

// Schema for getSalariesAndWagesAnalysisQuery
const getSalariesAndWagesAnalysisQueryParamsSchema = baseQueryParamsSchema;

/**
 * Retrieves salaries and wages analysis data for a specified team and date range.
 * @param supabase - The Supabase client instance.
 * @param params - The parameters for the query.
 * @returns A promise that resolves to the salaries and wages analysis data.
 */
export async function getSalariesAndWagesAnalysisQuery(
  supabase: Client,
  params: z.infer<typeof getSalariesAndWagesAnalysisQueryParamsSchema>
) {
  const { teamId, from, to, currency } =
    getSalariesAndWagesAnalysisQueryParamsSchema.parse(params);
  return supabase.rpc("get_salaries_and_wages_analysis", {
    team_id: teamId,
    start_date: toUTCDate(from).toDateString(),
    end_date: toUTCDate(to).toDateString(),
    currency: currency,
  });
}

// Schema for getEquipmentAndMaintenanceAnalysisQuery
const getEquipmentAndMaintenanceAnalysisQueryParamsSchema =
  baseQueryParamsSchema;

/**
 * Retrieves equipment and maintenance analysis data for a specified team and date range.
 * @param supabase - The Supabase client instance.
 * @param params - The parameters for the query.
 * @returns A promise that resolves to the equipment and maintenance analysis data.
 */
export async function getEquipmentAndMaintenanceAnalysisQuery(
  supabase: Client,
  params: z.infer<typeof getEquipmentAndMaintenanceAnalysisQueryParamsSchema>
) {
  const { teamId, from, to, currency } =
    getEquipmentAndMaintenanceAnalysisQueryParamsSchema.parse(params);
  return supabase.rpc("get_equipment_and_maintenance_analysis", {
    team_id: teamId,
    start_date: toUTCDate(from).toDateString(),
    end_date: toUTCDate(to).toDateString(),
    currency: currency,
  });
}

// Schema for getProfessionalServicesAnalysisQuery
const getProfessionalServicesAnalysisQueryParamsSchema = baseQueryParamsSchema;

/**
 * Retrieves professional services analysis data for a specified team and date range.
 * @param supabase - The Supabase client instance.
 * @param params - The parameters for the query.
 * @returns A promise that resolves to the professional services analysis data.
 */
export async function getProfessionalServicesAnalysisQuery(
  supabase: Client,
  params: z.infer<typeof getProfessionalServicesAnalysisQueryParamsSchema>
) {
  const { teamId, from, to, currency } =
    getProfessionalServicesAnalysisQueryParamsSchema.parse(params);
  return supabase.rpc("get_professional_services_analysis", {
    team_id: teamId,
    start_date: toUTCDate(from).toDateString(),
    end_date: toUTCDate(to).toDateString(),
    currency: currency,
  });
}

// Schema for getSoftwareSubscriptionAnalysisQuery
const getSoftwareSubscriptionAnalysisQueryParamsSchema = baseQueryParamsSchema;

/**
 * Retrieves software subscription analysis data for a specified team and date range.
 * @param supabase - The Supabase client instance.
 * @param params - The parameters for the query.
 * @returns A promise that resolves to the software subscription analysis data.
 */
export async function getSoftwareSubscriptionAnalysisQuery(
  supabase: Client,
  params: z.infer<typeof getSoftwareSubscriptionAnalysisQueryParamsSchema>
) {
  const { teamId, from, to, currency } =
    getSoftwareSubscriptionAnalysisQueryParamsSchema.parse(params);
  return supabase.rpc("get_software_subscription_analysis", {
    team_id: teamId,
    start_date: toUTCDate(from).toDateString(),
    end_date: toUTCDate(to).toDateString(),
    currency: currency,
  });
}

// Schema for getSupplierExpenseAnalysisQuery
const getSupplierExpenseAnalysisQueryParamsSchema = baseQueryParamsSchema;

/**
 * Retrieves supplier expense analysis data for a specified team and date range.
 * @param supabase - The Supabase client instance.
 * @param params - The parameters for the query.
 * @returns A promise that resolves to the supplier expense analysis data.
 */
export async function getSupplierExpenseAnalysisQuery(
  supabase: Client,
  params: z.infer<typeof getSupplierExpenseAnalysisQueryParamsSchema>
) {
  const { teamId, from, to, currency } =
    getSupplierExpenseAnalysisQueryParamsSchema.parse(params);
  return supabase.rpc("get_supplier_expense_analysis", {
    team_id: teamId,
    start_date: toUTCDate(from).toDateString(),
    end_date: toUTCDate(to).toDateString(),
    currency: currency,
  });
}

// Schema for getShippingLogisticsAnalysisQuery
const getShippingLogisticsAnalysisQueryParamsSchema = baseQueryParamsSchema;

/**
 * Retrieves shipping and logistics analysis data for a specified team and date range.
 * @param supabase - The Supabase client instance.
 * @param params - The parameters for the query.
 * @returns A promise that resolves to the shipping and logistics analysis data.
 */
export async function getShippingLogisticsAnalysisQuery(
  supabase: Client,
  params: z.infer<typeof getShippingLogisticsAnalysisQueryParamsSchema>
) {
  const { teamId, from, to, currency } =
    getShippingLogisticsAnalysisQueryParamsSchema.parse(params);
  return supabase.rpc("get_shipping_logistics_analysis", {
    team_id: teamId,
    start_date: toUTCDate(from).toDateString(),
    end_date: toUTCDate(to).toDateString(),
    currency: currency,
  });
}

/**
 * Zod schema for the parameters of the getExpenseBreakdownByLocationQuery function.
 */
export const GetExpenseBreakdownByLocationQueryParamsSchema = z.object({
  /** The unique identifier of the team. */
  teamId: z.string().uuid(),
  /** The start date of the query period in string format. */
  from: z.string().datetime(),
  /** The end date of the query period in string format. */
  to: z.string().datetime(),
  /** The currency to use for the expense calculations (optional). */
  currency: z.string().optional().default("USD"),
});

/**
 * Type inference from the Zod schema for the getExpenseBreakdownByLocationQuery function parameters.
 */
export type GetExpenseBreakdownByLocationQueryParams = z.infer<
  typeof GetExpenseBreakdownByLocationQueryParamsSchema
>;

/**
 * Retrieves expense breakdown by location for a specified team and date range.
 * @param supabase - The Supabase client instance.
 * @param params - The parameters for the query.
 * @returns A promise that resolves to the expense breakdown by location data.
 */
export async function getExpenseBreakdownByLocationQuery(
  supabase: Client,
  params: GetExpenseBreakdownByLocationQueryParams
) {
  const { teamId, from, to, currency } =
    GetExpenseBreakdownByLocationQueryParamsSchema.parse(params);
  return supabase.rpc("get_expense_breakdown_by_location", {
    team_id: teamId,
    start_date: toUTCDate(from).toDateString(),
    end_date: toUTCDate(to).toDateString(),
    currency: currency,
  });
}
