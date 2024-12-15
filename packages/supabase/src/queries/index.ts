import { UTCDate } from "@date-fns/utc";
import {
  addDays,
  endOfMonth,
  formatISO,
  isWithinInterval,
  startOfMonth,
  subYears,
} from "date-fns";
import type { Client } from "../types";

function transactionCategory(transaction) {
  return (
    transaction?.category ?? {
      id: "uncategorized",
      name: "Uncategorized",
      color: "#606060",
    }
  );
}

export function getPercentageIncrease(a: number, b: number) {
  return a > 0 && b > 0 ? Math.abs(((a - b) / b) * 100).toFixed() : 0;
}

export async function getUserQuery(supabase: Client, userId: string) {
  return supabase
    .from("users")
    .select(
      `
      *,
      team:team_id(*)
    `,
    )
    .eq("id", userId)
    .single()
    .throwOnError();
}

export async function getCurrentUserTeamQuery(supabase: Client) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return;
  }

  return getUserQuery(supabase, session.user?.id);
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

export type GetTeamBankAccountsParams = {
  teamId: string;
  enabled?: boolean;
};

export async function getTeamBankAccountsQuery(
  supabase: Client,
  params: GetTeamBankAccountsParams,
) {
  const { teamId, enabled } = params;

  const query = supabase
    .from("bank_accounts")
    .select("*, bank:bank_connections(*)")
    .eq("team_id", teamId)
    .order("created_at", { ascending: true })
    .order("name", { ascending: false })
    .throwOnError();

  if (enabled) {
    query.eq("enabled", enabled);
  }

  return query;
}

export async function getTeamMembersQuery(supabase: Client, teamId: string) {
  const { data } = await supabase
    .from("users_on_team")
    .select(
      `
      id,
      role,
      team_id,
      user:users(id, full_name, avatar_url, email)
    `,
    )
    .eq("team_id", teamId)
    .order("created_at")
    .throwOnError();

  return {
    data,
  };
}

type GetTeamUserParams = {
  teamId: string;
  userId: string;
};

export async function getTeamUserQuery(
  supabase: Client,
  params: GetTeamUserParams,
) {
  const { data } = await supabase
    .from("users_on_team")
    .select(
      `
      id,
      role,
      team_id,
      user:users(id, full_name, avatar_url, email)
    `,
    )
    .eq("team_id", params.teamId)
    .eq("user_id", params.userId)
    .throwOnError()
    .single();

  return {
    data,
  };
}

export type GetSpendingParams = {
  from: string;
  to: string;
  teamId: string;
  currency?: string;
};

export async function getSpendingQuery(
  supabase: Client,
  params: GetSpendingParams,
) {
  return supabase.rpc("get_spending_v3", {
    team_id: params.teamId,
    date_from: params.from,
    date_to: params.to,
    base_currency: params.currency,
  });
}

export type GetTransactionsParams = {
  teamId: string;
  to: number;
  from: number;
  sort?: [string, "asc" | "desc"];
  searchQuery?: string;
  filter?: {
    statuses?: string[];
    attachments?: "include" | "exclude";
    categories?: string[];
    tags?: string[];
    accounts?: string[];
    assignees?: string[];
    type?: "income" | "expense";
    start?: string;
    end?: string;
    recurring?: string[];
    amount_range?: [number, number];
    amount?: [string, string];
  };
};

