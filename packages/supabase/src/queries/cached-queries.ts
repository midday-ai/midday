import "server-only";

import { unstable_cache } from "next/cache";
import { cache } from "react";
import { createClient } from "../client/server";
import {
  getBankAccountsCurrenciesQuery,
  getBankConnectionsByTeamIdQuery,
  getBurnRateQuery,
  getCategoriesQuery,
  getExpensesQuery,
  getMetricsQuery,
  getRunwayQuery,
  getSpendingQuery,
  getTeamBankAccountsQuery,
  getTeamInvitesQuery,
  getTeamMembersQuery,
  getTeamSettingsQuery,
  getTeamUserQuery,
  getTeamsByUserIdQuery,
  getTrackerProjectsQuery,
  getTrackerRecordsByRangeQuery,
  getTransactionsQuery,
  getUserInvitesQuery,
  getUserQuery,
  type GetBurnRateQueryParams,
  type GetCategoriesParams,
  type GetExpensesQueryParams,
  type GetMetricsParams,
  type GetRunwayQueryParams,
  type GetSpendingParams,
  type GetTeamBankAccountsParams,
  type GetTrackerProjectsQueryParams,
  type GetTrackerRecordsByRangeParams,
  type GetTransactionsParams,
} from "../queries";

import {
  getDailyExpensesQuery,
  getExpenseAnomaliesQuery,
  getExpenseComparisonQuery,
  getExpenseDistributionByDayOfWeekQuery,
  getExpenseForecastQuery,
  getExpenseGrowthRateQuery,
  getExpenseTrendsByTimeOfDayQuery,
  getExpensesByCategoryQuery,
  getExpensesByMerchantQuery,
  getExpensesByPaymentChannelQuery,
  getMonthlyExpensesQuery,
  getRecurringExpensesQuery,
  getTopExpenseCategoriesQuery,
  getWeeklyExpenseTrendsQuery,
  type GetDailyExpensesQueryParams,
  type GetExpenseAnomaliesQueryParams,
  type GetExpenseComparisonQueryParams,
  type GetExpenseDistributionByDayOfWeekQueryParams,
  type GetExpenseForecastQueryParams,
  type GetExpenseGrowthRateQueryParams,
  type GetExpenseTrendsByTimeOfDayQueryParams,
  type GetExpensesByCategoryQueryParams,
  type GetExpensesByMerchantQueryParams,
  type GetExpensesByPaymentChannelQueryParams,
  type GetMonthlyExpensesQueryParams,
  type GetRecurringExpensesQueryParams,
  type GetTopExpenseCategoriesQueryParams,
  type GetWeeklyExpenseTrendsQueryParams,
} from "./analytic-queries";

export const getTransactions = async (
  params: Omit<GetTransactionsParams, "teamId">,
) => {
  const supabase = createClient();
  const user = await getUser();
  const teamId = user?.data?.team_id;

  if (!teamId) {
    return null;
  }

  return unstable_cache(
    async () => {
      return getTransactionsQuery(supabase, { ...params, teamId });
    },
    ["transactions", teamId],
    {
      revalidate: 180,
      tags: [`transactions_${teamId}`],
    },
  )(params);
};

export const getSession = cache(async () => {
  const supabase = createClient();

  return supabase.auth.getSession();
});

export const getUser = async () => {
  const {
    data: { session },
  } = await getSession();
  const userId = session?.user?.id;

  if (!userId) {
    return null;
  }

  const supabase = createClient();

  return unstable_cache(
    async () => {
      return getUserQuery(supabase, userId);
    },
    ["user", userId],
    {
      tags: [`user_${userId}`],
      revalidate: 180,
    },
  )(userId);
};

export const getTeamUser = async () => {
  const supabase = createClient();
  const { data } = await getUser();

  return unstable_cache(
    async () => {
      return getTeamUserQuery(supabase, {
        userId: data.id,
        teamId: data.team_id,
      });
    },
    ["team", "user", data.id],
    {
      tags: [`team_user_${data.id}`],
      revalidate: 180,
    },
  )(data.id);
};

export const getBankConnectionsByTeamId = async () => {
  const supabase = createClient();
  const user = await getUser();
  const teamId = user?.data?.team_id;

  if (!teamId) {
    return null;
  }

  return unstable_cache(
    async () => {
      return getBankConnectionsByTeamIdQuery(supabase, teamId);
    },
    ["bank_connections", teamId],
    {
      tags: [`bank_connections_${teamId}`],
      revalidate: 3600,
    },
  )(teamId);
};

export const getTeamBankAccounts = async (
  params?: Omit<GetTeamBankAccountsParams, "teamId">,
) => {
  const supabase = createClient();

  const user = await getUser();
  const teamId = user?.data?.team_id;

  if (!teamId) {
    return null;
  }

  return unstable_cache(
    async () => {
      return getTeamBankAccountsQuery(supabase, { ...params, teamId });
    },
    ["bank_accounts", teamId],
    {
      tags: [`bank_accounts_${teamId}`],
      revalidate: 180,
    },
  )(params);
};

