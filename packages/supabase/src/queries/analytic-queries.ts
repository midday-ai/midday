import { UTCDate } from "@date-fns/utc";
import {
  addDays,
  endOfMonth,
  isWithinInterval,
  startOfMonth,
  subYears,
} from "date-fns";
import type { Client } from "../types";

// Helper function to convert date strings to UTCDate
function toUTCDate(dateString: string): UTCDate {
  return new UTCDate(dateString);
}

// 1. Monthly Expenses Query
export type GetMonthlyExpensesQueryParams = {
  teamId: string;
  from: string;
  to: string;
  currency?: string;
};

export async function getMonthlyExpensesQuery(
  supabase: Client,
  params: GetMonthlyExpensesQueryParams
) {
  const { teamId, from, to, currency } = params;
  return supabase.rpc("get_monthly_expenses", {
    team_id: teamId,
    start_date: toUTCDate(from).toDateString(),
    end_date: toUTCDate(to).toDateString(),
    currency: currency,
  });
}

// 2. Expenses by Category Query
export type GetExpensesByCategoryQueryParams = {
  teamId: string;
  from: string;
  to: string;
  currency?: string;
};

export async function getExpensesByCategoryQuery(
  supabase: Client,
  params: GetExpensesByCategoryQueryParams
) {
  const { teamId, from, to, currency } = params;
  return supabase.rpc("get_expenses_by_category", {
    team_id: teamId,
    start_date: toUTCDate(from).toDateString(),
    end_date: toUTCDate(to).toDateString(),
    currency: currency,
  });
}

// 3. Daily Expenses Query
export type GetDailyExpensesQueryParams = {
  teamId: string;
  from: string;
  to: string;
  currency?: string;
};

export async function getDailyExpensesQuery(
  supabase: Client,
  params: GetDailyExpensesQueryParams
) {
  const { teamId, from, to, currency } = params;
  return supabase.rpc("get_daily_expenses", {
    team_id: teamId,
    start_date: toUTCDate(from).toDateString(),
    end_date: toUTCDate(to).toDateString(),
    currency: currency,
  });
}

// 4. Top Expense Categories Query
export type GetTopExpenseCategoriesQueryParams = {
  teamId: string;
  from: string;
  to: string;
  currency?: string;
  limit?: number;
};

export async function getTopExpenseCategoriesQuery(
  supabase: Client,
  params: GetTopExpenseCategoriesQueryParams
) {
  const { teamId, from, to, currency, limit = 5 } = params;
  return supabase.rpc("get_top_expense_categories", {
    team_id: teamId,
    start_date: toUTCDate(from).toDateString(),
    end_date: toUTCDate(to).toDateString(),
    currency: currency,
    limit_count: limit,
  });
}

// 5. Expenses by Merchant Query
export type GetExpensesByMerchantQueryParams = {
  teamId: string;
  from: string;
  to: string;
  currency?: string;
  limit?: number;
};

export async function getExpensesByMerchantQuery(
  supabase: Client,
  params: GetExpensesByMerchantQueryParams
) {
  const { teamId, from, to, currency, limit = 10 } = params;
  return supabase.rpc("get_expenses_by_merchant", {
    team_id: teamId,
    start_date: toUTCDate(from).toDateString(),
    end_date: toUTCDate(to).toDateString(),
    currency: currency,
    limit_count: limit,
  });
}

// 6. Weekly Expense Trends Query
export type GetWeeklyExpenseTrendsQueryParams = {
  teamId: string;
  from: string;
  to: string;
  currency?: string;
};

export async function getWeeklyExpenseTrendsQuery(
  supabase: Client,
  params: GetWeeklyExpenseTrendsQueryParams
) {
  const { teamId, from, to, currency } = params;
  return supabase.rpc("get_weekly_expense_trends", {
    team_id: teamId,
    start_date: toUTCDate(from).toDateString(),
    end_date: toUTCDate(to).toDateString(),
    currency: currency,
  });
}

// 7. Expenses by Payment Channel Query
export type GetExpensesByPaymentChannelQueryParams = {
  teamId: string;
  from: string;
  to: string;
  currency?: string;
};

export async function getExpensesByPaymentChannelQuery(
  supabase: Client,
  params: GetExpensesByPaymentChannelQueryParams
) {
  const { teamId, from, to, currency } = params;
  return supabase.rpc("get_expenses_by_payment_channel", {
    team_id: teamId,
    start_date: toUTCDate(from).toDateString(),
    end_date: toUTCDate(to).toDateString(),
    currency: currency,
  });
}

// 8. Recurring Expenses Query
export type GetRecurringExpensesQueryParams = {
  teamId: string;
  from: string;
  to: string;
  currency?: string;
  minOccurrences?: number;
};

export async function getRecurringExpensesQuery(
  supabase: Client,
  params: GetRecurringExpensesQueryParams
) {
  const { teamId, from, to, currency, minOccurrences = 3 } = params;
  return supabase.rpc("get_recurring_expenses", {
    team_id: teamId,
    start_date: toUTCDate(from).toDateString(),
    end_date: toUTCDate(to).toDateString(),
    currency: currency,
    min_occurrences: minOccurrences,
  });
}