export async function getTransactionsQuery(
  supabase: Client,
  params: GetTransactionsParams,
) {
  const { from = 0, to, filter, sort, teamId, searchQuery } = params;

  const {
    statuses,
    attachments,
    categories,
    tags,
    type,
    accounts,
    start,
    end,
    assignees,
    recurring,
    amount_range,
    amount,
  } = filter || {};

  const columns = [
    "id",
    "date",
    "amount",
    "currency",
    "method",
    "status",
    "note",
    "manual",
    "exclude",
    "recurring",
    "frequency",
    "name",
    "description",
    "assigned:assigned_id(*)",
    "category:transaction_categories(id, name, color, slug)",
    "bank_account:bank_accounts(id, name, currency, bank_connection:bank_connections(id, logo_url))",
    "attachments:transaction_attachments(id, name, size, path, type)",
    "tags:transaction_tags(id, tag_id, tag:tags(id, name))",
    "vat:calculated_vat",
  ];

  const query = supabase
    .from("transactions")
    .select(columns.join(","), { count: "exact" })
    .eq("team_id", teamId);

  if (sort) {
    const [column, value] = sort;
    const ascending = value === "asc";

    if (column === "attachment") {
      query.order("is_fulfilled", { ascending });
    } else if (column === "assigned") {
      query.order("assigned(full_name)", { ascending });
    } else if (column === "bank_account") {
      query.order("bank_account(name)", { ascending });
    } else if (column === "category") {
      query.order("category(name)", { ascending });
    } else if (column === "tags") {
      query.order("is_transaction_tagged", { ascending });
    } else {
      query.order(column, { ascending });
    }
  } else {
    query
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });
  }

  if (start && end) {
    const fromDate = new UTCDate(start);
    const toDate = new UTCDate(end);

    query.gte("date", fromDate.toISOString());
    query.lte("date", toDate.toISOString());
  }

  if (searchQuery) {
    if (!Number.isNaN(Number.parseInt(searchQuery))) {
      query.eq("amount", Number(searchQuery));
    } else {
      query.textSearch("fts_vector", `%${searchQuery}%:*`);
    }
  }

  if (statuses?.includes("fullfilled") || attachments === "include") {
    query.eq("is_fulfilled", true);
  }

  if (statuses?.includes("unfulfilled") || attachments === "exclude") {
    query.eq("is_fulfilled", false);
  }

  if (statuses?.includes("excluded")) {
    query.eq("status", "excluded");
  } else {
    query.or("status.eq.pending,status.eq.posted,status.eq.completed");
  }

  if (categories) {
    const matchCategory = categories
      .map((category) => {
        if (category === "uncategorized") {
          return "category_slug.is.null";
        }
        return `category_slug.eq.${category}`;
      })
      .join(",");

    query.or(matchCategory);
  }

  if (tags) {
    query
      .select(
        [...columns, "temp_filter_tags:transaction_tags!inner()"].join(","),
      )
      .eq("team_id", teamId)
      .in("temp_filter_tags.tag_id", tags);
  }

  if (recurring) {
    if (recurring.includes("all")) {
      query.eq("recurring", true);
    } else {
      query.in("frequency", recurring);
    }
  }

  if (type === "expense") {
    query.lt("amount", 0);
    query.neq("category_slug", "transfer");
  }

  if (type === "income") {
    query.eq("category_slug", "income");
  }

  if (accounts?.length) {
    query.in("bank_account_id", accounts);
  }

  if (assignees?.length) {
    query.in("assigned_id", assignees);
  }

  if (amount_range) {
    query.gte("amount", amount_range[0]);
    query.lte("amount", amount_range[1]);
  }

  if (amount?.length === 2) {
    const [operator, value] = amount;

    if (operator === "gte") {
      query.gte("amount", value);
    } else if (operator === "lte") {
      query.lte("amount", value);
    }
  }

  const { data, count } = await query.range(from, to);

  const totalAmount = data
    ?.reduce((acc, { amount, currency }) => {
      const existingCurrency = acc.find((item) => item.currency === currency);

      if (existingCurrency) {
        existingCurrency.amount += amount;
      } else {
        acc.push({ amount, currency });
      }
      return acc;
    }, [])
    .sort((a, b) => a?.amount - b?.amount);

  return {
    meta: {
      totalAmount,
      count,
    },
    data: data?.map((transaction) => ({
      ...transaction,
      category: transactionCategory(transaction),
    })),
  };
}

