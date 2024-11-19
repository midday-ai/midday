import "server-only";

import { unstable_cache } from "next/cache";
import { cache } from "react";
import { createClient } from "../client/server";
import {
  type GetBurnRateQueryParams,
  type GetCategoriesParams,
  type GetExpensesQueryParams,
  type GetInvoiceSummaryParams,
  type GetInvoicesQueryParams,
  type GetMetricsParams,
  type GetRunwayQueryParams,
  type GetSpendingParams,
  type GetTeamBankAccountsParams,
  type GetTrackerProjectsQueryParams,
  type GetTrackerRecordsByRangeParams,
  type GetTransactionsParams,
  getBankAccountsCurrenciesQuery,
  getBankConnectionsByTeamIdQuery,
  getBurnRateQuery,
  getCategoriesQuery,
  getCustomersQuery,
  getExpensesQuery,
  getInvoiceSummaryQuery,
  getInvoiceTemplatesQuery,
  getInvoicesQuery,
  getLastInvoiceNumberQuery,
  getMetricsQuery,
  getPaymentStatusQuery,
  getRunwayQuery,
  getSpendingQuery,
  getTagsQuery,
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
} from "../queries";

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
      revalidate: 600,
      tags: [`transactions_${teamId}`],
    },
  )(params);
};

// Cache per request
export const getSession = cache(async () => {
  const supabase = createClient();

  return supabase.auth.getUser();
});

// Cache per request and revalidate every 30 minutes
export const getUser = cache(async () => {
  const {
    data: { user },
  } = await getSession();
  const userId = user?.id;

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
      // 30 minutes, jwt expires in 1 hour
      revalidate: 1800,
    },
  )();
});

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
      revalidate: 1800,
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
  params: Omit<GetTrackerProjectsQueryParams, "teamId">,
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
      revalidate: 3600,
    },
  )(params);
};

export const getTrackerRecordsByRange = async (
  params: Omit<GetTrackerRecordsByRangeParams, "teamId">,
) => {
  const supabase = createClient();
  const user = await getUser();
  const teamId = user?.data?.team_id;

  return unstable_cache(
    async () => {
      return getTrackerRecordsByRangeQuery(supabase, {
        ...params,
        teamId,
        userId: user?.data?.id,
      });
    },
    ["tracker_entries", teamId],
    {
      tags: [`tracker_entries_${teamId}`],
      revalidate: 3600,
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

export const getInvoiceSummary = async (
  params?: Omit<GetInvoiceSummaryParams, "teamId">,
) => {
  const supabase = createClient();
  const user = await getUser();
  const teamId = user?.data?.team_id;

  return unstable_cache(
    async () => {
      return getInvoiceSummaryQuery(supabase, { ...params, teamId });
    },
    ["invoice_summary", teamId],
    {
      tags: [`invoice_summary_${teamId}`],
      revalidate: 3600,
    },
  )(params);
};

export const getPaymentStatus = async () => {
  const supabase = createClient();
  const user = await getUser();
  const teamId = user?.data?.team_id;

  if (!teamId) {
    return null;
  }

  return unstable_cache(
    async () => {
      return getPaymentStatusQuery(supabase, teamId);
    },
    ["payment_status", teamId],
    {
      tags: [`payment_status_${teamId}`],
      revalidate: 3600,
    },
  )();
};

export const getCustomers = async () => {
  const supabase = createClient();
  const user = await getUser();
  const teamId = user?.data?.team_id;

  if (!teamId) {
    return null;
  }

  return unstable_cache(
    async () => {
      return getCustomersQuery(supabase, teamId);
    },
    ["customers", teamId],
    {
      tags: [`customers_${teamId}`],
      revalidate: 3600,
    },
  )();
};

export const getInvoices = async (
  params?: Omit<GetInvoicesQueryParams, "teamId">,
) => {
  const supabase = createClient();
  const user = await getUser();
  const teamId = user?.data?.team_id;

  if (!teamId) {
    return null;
  }

  return unstable_cache(
    async () => {
      return getInvoicesQuery(supabase, { ...params, teamId });
    },
    ["invoices", teamId],
    {
      tags: [`invoices_${teamId}`],
      revalidate: 3600,
    },
  )(params);
};

export const getInvoiceTemplates = async () => {
  const supabase = createClient();
  const user = await getUser();
  const teamId = user?.data?.team_id;

  if (!teamId) {
    return null;
  }

  return unstable_cache(
    async () => {
      return getInvoiceTemplatesQuery(supabase, teamId);
    },
    ["invoice_templates", teamId],
    {
      tags: [`invoice_templates_${teamId}`],
      revalidate: 3600,
    },
  )();
};

export const getLastInvoiceNumber = async () => {
  const supabase = createClient();
  const user = await getUser();
  const teamId = user?.data?.team_id;

  if (!teamId) {
    return null;
  }

  return unstable_cache(
    async () => {
      return getLastInvoiceNumberQuery(supabase, teamId);
    },
    ["invoice_number", teamId],
    {
      tags: [`invoice_number_${teamId}`],
      revalidate: 3600,
    },
  )();
};

export const getTags = async () => {
  const supabase = createClient();
  const user = await getUser();
  const teamId = user?.data?.team_id;

  if (!teamId) {
    return null;
  }

  return unstable_cache(
    async () => {
      return getTagsQuery(supabase, teamId);
    },
    ["tags", teamId],
    {
      tags: [`tags_${teamId}`],
      revalidate: 3600,
    },
  )();
};
