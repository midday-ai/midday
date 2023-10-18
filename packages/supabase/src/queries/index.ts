import { Client } from "../types";

export async function getSession(supabase: Client) {
  return supabase.auth.getSession();
}

export async function getUserDetails(supabase: Client) {
  const { data } = await getSession(supabase);

  return supabase
    .from("users")
    .select()
    .eq("id", data?.session?.user.id)
    .single();
}

export async function getUserTeams(supabase: Client) {
  const { data: userData } = await getUserDetails(supabase);

  return supabase
    .from("members")
    .select(`
      *,
      team:teams(*)
    `)
    .eq("team_id", userData?.team_id);
}

export async function getTeamBankAccounts(supabase: Client) {
  const { data: userData } = await getUserDetails(supabase);

  return supabase
    .from("bank_accounts")
    .select("*")
    .eq("team_id", userData?.team_id);
}

export async function getUserTeamMembers(supabase: Client) {
  const { data: userData } = await getUserDetails(supabase);

  const { data } = await supabase
    .from("teams")
    .select(`
      *,
      members(*)
    `)
    .eq("id", userData?.team_id);

  return data;
}

type GetTransactionsParams = {
  from: number;
  to: number;
  filter: {
    search?: string;
    status?: "fullfilled" | "unfullfilled";
    attachments?: "include" | "exclude";
    date: {
      from?: string;
      to?: string;
    };
  };
};

export async function getTransactions(
  supabase: Client,
  params: GetTransactionsParams,
) {
  const { from = 0, to = 30, filter } = params;
  const { date, search, status, attachments } = filter;
  const { data: userData } = await getUserDetails(supabase);

  // TODO: Set "bank_account_id" uuid references bank_account
  const query = supabase
    .from("transactions")
    .select(`
      *,
      account:bank_account_id(*),
      assigned:assigned_id(*)
    `)
    .eq("team_id", userData?.team_id)
    .range(from, to);

  if (date?.from && date?.to) {
    query.gte("date", date.from);
    query.lte("date", date.to);
  }

  if (search) {
    console.log(search);
    query.textSearch("name", search, {
      type: "websearch",
      config: "english",
    });
  }

  if (status?.includes("fullfilled")) {
    query.not("attachment", "is", null);
    query.not("vat", "is", null);
  }

  if (status?.includes("unfullfilled")) {
    query.is("attachment", null);
    query.is("vat", null);
  }

  if (attachments === "exclude") {
    query.is("attachment", null);
  }

  if (attachments === "include") {
    query.not("attachment", "is", null);
  }

  return query;
}