export async function getTransactionQuery(supabase: Client, id: string) {
  const columns = [
    "*",
    "assigned:assigned_id(*)",
    "category:category_slug(id, name, vat)",
    "attachments:transaction_attachments(*)",
    "tags:transaction_tags(id, tag:tags(id, name))",
    "bank_account:bank_accounts(id, name, currency, bank_connection:bank_connections(id, logo_url))",
    "vat:calculated_vat",
  ];

  const { data } = await supabase
    .from("transactions")
    .select(columns.join(","))
    .eq("id", id)
    .single()
    .throwOnError();

  return {
    ...data,
    category: transactionCategory(data),
  };
}

type GetSimilarTransactionsParams = {
  name: string;
  teamId: string;
  categorySlug?: string;
};

export async function getSimilarTransactions(
  supabase: Client,
  params: GetSimilarTransactionsParams,
) {
  const { name, teamId, categorySlug } = params;

  return supabase
    .from("transactions")
    .select("id, amount, team_id", { count: "exact" })
    .eq("team_id", teamId)
    .textSearch("fts_vector", `%${name}%:*`)
    .throwOnError();
}

type GetBankAccountsCurrenciesParams = {
  teamId: string;
};

export async function getBankAccountsCurrenciesQuery(
  supabase: Client,
  params: GetBankAccountsCurrenciesParams,
) {
  return supabase.rpc("get_bank_account_currencies", {
    team_id: params.teamId,
  });
}

export type GetBurnRateQueryParams = {
  teamId: string;
  from: string;
  to: string;
  currency?: string;
};

export async function getBurnRateQuery(
  supabase: Client,
  params: GetBurnRateQueryParams,
) {
  const { teamId, from, to, currency } = params;

  const fromDate = new UTCDate(from);
  const toDate = new UTCDate(to);

  const { data } = await supabase.rpc("get_burn_rate_v4", {
    team_id: teamId,
    date_from: startOfMonth(fromDate).toDateString(),
    date_to: endOfMonth(toDate).toDateString(),
    base_currency: currency,
  });

  return {
    data,
    currency: data?.at(0)?.currency,
  };
}

export type GetRunwayQueryParams = {
  teamId: string;
  from: string;
  to: string;
  currency?: string;
};

export async function getRunwayQuery(
  supabase: Client,
  params: GetRunwayQueryParams,
) {
  const { teamId, from, to, currency } = params;

  const fromDate = new UTCDate(from);
  const toDate = new UTCDate(to);

  return supabase.rpc("get_runway_v4", {
    team_id: teamId,
    date_from: startOfMonth(fromDate).toDateString(),
    date_to: endOfMonth(toDate).toDateString(),
    base_currency: currency,
  });
}

export type GetMetricsParams = {
  teamId: string;
  from: string;
  to: string;
  currency?: string;
  type?: "revenue" | "profit";
};

export async function getMetricsQuery(
  supabase: Client,
  params: GetMetricsParams,
) {
  const { teamId, from, to, type = "profit", currency } = params;

  const rpc = type === "profit" ? "get_profit_v3" : "get_revenue_v3";

  const fromDate = new UTCDate(from);
  const toDate = new UTCDate(to);

  const [{ data: prevData }, { data: currentData }] = await Promise.all([
    supabase.rpc(rpc, {
      team_id: teamId,
      date_from: subYears(startOfMonth(fromDate), 1).toDateString(),
      date_to: subYears(endOfMonth(toDate), 1).toDateString(),
      base_currency: currency,
    }),
    supabase.rpc(rpc, {
      team_id: teamId,
      date_from: startOfMonth(fromDate).toDateString(),
      date_to: endOfMonth(toDate).toDateString(),
      base_currency: currency,
    }),
  ]);

  const prevTotal = prevData?.reduce((value, item) => item.value + value, 0);
  const currentTotal = currentData?.reduce(
    (value, item) => item.value + value,
    0,
  );

  const baseCurrency = currentData?.at(0)?.currency;

  return {
    summary: {
      currentTotal,
      prevTotal,
      currency: baseCurrency,
    },
    meta: {
      type,
      currency: baseCurrency,
    },
    result: currentData?.map((record, index) => {
      const prev = prevData?.at(index);

      return {
        date: record.date,
        precentage: {
          value: getPercentageIncrease(
            Math.abs(prev?.value),
            Math.abs(record.value),
          ),
          status: record.value > prev?.value ? "positive" : "negative",
        },
        current: {
          date: record.date,
          value: record.value,
          currency,
        },
        previous: {
          date: prev?.date,
          value: prev?.value,
          currency,
        },
      };
    }),
  };
}