// 9. Expense Distribution by Day of Week Query
export type GetExpenseDistributionByDayOfWeekQueryParams = {
  teamId: string;
  from: string;
  to: string;
  currency?: string;
};

export async function getExpenseDistributionByDayOfWeekQuery(
  supabase: Client,
  params: GetExpenseDistributionByDayOfWeekQueryParams
) {
  const { teamId, from, to, currency } = params;
  return supabase.rpc("get_expense_distribution_by_day_of_week", {
    team_id: teamId,
    start_date: toUTCDate(from).toDateString(),
    end_date: toUTCDate(to).toDateString(),
    currency: currency,
  });
}

// 10. Expense Growth Rate Query
export type GetExpenseGrowthRateQueryParams = {
  teamId: string;
  from: string;
  to: string;
  currency?: string;
  intervalType?: string;
};

export async function getExpenseGrowthRateQuery(
  supabase: Client,
  params: GetExpenseGrowthRateQueryParams
) {
  const { teamId, from, to, currency, intervalType = "month" } = params;
  return supabase.rpc("get_expense_growth_rate", {
    team_id: teamId,
    start_date: toUTCDate(from).toDateString(),
    end_date: toUTCDate(to).toDateString(),
    currency: currency,
    interval_type: intervalType,
  });
}

// 11. Expense Forecast Query
export type GetExpenseForecastQueryParams = {
  teamId: string;
  forecastDate: string;
  currency?: string;
  lookbackMonths?: number;
};

export async function getExpenseForecastQuery(
  supabase: Client,
  params: GetExpenseForecastQueryParams
) {
  const { teamId, forecastDate, currency, lookbackMonths = 3 } = params;
  return supabase.rpc("get_expense_forecast", {
    team_id: teamId,
    forecast_date: toUTCDate(forecastDate).toDateString(),
    currency: currency,
    lookback_months: lookbackMonths,
  });
}

// 12. Expense Anomalies Query
export type GetExpenseAnomaliesQueryParams = {
  teamId: string;
  from: string;
  to: string;
  currency?: string;
  thresholdPercentage?: number;
};

export async function getExpenseAnomaliesQuery(
  supabase: Client,
  params: GetExpenseAnomaliesQueryParams
) {
  const { teamId, from, to, currency, thresholdPercentage = 50 } = params;
  return supabase.rpc("get_expense_anomalies", {
    team_id: teamId,
    start_date: toUTCDate(from).toDateString(),
    end_date: toUTCDate(to).toDateString(),
    currency: currency,
    threshold_percentage: thresholdPercentage,
  });
}

// 13. Expense Trends by Time of Day Query
export type GetExpenseTrendsByTimeOfDayQueryParams = {
  teamId: string;
  from: string;
  to: string;
  currency?: string;
};

export async function getExpenseTrendsByTimeOfDayQuery(
  supabase: Client,
  params: GetExpenseTrendsByTimeOfDayQueryParams
) {
  const { teamId, from, to, currency } = params;
  return supabase.rpc("get_expense_trends_by_time_of_day", {
    team_id: teamId,
    start_date: toUTCDate(from).toDateString(),
    end_date: toUTCDate(to).toDateString(),
    currency: currency,
  });
}

// 14. Expense Comparison Query
export type GetExpenseComparisonQueryParams = {
  teamId: string;
  currentFrom: string;
  currentTo: string;
  currency?: string;
};

export async function getExpenseComparisonQuery(
  supabase: Client,
  params: GetExpenseComparisonQueryParams
) {
  const { teamId, currentFrom, currentTo, currency } = params;
  return supabase.rpc("get_expense_comparison", {
    team_id: teamId,
    current_start_date: toUTCDate(currentFrom).toDateString(),
    current_end_date: toUTCDate(currentTo).toDateString(),
    currency: currency,
  });
}

// 15. Expense by Personal Finance Category Query
export type GetExpenseByPersonalFinanceCategoryQueryParams = {
  teamId: string;
  from: string;
  to: string;
  currency?: string;
};

export async function getExpenseByPersonalFinanceCategoryQuery(
  supabase: Client,
  params: GetExpenseByPersonalFinanceCategoryQueryParams
) {
  const { teamId, from, to, currency } = params;
  return supabase.rpc("get_expense_by_personal_finance_category", {
    team_id: teamId,
    start_date: toUTCDate(from).toDateString(),
    end_date: toUTCDate(to).toDateString(),
    currency: currency,
  });
}

// 16. Inventory Cost Analysis Query
export type GetInventoryCostAnalysisQueryParams = {
  teamId: string;
  from: string;
  to: string;
  currency?: string;
};

export async function getInventoryCostAnalysisQuery(
  supabase: Client,
  params: GetInventoryCostAnalysisQueryParams
) {
  const { teamId, from, to, currency } = params;
  return supabase.rpc("get_inventory_cost_analysis", {
    team_id: teamId,
    start_date: toUTCDate(from).toDateString(),
    end_date: toUTCDate(to).toDateString(),
    currency: currency,
  });
}

