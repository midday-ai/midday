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

export async function getUserQuery(supabase: Client, userId: string) {
  return supabase
    .from("users")
    .select(`
      *,
      team:team_id(*)
    `)
    .eq("id", userId)
    .single()
    .throwOnError();
}

export async function getCurrentUserTeamQuery(supabase: Client) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return getUserQuery(supabase, session?.user?.id);
}

export async function getMembersByTeamId(supabase: Client, teamId: string) {
  return supabase
    .from("members")
    .select(`
      *,
      team:teams(*)
    `)
    .eq("team_id", teamId)
    .throwOnError();
}

export async function getBankConnectionsByTeamIdQuery(
  supabase: Client,
  teamId: string,
) {
  return supabase
    .from("bank_connections")
    .select("*")
    .eq("team_id", teamId)
    .throwOnError();
}

export async function getTeamBankAccountsQuery(
  supabase: Client,
  teamId: string,
) {
  return supabase
    .from("bank_accounts")
    .select("*, bank:bank_connection_id(*)")
    .eq("team_id", teamId)
    .throwOnError();
}

export async function getTeamMembersQuery(supabase: Client, teamId: string) {
  const { data } = await supabase
    .from("users_on_team")
    .select(`
      id,
      user:users(id,full_name,avatar_url)
    `)
    .eq("team_id", teamId)
    .throwOnError();

  return data;
}

type GetSpendingParams = {
  from: string;
  to: string;
  teamId: string;
};

export async function getSpendingQuery(
  supabase: Client,
  params: GetSpendingParams,
) {
  const query = supabase
    .from("transactions")
    .select(
      `
      currency,
      category,
      amount
    `,
    )
    .order("order")
    .eq("team_id", params.teamId)
    .lt("amount", 0)
    .throwOnError();

  if (params.from && params.to) {
    query.gte("date", params.from);
    query.lte("date", params.to);
  }

  const { data, count } = await query.range(0, 10000000);

  const totalAmount = data?.reduce((amount, item) => item.amount + amount, 0);

  const combinedValues = {};

  for (const item of data) {
    const { category, amount, currency } = item;

    if (combinedValues[category]) {
      combinedValues[category].amount += amount;
    } else {
      combinedValues[category] = { amount, currency };
    }
  }

  return {
    meta: {
      count,
      totalAmount: +Math.abs(totalAmount).toFixed(2),
      currency: data?.at(0)?.currency,
    },
    data: Object.entries(combinedValues).map(
      ([category, { amount, currency }]) => ({
        category,
        currency,
        amount: +Math.abs(amount).toFixed(2),
      }),
    ),
  };
}

type GetTransactionsParams = {
  teamId: string;
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
    category?: "include" | "exclude";
    type?: "income" | "outcome";
    date: {
      from?: string;
      to?: string;
    };
  };
};

export async function getTransactionsQuery(
  supabase: Client,
  params: GetTransactionsParams,
) {
  const { from = 0, to, filter, sort, teamId } = params;
  const {
    date = {},
    search,
    status,
    attachments,
    category,
    type,
  } = filter || {};

  const query = supabase
    .from("transactions")
    .select(
      `
      *,
      currency,
      assigned:assigned_id(*),
      attachments(id,size,name)
    `,
      { count: "exact" },
    )
    .eq("team_id", teamId);

  if (sort) {
    const [column, value] = sort;
    query.order(column, { ascending: value === "asc" });
  } else {
    query.order("order");
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

  if (category === "exclude") {
    query.is("category", null);
  }

  if (category === "include") {
    query.not("category", "is", null);
  }

  if (type === "outcome") {
    query.lt("amount", 0);
  }

  if (type === "income") {
    query.gt("amount", 0);
  }

  const { data, count } = await query.range(from, to).throwOnError();

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

export async function getTransaction(supabase: Client, id: string) {
  return supabase
    .from("transactions")
    .select(`
      *,
      account:bank_account_id(*),
      assigned:assigned_id(*),
      attachments(*)
    `)
    .eq("id", id)
    .single()
    .throwOnError();
}

type GetSimilarTransactionsParams = {
  id: string;
  teamId: string;
};

export async function getSimilarTransactions(
  supabase: Client,
  params: GetSimilarTransactionsParams,
) {
  const { id, teamId } = params;
  const transaction = await supabase
    .from("transactions")
    .select("name, category")
    .eq("id", id)
    .single();

  return supabase
    .from("transactions")
    .select("id, amount", { count: "exact" })
    .eq("name", transaction.data.name)
    .eq("team_id", teamId)
    .is("category", null)
    .throwOnError();
}