export type GetExpensesQueryParams = {
  teamId: string;
  from: string;
  to: string;
  currency?: string;
};

export async function getExpensesQuery(
  supabase: Client,
  params: GetExpensesQueryParams,
) {
  const { teamId, from, to, currency } = params;

  const fromDate = new UTCDate(from);
  const toDate = new UTCDate(to);

  const { data } = await supabase.rpc("get_expenses", {
    team_id: teamId,
    date_from: startOfMonth(fromDate).toDateString(),
    date_to: endOfMonth(toDate).toDateString(),
    base_currency: currency,
  });

  const averageExpense =
    data && data.length > 0
      ? data.reduce((sum, item) => sum + (item.value || 0), 0) / data.length
      : 0;

  return {
    summary: {
      averageExpense,
      currency: data?.at(0)?.currency,
    },
    meta: {
      type: "expense",
      currency: data?.at(0)?.currency,
    },
    result: data.map((item) => ({
      ...item,
      value: item.value,
      recurring: item.recurring_value,
      total: item.value + item.recurring_value,
    })),
  };
}

export type GetVaultParams = {
  teamId: string;
  parentId?: string;
  limit?: number;
  searchQuery?: string;
  filter?: {
    start?: string;
    end?: string;
    owners?: string[];
    tags?: string[];
  };
};

export async function getVaultQuery(supabase: Client, params: GetVaultParams) {
  const { teamId, parentId, limit = 10000, searchQuery, filter } = params;

  const { start, end, owners, tags } = filter || {};

  const isSearch =
    (filter !== undefined &&
      Object.values(filter).some(
        (value) => value !== undefined && value !== null,
      )) ||
    Boolean(searchQuery);

  const query = supabase
    .from("documents")
    .select(
      "id, name, path_tokens, created_at, team_id, metadata, tag, owner:owner_id(*)",
    )
    .eq("team_id", teamId)
    .limit(limit)
    .order("created_at", { ascending: true });

  if (owners?.length) {
    query.in("owner_id", owners);
  }

  if (tags?.length) {
    query.in("tag", tags);
  }

  if (start && end) {
    query.gte("created_at", start);
    query.lte("created_at", end);
  }

  if (!isSearch) {
    // if no search query, we want to get the default folders
    if (parentId === "inbox") {
      query
        .or(`parent_id.eq.${parentId || teamId},parent_id.eq.uploaded`)
        .not("path_tokens", "cs", '{"uploaded",".folderPlaceholder"}');
    } else {
      query.or(`parent_id.eq.${parentId || teamId}`);
    }
  }

  if (searchQuery) {
    query.textSearch("fts", `'${searchQuery}'`);
  }

  const { data } = await query;

  const defaultFolders =
    parentId || isSearch
      ? []
      : [
          { name: "exports", isFolder: true },
          { name: "inbox", isFolder: true },
          { name: "imports", isFolder: true },
          { name: "transactions", isFolder: true },
          { name: "invoices", isFolder: true },
        ];

  const filteredData = (data ?? []).map((item) => ({
    ...item,
    name:
      item.path_tokens?.at(-1) === ".folderPlaceholder"
        ? item.path_tokens?.at(-2)
        : item.path_tokens?.at(-1),
    isFolder: item.path_tokens?.at(-1) === ".folderPlaceholder",
  }));

  const mergedMap = new Map(
    [...defaultFolders, ...filteredData].map((obj) => [obj.name, obj]),
  );

  const mergedArray = Array.from(mergedMap.values());

  return {
    data: mergedArray,
  };
}

export async function getVaultActivityQuery(supabase: Client, teamId: string) {
  return supabase
    .from("documents")
    .select("id, name, metadata, path_tokens, tag, team_id")
    .eq("team_id", teamId)
    .limit(20)
    .not("name", "ilike", "%.folderPlaceholder")
    .order("created_at", { ascending: false });
}

