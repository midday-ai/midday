import { Client } from "../types";

export async function getSession(supabase: Client) {
  const { data } = await supabase.auth.getSession();
  return data;
}

export async function getUserDetails(supabase: Client) {
  const user = await getSession(supabase);

  const { data } = await supabase
    .from("users")
    .select()
    .eq("id", user?.session?.user.id)
    .single();

  return data;
}

export async function getUserTeams(supabase: Client) {
  const user = await getUserDetails(supabase);

  const { data } = await supabase
    .from("members")
    .select(`
      *,
      team:teams(*)
    `)
    .eq("team_id", user?.team_id);

  return data;
}

export async function getTeamBankAccounts(supabase: Client) {
  const user = await getUserDetails(supabase);

  const { data } = await supabase
    .from("bank_accounts")
    .select("*")
    .eq("team_id", user?.team_id);

  return data;
}

type GetTeamMembersParams = {
  team_id: string;
};

export async function getTeamMembers(
  supabase: Client,
  { team_id }: GetTeamMembersParams,
) {
  const { data } = await supabase
    .from("teams")
    .select(`
      *,
      members(*)
    `)
    .eq("id", team_id);

  return data;
}

type GetTransactionsParams = {
  from: number;
  to: number;
};

export async function getTransactions(
  supabase: Client,
  { from = 0, to = 20 }: GetTransactionsParams,
) {
  const user = await getUserDetails(supabase);

  const { count } = await supabase
    .from("transactions")
    .select("*", { count: "exact", head: true })
    .eq("team_id", user?.team_id);

  // TODO: Set "bank_account_id" uuid references bank_account
  const { data } = await supabase
    .from("transactions")
    .select(`
      *,
      account:bank_account_id(*)
    `)
    .eq("team_id", user?.team_id)
    .range(from, to);

  return {
    count,
    data,
  };
}
