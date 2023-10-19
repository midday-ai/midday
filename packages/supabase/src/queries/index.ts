import { Client } from "../types";

export function getPagination(page: number, size: number) {
  const limit = size ? +size : 3;
  const from = page ? page * limit : 0;
  const to = page ? from + size - 1 : size - 1;

  return { from, to };
}

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
  sort: {
    column: string;
    value: "asc" | "desc";
  };
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
  const { from = 0, to, filter, sort } = params;
  const { date = {}, search, status, attachments } = filter || {};
  const { data: userData } = await getUserDetails(supabase);

  const query = supabase
    .from("transactions")
    .select(
      `
      *,
      account:bank_account_id(*),
      assigned:assigned_id(*)
    `,
      { count: "exact" },
    )
    .eq("team_id", userData?.team_id);

  if (sort) {
    const [column, value] = sort;
    query.order(column, { ascending: value === "asc" });
  } else {
    query.order("date", { ascending: false });
  }

  if (date?.from && date?.to) {
    query.gte("date", date.from);
    query.lte("date", date.to);
  }

  if (search) {
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

  const { data, count } = await query.range(from, to);

  // Only calculate total amount when a fitler is applied
  // Investigate pg functions
  const totalAmount = filter
    ? (await query.limit(10000000))?.data?.reduce(
        (amount, item) => item.amount + amount,
        0,
      )
    : 0;

  return {
    meta: {
      count,
      totalAmount,
      currency: data?.at(0)?.currency,
    },
    data,
  };
}