type GetVaultRecursiveParams = {
  teamId: string;
  path?: string;
  folder?: string;
  limit?: number;
  offset?: number;
};

export async function getVaultRecursiveQuery(
  supabase: Client,
  params: GetVaultRecursiveParams,
) {
  const { teamId, path, folder, limit = 10000 } = params;

  let basePath = teamId;

  if (path) {
    basePath = `${basePath}/${path}`;
  }

  if (folder) {
    basePath = `${basePath}/${folder}`;
  }

  const items = [];
  let folderContents: any = [];

  for (;;) {
    const { data } = await supabase.storage.from("vault").list(basePath);

    folderContents = folderContents.concat(data);
    // offset += limit;
    if ((data || []).length < limit) {
      break;
    }
  }

  const subfolders = folderContents?.filter((item) => item.id === null) ?? [];
  const folderItems = folderContents?.filter((item) => item.id !== null) ?? [];

  folderItems.forEach((item) => items.push({ ...item, basePath }));

  const subFolderContents = await Promise.all(
    subfolders.map((folder: any) =>
      getVaultRecursiveQuery(supabase, {
        ...params,
        folder: decodeURIComponent(folder.name),
      }),
    ),
  );

  subFolderContents.map((subfolderContent) => {
    subfolderContent.map((item) => items.push(item));
  });

  return items;
}

export async function getTeamsByUserIdQuery(supabase: Client, userId: string) {
  return supabase
    .from("users_on_team")
    .select(
      `
      id,
      role,
      team:team_id(*)`,
    )
    .eq("user_id", userId)
    .throwOnError();
}

export async function getTeamInvitesQuery(supabase: Client, teamId: string) {
  return supabase
    .from("user_invites")
    .select("id, email, code, role, user:invited_by(*), team:team_id(*)")
    .eq("team_id", teamId)
    .throwOnError();
}

export async function getUserInvitesQuery(supabase: Client, email: string) {
  return supabase
    .from("user_invites")
    .select("id, email, code, role, user:invited_by(*), team:team_id(*)")
    .eq("email", email)
    .throwOnError();
}

type GetUserInviteQueryParams = {
  code: string;
  email: string;
};

export async function getUserInviteQuery(
  supabase: Client,
  params: GetUserInviteQueryParams,
) {
  return supabase
    .from("user_invites")
    .select("*")
    .eq("code", params.code)
    .eq("email", params.email)
    .single();
}

type GetInboxQueryParams = {
  teamId: string;
  from?: number;
  to?: number;
  done?: boolean;
  todo?: boolean;
  ascending?: boolean;
  searchQuery?: string;
};

export async function getInboxQuery(
  supabase: Client,
  params: GetInboxQueryParams,
) {
  const {
    from = 0,
    to = 10,
    teamId,
    done,
    todo,
    searchQuery,
    ascending = false,
  } = params;

  const columns = [
    "id",
    "file_name",
    "file_path",
    "display_name",
    "transaction_id",
    "amount",
    "currency",
    "content_type",
    "date",
    "status",
    "forwarded_to",
    "created_at",
    "website",
    "description",
    "transaction:transactions(id, amount, currency, name, date)",
  ];

  const query = supabase
    .from("inbox")
    .select(columns.join(","))
    .eq("team_id", teamId)
    .order("created_at", { ascending })
    .neq("status", "deleted");

  if (done) {
    query.not("transaction_id", "is", null);
  }

  if (todo) {
    query.is("transaction_id", null);
  }

  if (searchQuery) {
    if (!Number.isNaN(Number.parseInt(searchQuery))) {
      query.like("inbox_amount_text", `%${searchQuery}%`);
    } else {
      query.textSearch("fts", `${searchQuery}:*`);
    }
  }

  const { data } = await query.range(from, to);

  return {
    data: data?.map((item) => {
      const pending = isWithinInterval(new Date(), {
        start: new Date(item.created_at),
        end: addDays(new Date(item.created_at), 45),
      });

      return {
        ...item,
        pending,
        review: !pending && !item.transaction_id,
      };
    }),
  };
}

