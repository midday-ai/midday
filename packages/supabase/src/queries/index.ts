import { Client } from "../types";

export async function getSession(supabase: Client) {
  return supabase.auth.getSession();
}

export async function getUserDetails(supabase: Client) {
  const user = await getSession(supabase);

  return supabase
    .from("users")
    .select()
    .eq("id", user?.session?.user.id)
    .single();
}

export async function getUserTeams(supabase: Client) {
  const user = await getUserDetails(supabase);

  return supabase
    .from("members")
    .select(`
      *,
      team:teams(*)
    `)
    .eq("team_id", user?.team_id);
}

export async function getTeamBankAccounts(supabase: Client) {
  const user = await getUserDetails(supabase);

  return supabase
    .from("bank_accounts")
    .select("*")
    .eq("team_id", user?.team_id);
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
  date: {
    from?: string;
    to?: string;
  };
};

export async function getTransactions(
  supabase: Client,
  { from = 0, to = 30, date }: GetTransactionsParams = {},
) {
  const user = await getUserDetails(supabase);

  // TODO: Set "bank_account_id" uuid references bank_account
  const base = supabase
    .from("transactions")
    .select(`
      *,
      account:bank_account_id(*),
      assigned:assigned_id(*)
    `)
    .eq("team_id", user?.team_id)
    .range(from, to);

  if (date?.from && date?.to) {
    base.gte("date", date.from);
    base.lte("date", date.to);
  }

  return base;
}