export const getTeamMembers = async () => {
  const supabase = createClient();

  const user = await getUser();
  const teamId = user?.data?.team_id;

  if (!teamId) {
    return null;
  }

  return unstable_cache(
    async () => {
      return getTeamMembersQuery(supabase, teamId);
    },
    ["team_members", teamId],
    {
      tags: [`team_members_${teamId}`],
      revalidate: 180,
    },
  )(teamId);
};

export const getSpending = async (
  params: Omit<GetSpendingParams, "teamId">,
) => {
  const supabase = createClient();
  const user = await getUser();
  const teamId = user?.data?.team_id;

  if (!teamId) {
    return null;
  }

  return unstable_cache(
    async () => {
      return getSpendingQuery(supabase, { ...params, teamId });
    },
    ["spending", teamId],
    {
      tags: [`spending_${teamId}`],
      revalidate: 3600,
    },
  )(params);
};

export const getBankAccountsCurrencies = async () => {
  const supabase = createClient();

  const user = await getUser();
  const teamId = user?.data?.team_id;

  if (!teamId) {
    return null;
  }

  return unstable_cache(
    async () => {
      return getBankAccountsCurrenciesQuery(supabase, {
        teamId,
      });
    },
    ["bank_accounts_currencies", teamId],
    {
      tags: [`bank_accounts_currencies_${teamId}`],
      revalidate: 180,
    },
  )();
};

export const getMetrics = async (params: Omit<GetMetricsParams, "teamId">) => {
  const supabase = createClient();

  const user = await getUser();
  const teamId = user?.data?.team_id;

  if (!teamId) {
    return null;
  }

  return unstable_cache(
    async () => {
      return getMetricsQuery(supabase, { ...params, teamId });
    },
    ["metrics", teamId],
    {
      tags: [`metrics_${teamId}`],
      revalidate: 3600,
    },
  )(params);
};

export const getExpenses = async (params: GetExpensesQueryParams) => {
  const supabase = createClient();
  const user = await getUser();
  const teamId = user?.data?.team_id;

  if (!teamId) {
    return null;
  }

  return unstable_cache(
    async () => {
      return getExpensesQuery(supabase, { ...params, teamId });
    },
    ["expenses", teamId],
    {
      tags: [`expenses_${teamId}`],
      revalidate: 3600,
    },
  )(params);
};

export const getTeams = async () => {
  const supabase = createClient();

  const user = await getUser();
  const userId = user?.data?.id;

  if (!userId) {
    return;
  }

  return unstable_cache(
    async () => {
      return getTeamsByUserIdQuery(supabase, userId);
    },
    ["teams", userId],
    {
      tags: [`teams_${userId}`],
      revalidate: 180,
    },
  )();
};

export const getTeamInvites = async () => {
  const supabase = createClient();

  const user = await getUser();
  const teamId = user?.data?.team_id;

  if (!teamId) {
    return;
  }

  return unstable_cache(
    async () => {
      return getTeamInvitesQuery(supabase, teamId);
    },
    ["team", "invites", teamId],
    {
      tags: [`team_invites_${teamId}`],
      revalidate: 180,
    },
  )();
};

export const getUserInvites = async () => {
  const supabase = createClient();

  const user = await getUser();
  const email = user?.data?.email;

  return unstable_cache(
    async () => {
      return getUserInvitesQuery(supabase, email);
    },
    ["user", "invites", email],
    {
      tags: [`user_invites_${email}`],
      revalidate: 180,
    },
  )();
};

export const getTrackerProjects = async (
  params: GetTrackerProjectsQueryParams,
) => {
  const supabase = createClient();
  const user = await getUser();
  const teamId = user?.data?.team_id;

  return unstable_cache(
    async () => {
      return getTrackerProjectsQuery(supabase, { ...params, teamId });
    },
    ["tracker_projects", teamId],
    {
      tags: [`tracker_projects_${teamId}`],
      revalidate: 180,
    },
  )(params);
};

export const getTrackerRecordsByRange = async (
  params: GetTrackerRecordsByRangeParams,
) => {
  const supabase = createClient();
  const user = await getUser();
  const teamId = user?.data?.team_id;

  return unstable_cache(
    async () => {
      return getTrackerRecordsByRangeQuery(supabase, { ...params, teamId });
    },
    ["tracker_entries", teamId],
    {
      tags: [`tracker_entries_${teamId}`],
      revalidate: 180,
    },
  )(params);
};