type GetTrackerProjectQueryParams = {
  teamId: string;
  projectId: string;
};

export async function getTrackerProjectQuery(
  supabase: Client,
  params: GetTrackerProjectQueryParams,
) {
  return supabase
    .from("tracker_projects")
    .select("*, tags:tracker_project_tags(id, tag:tags(id, name))")
    .eq("id", params.projectId)
    .eq("team_id", params.teamId)
    .single();
}

export type GetTrackerProjectsQueryParams = {
  teamId: string;
  to?: number;
  from?: number;
  start?: string;
  end?: string;
  sort?: [string, "asc" | "desc"];
  search?: {
    query?: string;
    fuzzy?: boolean;
  };
  filter?: {
    status?: "in_progress" | "completed";
    customers?: string[];
  };
};

export async function getTrackerProjectsQuery(
  supabase: Client,
  params: GetTrackerProjectsQueryParams,
) {
  const {
    from = 0,
    to = 10,
    filter,
    sort,
    teamId,
    search,
    start,
    end,
  } = params;
  const { status, customers } = filter || {};

  const query = supabase
    .from("tracker_projects")
    .select(
      "*, total_duration, users:get_assigned_users_for_project, total_amount:get_project_total_amount, customer:customer_id(id, name, website), tags:tracker_project_tags(id, tag:tags(id, name))",
      {
        count: "exact",
      },
    )
    .eq("team_id", teamId);

  if (status) {
    query.eq("status", status);
  }

  if (start && end) {
    query.gte("created_at", start);
    query.lte("created_at", end);
  }

  if (search?.query && search?.fuzzy) {
    query.ilike("name", `%${search.query}%`);
  }

  if (customers?.length) {
    query.in("customer_id", customers);
  }

  if (sort) {
    const [column, value] = sort;
    if (column === "time") {
      query.order("total_duration", { ascending: value === "asc" });
    } else if (column === "amount") {
      // query.order("total_amount", { ascending: value === "asc" });
    } else if (column === "assigned") {
      // query.order("assigned_id", { ascending: value === "asc" });
    } else if (column === "customer") {
      query.order("customer(name)", { ascending: value === "asc" });
    } else if (column === "tags") {
      query.order("is_project_tagged", { ascending: value === "asc" });
    } else {
      query.order(column, { ascending: value === "asc" });
    }
  } else {
    query.order("created_at", { ascending: false });
  }

  const { data, count } = await query.range(from, to);

  return {
    meta: {
      count,
    },
    data,
  };
}

type GetTrackerRecordsByDateParams = {
  teamId: string;
  date: string;
  projectId?: string;
  userId?: string;
};

export async function getTrackerRecordsByDateQuery(
  supabase: Client,
  params: GetTrackerRecordsByDateParams,
) {
  const { teamId, projectId, date, userId } = params;

  const query = supabase
    .from("tracker_entries")
    .select(
      "*, assigned:assigned_id(id, full_name, avatar_url), project:project_id(id, name, rate, currency, customer:customer_id(id, name))",
    )
    .eq("team_id", teamId)
    .eq("date", formatISO(new UTCDate(date), { representation: "date" }));

  if (projectId) {
    query.eq("project_id", projectId);
  }

  if (userId) {
    query.eq("assigned_id", userId);
  }

  const { data } = await query;

  const totalDuration = data?.reduce(
    (duration, item) => (item?.duration ?? 0) + duration,
    0,
  );

  return {
    meta: {
      totalDuration,
    },
    data,
  };
}

export type GetTrackerRecordsByRangeParams = {
  teamId: string;
  from: string;
  to: string;
  projectId?: string;
  userId?: string;
};

