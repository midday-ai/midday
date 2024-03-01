import { unstable_cache } from "next/cache";
import { createClient } from "../client/server";
import {
  getBankConnectionsByTeamIdQuery,
  getInboxQuery,
  getMetricsQuery,
  getSpendingQuery,
  getTeamBankAccountsQuery,
  getTeamInvitesQuery,
  getTeamMembersQuery,
  getTeamUserQuery,
  getTeamsByUserIdQuery,
  getTrackerProjectsQuery,
  getTrackerRecordsByRangeQuery,
  getTransactionsQuery,
  getUserInvitesQuery,
  getUserQuery,
  getVaultQuery,
} from "../queries";

export const getTransactions = async (params) => {
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
    }
  )(params);
};

export const getUser = async () => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user?.id;

  if (!userId) {
    return null;
  }

  return unstable_cache(
    async () => {
      return getUserQuery(supabase, userId);
    },
    ["user", userId],
    {
      tags: [`user_${userId}`],
      revalidate: 180,
    }
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
    }
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
    }
  )(teamId);
};

export const getTeamBankAccounts = async () => {
  const supabase = createClient();

  const user = await getUser();
  const teamId = user?.data?.team_id;

  if (!teamId) {
    return null;
  }

  return unstable_cache(
    async () => {
      return getTeamBankAccountsQuery(supabase, teamId);
    },
    ["bank_accounts", teamId],
    {
      tags: [`bank_accounts_${teamId}`],
      revalidate: 180,
    }
  )(teamId);
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
    }
  )(teamId);
};

export const getSpending = async (params) => {
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
      revalidate: 180,
    }
  )(params);
};

export const getMetrics = async (params) => {
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
      revalidate: 180,
    }
  )(params);
};

export const getVault = async (params) => {
  const supabase = createClient();

  const user = await getUser();
  const teamId = user?.data?.team_id;

  if (!teamId) {
    return null;
  }

  return unstable_cache(
    async () => {
      return getVaultQuery(supabase, { ...params, teamId });
    },
    ["vault", teamId],
    {
      tags: [`vault_${teamId}`],
      revalidate: 3600,
    }
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
    }
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
    }
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
    }
  )();
};

export const getTrackerProjects = async (params) => {
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
    }
  )(params);
};

export const getTrackerRecordsByRange = async (params) => {
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
    }
  )(params);
};