export const getBurnRate = async (
  params: Omit<GetBurnRateQueryParams, "teamId">,
) => {
  const supabase = createClient();
  const user = await getUser();
  const teamId = user?.data?.team_id;

  return unstable_cache(
    async () => {
      return getBurnRateQuery(supabase, { ...params, teamId });
    },
    ["burn_rate", teamId],
    {
      tags: [`burn_rate_${teamId}`],
      revalidate: 3600,
    },
  )(params);
};

export const getRunway = async (
  params: Omit<GetRunwayQueryParams, "teamId">,
) => {
  const supabase = createClient();
  const user = await getUser();
  const teamId = user?.data?.team_id;

  return unstable_cache(
    async () => {
      return getRunwayQuery(supabase, { ...params, teamId });
    },
    ["runway", teamId],
    {
      tags: [`runway_${teamId}`],
      revalidate: 3600,
    },
  )(params);
};

export const getCategories = async (
  params?: Omit<GetCategoriesParams, "teamId">,
) => {
  const supabase = createClient();
  const user = await getUser();
  const teamId = user?.data?.team_id;

  return unstable_cache(
    async () => {
      return getCategoriesQuery(supabase, { ...params, teamId });
    },
    ["transaction_categories", teamId],
    {
      tags: [`transaction_categories_${teamId}`],
      revalidate: 3600,
    },
  )(params);
};

export const getTeamSettings = async () => {
  const supabase = createClient();
  const user = await getUser();
  const teamId = user?.data?.team_id;

  if (!teamId) {
    return null;
  }

  return unstable_cache(
    async () => {
      return getTeamSettingsQuery(supabase, teamId);
    },
    ["team_settings", teamId],
    {
      tags: [`team_settings_${teamId}`],
      revalidate: 3600,
    },
  )();
};

export const getMonthlyExpenses = async (
  params: Omit<GetMonthlyExpensesQueryParams, "teamId">
) => {
  const supabase = createClient();
  const user = await getUser();
  const teamId = user?.data?.team_id;

  if (!teamId) {
    return null;
  }

  return unstable_cache(
    async () => {
      return getMonthlyExpensesQuery(supabase, { ...params, teamId });
    },
    ["monthly_expenses", teamId],
    {
      tags: [`monthly_expenses_${teamId}`],
      revalidate: 3600,
    }
  )(params);
};

export const getExpensesByCategory = async (
  params: Omit<GetExpensesByCategoryQueryParams, "teamId">
) => {
  const supabase = createClient();
  const user = await getUser();
  const teamId = user?.data?.team_id;

  if (!teamId) {
    return null;
  }

  return unstable_cache(
    async () => {
      return getExpensesByCategoryQuery(supabase, { ...params, teamId });
    },
    ["expenses_by_category", teamId],
    {
      tags: [`expenses_by_category_${teamId}`],
      revalidate: 3600,
    }
  )(params);
};

export const getDailyExpenses = async (
  params: Omit<GetDailyExpensesQueryParams, "teamId">
) => {
  const supabase = createClient();
  const user = await getUser();
  const teamId = user?.data?.team_id;

  if (!teamId) {
    return null;
  }

  return unstable_cache(
    async () => {
      return getDailyExpensesQuery(supabase, { ...params, teamId });
    },
    ["daily_expenses", teamId],
    {
      tags: [`daily_expenses_${teamId}`],
      revalidate: 3600,
    }
  )(params);
};

export const getTopExpenseCategories = async (
  params: Omit<GetTopExpenseCategoriesQueryParams, "teamId">
) => {
  const supabase = createClient();
  const user = await getUser();
  const teamId = user?.data?.team_id;

  if (!teamId) {
    return null;
  }

  return unstable_cache(
    async () => {
      return getTopExpenseCategoriesQuery(supabase, { ...params, teamId });
    },
    ["top_expense_categories", teamId],
    {
      tags: [`top_expense_categories_${teamId}`],
      revalidate: 3600,
    }
  )(params);
};

export const getExpensesByMerchant = async (
  params: Omit<GetExpensesByMerchantQueryParams, "teamId">
) => {
  const supabase = createClient();
  const user = await getUser();
  const teamId = user?.data?.team_id;

  if (!teamId) {
    return null;
  }

  return unstable_cache(
    async () => {
      return getExpensesByMerchantQuery(supabase, { ...params, teamId });
    },
    ["expenses_by_merchant", teamId],
    {
      tags: [`expenses_by_merchant_${teamId}`],
      revalidate: 3600,
    }
  )(params);
};

export const getWeeklyExpenseTrends = async (
  params: Omit<GetWeeklyExpenseTrendsQueryParams, "teamId">
) => {
  const supabase = createClient();
  const user = await getUser();
  const teamId = user?.data?.team_id;

  if (!teamId) {
    return null;
  }

  return unstable_cache(
    async () => {
      return getWeeklyExpenseTrendsQuery(supabase, { ...params, teamId });
    },
    ["weekly_expense_trends", teamId],
    {
      tags: [`weekly_expense_trends_${teamId}`],
      revalidate: 3600,
    }
  )(params);
};