export async function getTrackerRecordsByRangeQuery(
  supabase: Client,
  params: GetTrackerRecordsByRangeParams,
) {
  if (!params.teamId) {
    return null;
  }

  const query = supabase
    .from("tracker_entries")
    .select(
      "*, assigned:assigned_id(id, full_name, avatar_url), project:project_id(id, name, rate, currency)",
    )
    .eq("team_id", params.teamId)
    .gte("date", new UTCDate(params.from).toISOString())
    .lte("date", new UTCDate(params.to).toISOString())
    .order("created_at");

  if (params.userId) {
    query.eq("assigned_id", params.userId);
  }

  if (params.projectId) {
    query.eq("project_id", params.projectId);
  }

  const { data } = await query;
  const result = data?.reduce((acc, item) => {
    const key = item.date;

    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {});

  const totalDuration = data?.reduce(
    (duration, item) => (item?.duration ?? 0) + duration,
    0,
  );

  const totalAmount = data?.reduce(
    (amount, { project, duration = 0 }) =>
      amount + (project?.rate ?? 0) * (duration / 3600),
    0,
  );

  return {
    meta: {
      totalDuration,
      totalAmount,
      from: params.from,
      to: params.to,
    },
    data: result,
  };
}

export type GetCategoriesParams = {
  teamId: string;
  limit?: number;
};

export async function getCategoriesQuery(
  supabase: Client,
  params: GetCategoriesParams,
) {
  const { teamId, limit = 1000 } = params;

  return supabase
    .from("transaction_categories")
    .select("id, name, color, slug, description, system, vat")
    .eq("team_id", teamId)
    .order("created_at", { ascending: false })
    .range(0, limit);
}

type GetInboxSearchParams = {
  teamId: string;
  limit?: number;
  q: string;
};

export async function getInboxSearchQuery(
  supabase: Client,
  params: GetInboxSearchParams,
) {
  const { teamId, q, limit = 10 } = params;

  const query = supabase
    .from("inbox")
    .select(
      "id, created_at, file_name, amount, currency, file_path, content_type, date, display_name, size, description",
    )
    .eq("team_id", teamId)
    .neq("status", "deleted")
    .order("created_at", { ascending: true });

  if (!Number.isNaN(Number.parseInt(q))) {
    query.like("inbox_amount_text", `%${q}%`);
  } else {
    query.textSearch("fts", `${q}:*`);
  }

  const { data } = await query.range(0, limit);

  return data;
}

export async function getTeamSettingsQuery(supabase: Client, teamId: string) {
  return supabase.from("teams").select("*").eq("id", teamId).single();
}

export type GetInvoicesQueryParams = {
  teamId: string;
  from?: number;
  to?: number;
  searchQuery?: string | null;
  filter?: {
    statuses?: string[] | null;
    customers?: string[] | null;
    start?: string | null;
    end?: string | null;
  };
  sort?: string[] | null;
};

export async function getInvoicesQuery(
  supabase: Client,
  params: GetInvoicesQueryParams,
) {
  const { teamId, filter, searchQuery, sort, from = 0, to = 25 } = params;
  const { statuses, start, end, customers } = filter || {};

  const query = supabase
    .from("invoices")
    .select(
      "id, invoice_number, internal_note, token, due_date, issue_date, paid_at, updated_at, viewed_at, amount, template, currency, status, vat, tax, customer:customer_id(id, name, website), customer_name",
      { count: "exact" },
    )
    .eq("team_id", teamId);

  if (sort) {
    const [column, value] = sort;

    const ascending = value === "asc";

    if (column === "customer") {
      query.order("customer(name)", { ascending });
    } else if (column === "recurring") {
      // Don't do anything until we have a recurring invoice table
    } else if (column) {
      query.order(column, { ascending });
    }
  } else {
    query.order("created_at", { ascending: false });
  }

  if (statuses) {
    query.in("status", statuses);
  }

  if (start && end) {
    const fromDate = new UTCDate(start);
    const toDate = new UTCDate(end);

    query.gte("due_date", fromDate.toISOString());
    query.lte("due_date", toDate.toISOString());
  }

  if (customers?.length) {
    query.in("customer_id", customers);
  }

  if (searchQuery) {
    if (!Number.isNaN(Number.parseInt(searchQuery))) {
      query.eq("amount", Number(searchQuery));
    } else {
      query.textSearch("fts", `%${searchQuery}%:*`);
    }
  }

  const { data, count } = await query.range(from, to);

  return {
    meta: {
      count,
    },
    data,
  };
}

export type GetInvoiceSummaryParams = {
  teamId: string;
  status?: "paid" | "cancelled";
};

export async function getInvoiceSummaryQuery(
  supabase: Client,
  params: GetInvoiceSummaryParams,
) {
  const { teamId, status } = params;

  return supabase.rpc("get_invoice_summary", {
    team_id: teamId,
    status,
  });
}

export async function getPaymentStatusQuery(supabase: Client, teamId: string) {
  return supabase
    .rpc("get_payment_score", {
      team_id: teamId,
    })
    .single();
}

export type GetCustomersQueryParams = {
  teamId: string;
  from?: number;
  to?: number;
  searchQuery?: string | null;
  sort?: string[] | null;
};

export async function getCustomersQuery(
  supabase: Client,
  params: GetCustomersQueryParams,
) {
  const { teamId, from = 0, to = 100, searchQuery, sort } = params;

  const query = supabase
    .from("customers")
    .select(
      "*, invoices:invoices(id), projects:tracker_projects(id), tags:customer_tags(id, tag:tags(id, name))",
      { count: "exact" },
    )
    .eq("team_id", teamId)
    .range(from, to);

  if (searchQuery) {
    query.ilike("name", `%${searchQuery}%`);
  }

  if (sort) {
    const [column, value] = sort;
    const ascending = value === "asc";

    if (column === "invoices") {
      query.order("invoices(id)", { ascending });
    } else if (column === "projects") {
      query.order("projects(id)", { ascending });
    } else {
      query.order(column, { ascending });
    }
  } else {
    query.order("created_at", { ascending: false });
  }

  const { data, count } = await query;

  return {
    meta: {
      count,
    },
    data,
  };
}

export async function getCustomerQuery(supabase: Client, customerId: string) {
  return supabase
    .from("customers")
    .select("*, tags:customer_tags(id, tag:tags(id, name))")
    .eq("id", customerId)
    .single();
}

export async function getInvoiceTemplatesQuery(
  supabase: Client,
  teamId: string,
) {
  return supabase
    .from("invoice_templates")
    .select("*")
    .eq("team_id", teamId)
    .single();
}

export async function getInvoiceQuery(supabase: Client, id: string) {
  return supabase
    .from("invoices")
    .select("*, customer:customer_id(name, website), team:team_id(name)")
    .eq("id", id)
    .single();
}

export async function getDraftInvoiceQuery(supabase: Client, id: string) {
  return supabase
    .from("invoices")
    .select(
      "id, due_date, invoice_number, template, status, discount, amount, currency, line_items, payment_details, note_details, customer_details, vat, tax, from_details, issue_date, customer_id, customer_name, token, top_block, bottom_block",
    )
    .eq("id", id)
    .single();
}

type SearchInvoiceNumberParams = {
  teamId: string;
  query: string;
};

export async function searchInvoiceNumberQuery(
  supabase: Client,
  params: SearchInvoiceNumberParams,
) {
  return supabase
    .from("invoices")
    .select("invoice_number")
    .eq("team_id", params.teamId)
    .ilike("invoice_number", `%${params.query}`);
}

export async function getLastInvoiceNumberQuery(
  supabase: Client,
  teamId: string,
) {
  const { data } = await supabase
    .rpc("get_next_invoice_number", {
      team_id: teamId,
    })
    .single();

  return { data };
}

export async function getTagsQuery(supabase: Client, teamId: string) {
  return supabase
    .from("tags")
    .select("*")
    .eq("team_id", teamId)
    .order("created_at", { ascending: false });
}

export async function getBankAccountsBalancesQuery(
  supabase: Client,
  teamId: string,
) {
  return supabase.rpc("get_team_bank_accounts_balances", {
    team_id: teamId,
  });
}