// 17. Rent and Utilities Analysis Query
export type GetRentAndUtilitiesAnalysisQueryParams = {
  teamId: string;
  from: string;
  to: string;
  currency?: string;
};

export async function getRentAndUtilitiesAnalysisQuery(
  supabase: Client,
  params: GetRentAndUtilitiesAnalysisQueryParams
) {
  const { teamId, from, to, currency } = params;
  return supabase.rpc("get_rent_and_utilities_analysis", {
    team_id: teamId,
    start_date: toUTCDate(from).toDateString(),
    end_date: toUTCDate(to).toDateString(),
    currency: currency,
  });
}

// 18. Salaries and Wages Analysis Query
export type GetSalariesAndWagesAnalysisQueryParams = {
  teamId: string;
  from: string;
  to: string;
  currency?: string;
};

export async function getSalariesAndWagesAnalysisQuery(
  supabase: Client,
  params: GetSalariesAndWagesAnalysisQueryParams
) {
  const { teamId, from, to, currency } = params;
  return supabase.rpc("get_salaries_and_wages_analysis", {
    team_id: teamId,
    start_date: toUTCDate(from).toDateString(),
    end_date: toUTCDate(to).toDateString(),
    currency: currency,
  });
}

// 19. Equipment and Maintenance Analysis Query
export type GetEquipmentAndMaintenanceAnalysisQueryParams = {
  teamId: string;
  from: string;
  to: string;
  currency?: string;
};

export async function getEquipmentAndMaintenanceAnalysisQuery(
  supabase: Client,
  params: GetEquipmentAndMaintenanceAnalysisQueryParams
) {
  const { teamId, from, to, currency } = params;
  return supabase.rpc("get_equipment_and_maintenance_analysis", {
    team_id: teamId,
    start_date: toUTCDate(from).toDateString(),
    end_date: toUTCDate(to).toDateString(),
    currency: currency,
  });
}

// 20. Professional Services Analysis Query
export type GetProfessionalServicesAnalysisQueryParams = {
  teamId: string;
  from: string;
  to: string;
  currency?: string;
};

export async function getProfessionalServicesAnalysisQuery(
  supabase: Client,
  params: GetProfessionalServicesAnalysisQueryParams
) {
  const { teamId, from, to, currency } = params;
  return supabase.rpc("get_professional_services_analysis", {
    team_id: teamId,
    start_date: toUTCDate(from).toDateString(),
    end_date: toUTCDate(to).toDateString(),
    currency: currency,
  });
}

// 21. Software Subscription Analysis Query
export type GetSoftwareSubscriptionAnalysisQueryParams = {
  teamId: string;
  from: string;
  to: string;
  currency?: string;
};

export async function getSoftwareSubscriptionAnalysisQuery(
  supabase: Client,
  params: GetSoftwareSubscriptionAnalysisQueryParams
) {
  const { teamId, from, to, currency } = params;
  return supabase.rpc("get_software_subscription_analysis", {
    team_id: teamId,
    start_date: toUTCDate(from).toDateString(),
    end_date: toUTCDate(to).toDateString(),
    currency: currency,
  });
}

// 22. Supplier Expense Analysis Query
export type GetSupplierExpenseAnalysisQueryParams = {
  teamId: string;
  from: string;
  to: string;
  currency?: string;
};

export async function getSupplierExpenseAnalysisQuery(
  supabase: Client,
  params: GetSupplierExpenseAnalysisQueryParams
) {
  const { teamId, from, to, currency } = params;
  return supabase.rpc("get_supplier_expense_analysis", {
    team_id: teamId,
    start_date: toUTCDate(from).toDateString(),
    end_date: toUTCDate(to).toDateString(),
    currency: currency,
  });
}

// 23. Shipping and Logistics Analysis Query
export type GetShippingLogisticsAnalysisQueryParams = {
  teamId: string;
  from: string;
  to: string;
  currency?: string;
};

export async function getShippingLogisticsAnalysisQuery(
  supabase: Client,
  params: GetShippingLogisticsAnalysisQueryParams
) {
  const { teamId, from, to, currency } = params;
  return supabase.rpc("get_shipping_logistics_analysis", {
    team_id: teamId,
    start_date: toUTCDate(from).toDateString(),
    end_date: toUTCDate(to).toDateString(),
    currency: currency,
  });
}

// 24. Expense Breakdown by Location Query
export type GetExpenseBreakdownByLocationQueryParams = {
  teamId: string;
  from: string;
  to: string;
  currency?: string;
};

export async function getExpenseBreakdownByLocationQuery(
  supabase: Client,
  params: GetExpenseBreakdownByLocationQueryParams
) {
  const { teamId, from, to, currency } = params;
  return supabase.rpc("get_expense_breakdown_by_location", {
    team_id: teamId,
    start_date: toUTCDate(from).toDateString(),
    end_date: toUTCDate(to).toDateString(),
    currency: currency,
  });
}