export const getExpensesByPaymentChannel = async (
  params: Omit<GetExpensesByPaymentChannelQueryParams, "teamId">
) => {
  const supabase = createClient();
  const user = await getUser();
  const teamId = user?.data?.team_id;

  if (!teamId) {
    return null;
  }

  return unstable_cache(
    async () => {
      return getExpensesByPaymentChannelQuery(supabase, { ...params, teamId });
    },
    ["expenses_by_payment_channel", teamId],
    {
      tags: [`expenses_by_payment_channel_${teamId}`],
      revalidate: 3600,
    }
  )(params);
};

export const getRecurringExpenses = async (
  params: Omit<GetRecurringExpensesQueryParams, "teamId">
) => {
  const supabase = createClient();
  const user = await getUser();
  const teamId = user?.data?.team_id;

  if (!teamId) {
    return null;
  }

  return unstable_cache(
    async () => {
      return getRecurringExpensesQuery(supabase, { ...params, teamId });
    },
    ["recurring_expenses", teamId],
    {
      tags: [`recurring_expenses_${teamId}`],
      revalidate: 3600,
    }
  )(params);
};

export const getExpenseDistributionByDayOfWeek = async (
  params: Omit<GetExpenseDistributionByDayOfWeekQueryParams, "teamId">
) => {
  const supabase = createClient();
  const user = await getUser();
  const teamId = user?.data?.team_id;

  if (!teamId) {
    return null;
  }

  return unstable_cache(
    async () => {
      return getExpenseDistributionByDayOfWeekQuery(supabase, { ...params, teamId });
    },
    ["expense_distribution_by_day_of_week", teamId],
    {
      tags: [`expense_distribution_by_day_of_week_${teamId}`],
      revalidate: 3600,
    }
  )(params);
};

export const getExpenseGrowthRate = async (
  params: Omit<GetExpenseGrowthRateQueryParams, "teamId">
) => {
  const supabase = createClient();
  const user = await getUser();
  const teamId = user?.data?.team_id;

  if (!teamId) {
    return null;
  }

  return unstable_cache(
    async () => {
      return getExpenseGrowthRateQuery(supabase, { ...params, teamId });
    },
    ["expense_growth_rate", teamId],
    {
      tags: [`expense_growth_rate_${teamId}`],
      revalidate: 3600,
    }
  )(params);
};

export const getExpenseForecast = async (
  params: Omit<GetExpenseForecastQueryParams, "teamId">
) => {
  const supabase = createClient();
  const user = await getUser();
  const teamId = user?.data?.team_id;

  if (!teamId) {
    return null;
  }

  return unstable_cache(
    async () => {
      return getExpenseForecastQuery(supabase, { ...params, teamId });
    },
    ["expense_forecast", teamId],
    {
      tags: [`expense_forecast_${teamId}`],
      revalidate: 3600,
    }
  )(params);
};

export const getExpenseAnomalies = async (
  params: Omit<GetExpenseAnomaliesQueryParams, "teamId">
) => {
  const supabase = createClient();
  const user = await getUser();
  const teamId = user?.data?.team_id;

  if (!teamId) {
    return null;
  }

  return unstable_cache(
    async () => {
      return getExpenseAnomaliesQuery(supabase, { ...params, teamId });
    },
    ["expense_anomalies", teamId],
    {
      tags: [`expense_anomalies_${teamId}`],
      revalidate: 3600,
    }
  )(params);
};

export const getExpenseTrendsByTimeOfDay = async (
  params: Omit<GetExpenseTrendsByTimeOfDayQueryParams, "teamId">
) => {
  const supabase = createClient();
  const user = await getUser();
  const teamId = user?.data?.team_id;

  if (!teamId) {
    return null;
  }

  return unstable_cache(
    async () => {
      return getExpenseTrendsByTimeOfDayQuery(supabase, { ...params, teamId });
    },
    ["expense_trends_by_time_of_day", teamId],
    {
      tags: [`expense_trends_by_time_of_day_${teamId}`],
      revalidate: 3600,
    }
  )(params);
};

export const getExpenseComparison = async (
  params: Omit<GetExpenseComparisonQueryParams, "teamId">
) => {
  const supabase = createClient();
  const user = await getUser();
  const teamId = user?.data?.team_id;

  if (!teamId) {
    return null;
  }

  return unstable_cache(
    async () => {
      return getExpenseComparisonQuery(supabase, { ...params, teamId });
    },
    ["expense_comparison", teamId],
    {
      tags: [`expense_comparison_${teamId}`],
      revalidate: 3600,
    }
  )(params);
};