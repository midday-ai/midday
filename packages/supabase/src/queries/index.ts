import {
  addDays,
  addMonths,
  addWeeks,
  differenceInMonths,
  differenceInWeeks,
  format,
  isWithinInterval,
  subYears,
} from "date-fns";
import type { Client } from "../types";
import { EMPTY_FOLDER_PLACEHOLDER_FILE_NAME } from "../utils/storage";

export function getPagination(page: number, size: number) {
  const limit = size ? +size : 3;
  const from = page ? page * limit : 0;
  const to = page ? from + size - 1 : size - 1;

  return { from, to };
}

export function getMonthRange(current: Date, previous: Date) {
  const range = [];
  const months = Math.abs(differenceInMonths(current, previous)) + 1;

  for (let i = 0; i < months; i++) {
    range.push(addMonths(new Date(current), i));
  }

  return range;
}

export function getWeekRange(current: Date, previous: Date) {
  const range = [];
  const weeks = Math.abs(differenceInWeeks(current, previous)) + 1;

  for (let i = 0; i < weeks; i++) {
    range.push(addWeeks(new Date(current), i));
  }

  return range;
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
    `
    )
    .eq("id", userId)
    .single()
    .throwOnError();
}

export async function getCurrentUserTeamQuery(supabase: Client) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return getUserQuery(supabase, user?.id);
}

export async function getBankConnectionsByTeamIdQuery(
  supabase: Client,
  teamId: string
) {
  return supabase
    .from("decrypted_bank_connections")
    .select("*, name:decrypted_name")
    .eq("team_id", teamId)
    .throwOnError();
}

export async function getTeamBankAccountsQuery(
  supabase: Client,
  teamId: string
) {
  return supabase
    .from("decrypted_bank_accounts")
    .select(
      "*, name:decrypted_name, bank:decrypted_bank_connections(*, name:decrypted_name)"
    )
    .eq("team_id", teamId)
    .order("created_at", { ascending: true })
    .order("name", { ascending: false })
    .throwOnError();
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
    `
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
  params: GetTeamUserParams
) {
  const { data } = await supabase
    .from("users_on_team")
    .select(
      `
      id,
      role,
      team_id,
      user:users(id, full_name, avatar_url, email)
    `
    )
    .eq("team_id", params.teamId)
    .eq("user_id", params.userId)
    .throwOnError()
    .single();

  return {
    data,
  };
}

type GetSpendingParams = {
  from: string;
  to: string;
  teamId: string;
};

export async function getSpendingQuery(
  supabase: Client,
  params: GetSpendingParams
) {
  const query = supabase
    .from("transactions")
    .select(
      `
      currency,
      category,
      amount
    `
    )
    .order("date", { ascending: false })
    .order("name", { ascending: false })
    .eq("team_id", params.teamId)
    .lt("amount", 0)
    .or("status.eq.pending,status.eq.posted")
    .throwOnError();

  if (params.from && params.to) {
    query.gte("date", params.from);
    query.lte("date", params.to);
  }

  const { data, count } = await query.range(0, 1000000);
  const totalAmount = data
    ?.filter((item) => item.category !== "transfer")
    ?.reduce((amount, item) => item.amount + amount, 0);

  const combinedValues = {};

  for (const item of data) {
    const { category, amount, currency } = item;

    const key = category || "uncategorized";

    if (combinedValues[key]) {
      combinedValues[key].amount += amount;
    } else {
      combinedValues[key] = { amount, currency };
    }
  }

  return {
    meta: {
      count,
      totalAmount: +Math.abs(totalAmount).toFixed(2),
      currency: data?.at(0)?.currency,
    },
    data: Object.entries(combinedValues)
      .map(([category, { amount, currency }]) => {
        return {
          category: category || "uncategorized",
          currency,
          amount: +Math.abs(amount).toFixed(2),
          precentage: Math.round((amount / totalAmount) * 100),
        };
      })
      .sort((a, b) => b.amount - a.amount),
  };
}

type GetTransactionsParams = {
  teamId: string;
  to: number;
  from: number;
  sort: {
    column: string;
    value: "asc" | "desc";
  };
  search?: {
    query?: string;
    fuzzy?: boolean;
  };
  filter: {
    status?: "fullfilled" | "unfullfilled" | "excluded";
    attachments?: "include" | "exclude";
    categories?: string[];
    type?: "income" | "expense";
    date: {
      from?: string;
      to?: string;
    };
  };
};

export async function getTransactionsQuery(
  supabase: Client,
  params: GetTransactionsParams
) {
  const { from = 0, to, filter, sort, teamId, search } = params;
  const { date = {}, status, attachments, categories, type } = filter || {};

  const query = supabase
    .from("decrypted_transactions")
    .select(
      `
      *,
      name:decrypted_name,
      description:decrypted_description,
      assigned:assigned_id(*),
      attachments:transaction_attachments(*),
      bank_account:decrypted_bank_accounts(id, name:decrypted_name, currency, bank_connection:decrypted_bank_connections(id, logo_url))
      `,
      { count: "exact" }
    )
    .eq("team_id", teamId);

  if (sort) {
    const [column, value] = sort;

    if (column === "attachment") {
      // TODO: Order by attachment i.e status
      // query.order("transaction_attachments", {
      //   ascending: value === "asc",
      // });
    } else if (column === "assigned") {
      query.order("assigned_id", { ascending: value === "asc" });
    } else if (column === "bank_account") {
      query.order("bank_account_id", { ascending: value === "asc" });
    } else {
      query.order(column, { ascending: value === "asc" });
    }
  } else {
    query
      .order("date", { ascending: false })
      .order("name", { ascending: false });
  }

  if (date?.from && date?.to) {
    query.gte("date", date.from);
    query.lte("date", date.to);
  }

  if (search?.query && search?.fuzzy) {
    if (!Number.isNaN(parseInt(search.query))) {
      // NOTE: amount_text is a pg_function that casts amount to text
      query.like("amount_text", `%${search.query}%`);
    } else {
      query.ilike("decrypted_name", `%${search.query}%`);
    }
  }

  if (search?.query && !search?.fuzzy) {
    if (!Number.isNaN(parseInt(search.query))) {
      // NOTE: amount_text is a pg_function that casts amount to text
      query.like("amount_text", `%${search.query}%`);
    } else {
      query.textSearch("decrypted_name", search.query, {
        type: "websearch",
        config: "english",
      });
    }
  }

  if (attachments === "exclude" || status?.includes("unfullfilled")) {
    query.filter("transaction_attachments.id", "is", null);
  }

  if (status?.includes("fullfilled") || attachments === "include") {
    query.select(`
      *,
      name:decrypted_name,
      description:decrypted_description,
      assigned:assigned_id(*),
      attachments:transaction_attachments!inner(id,size,name),
      bank_account:decrypted_bank_accounts(id, name:decrypted_name, currency, bank_connection:decrypted_bank_connections(id, logo_url))
    `);
  }

  if (status?.includes("excluded")) {
    query.eq("status", "excluded");
  } else {
    query.or("status.eq.pending,status.eq.posted");
  }

  if (categories) {
    query.select(
      `
      *,
      name:decrypted_name,
      description:decrypted_description,
      assigned:assigned_id(*),
      attachments:transaction_attachments(*),
      bank_account:decrypted_bank_accounts(id, name:decrypted_name, currency, bank_connection:decrypted_bank_connections(id, logo_url))
    `
    );

    const matchCategory = categories
      .map((category) => {
        if (category === "uncategorized") {
          return "category.is.null";
        }
        return `category.eq.${category}`;
      })
      .join(",");

    query.or(matchCategory);
  }

  if (type === "expense") {
    query.lt("amount", 0);
    query.neq("category", "transfer");
  }

  if (type === "income") {
    query.eq("category", "income");
  }

  const { data, count } = await query.range(from, to).throwOnError();

  // Only calculate total amount when a filters are applied
  // Investigate pg functions
  const totalAmount =
    Object.keys(filter).length > 0
      ? (await query.limit(1000000).neq("category", "transfer"))?.data?.reduce(
          (amount, item) => item.amount + amount,
          0
        )
      : 0;

  const totalMissingAttachments = data?.reduce((acc, currentItem) => {
    if (currentItem.attachments?.length === 0) {
      return acc + 1;
    }
    return acc;
  }, 0);

  return {
    meta: {
      count,
      totalAmount,
      totalMissingAttachments,
      currency: data?.at(0)?.currency,
    },
    data: data?.map((transaction) => ({
      ...transaction,
      category: transaction?.category || "uncategorized",
    })),
  };
}

export async function getTransactionQuery(supabase: Client, id: string) {
  const { data } = await supabase
    .from("decrypted_transactions")
    .select(
      `
      *,
      name:decrypted_name,
      description:decrypted_description,
      assigned:assigned_id(*),
      attachments:transaction_attachments(*),
      bank_account:decrypted_bank_accounts(id, name:decrypted_name, currency, bank_connection:decrypted_bank_connections(id, logo_url))
    `
    )
    .eq("id", id)
    .single()
    .throwOnError();

  return {
    ...data,
    category: data?.category || "uncategorized",
  };
}

type GetSimilarTransactionsParams = {
  name: string;
  teamId: string;
};

export async function getSimilarTransactions(
  supabase: Client,
  params: GetSimilarTransactionsParams
) {
  const { name, teamId } = params;

  return supabase
    .from("decrypted_transactions")
    .select("id, amount, team_id", { count: "exact" })
    .eq("decrypted_name", name)
    .eq("team_id", teamId)
    .throwOnError();
}

type GetMetricsParams = {
  teamId: string;
  from: string;
  to: string;
  type?: "revenue" | "profit";
  period?: "weekly" | "monthly";
};

export async function getMetricsQuery(
  supabase: Client,
  params: GetMetricsParams
) {
  const { teamId, from, to, type, period = "monthly" } = params;

  const previousFromDate = subYears(new Date(from), 1);
  const dateFormat = period === "monthly" ? "y-M" : "y-ww";

  const query = supabase
    .from("transactions")
    .select(
      `
      amount,
      date,
      currency
    `
    )
    .eq("team_id", teamId)
    .or("status.eq.pending,status.eq.posted")
    .order("date", { ascending: false })
    .order("name", { ascending: false })
    .limit(1000000)
    .gte("date", previousFromDate.toDateString())
    .lte("date", to);

  if (type === "profit") {
    query.or("category.neq.transfer,category.is.null");
  }

  if (type === "revenue") {
    query.eq("category", "income");
  }

  const { data } = await query.throwOnError();

  const sum = [
    ...data
      .reduce((map, item) => {
        const key = format(new Date(item.date), dateFormat);
        const prev = map.get(key);

        if (prev) {
          prev.value += item.amount;
        } else {
          map.set(key, {
            key,
            date: item.date,
            value: item.amount,
            currency: item.currency,
          });
        }

        return map;
      }, new Map())
      .values(),
  ];

  const result = sum?.reduce((acc, item) => {
    const key = format(new Date(item.date), "y");

    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {});

  const [prevData = [], currentData = [], nextData = []] =
    Object.values(result);

  // NOTE: If dates spans over years
  const combinedData = [...currentData, ...nextData];

  const prevTotal = prevData?.reduce((value, item) => item.value + value, 0);
  const currentTotal = combinedData?.reduce(
    (value, item) => item.value + value,
    0
  );

  const current = new Date(from);
  const previous = new Date(to);
  const range =
    period === "weekly"
      ? getWeekRange(current, previous)
      : getMonthRange(current, previous);

  return {
    summary: {
      currentTotal,
      prevTotal,
      currency: data?.at(0)?.currency,
    },
    meta: {
      type,
      period,
    },
    result: range.map((date) => {
      const currentKey = format(date, dateFormat);
      const previousKey = format(subYears(date, 1), dateFormat);
      const current = combinedData?.find((p) => p.key === currentKey);
      const currentValue = current?.value ?? 0;
      const previous = prevData?.find((p) => p.key === previousKey);
      const previousValue = previous?.value ?? 0;

      return {
        date: date.toISOString(),
        previous: {
          date: subYears(date, 1).toISOString(),
          value: previousValue ?? 0,
          currency: previous?.currency || data?.at(0)?.currency,
        },
        current: {
          date: date.toISOString(),
          value: currentValue ?? 0,
          currency: current?.currency || data?.at(0)?.currency,
        },
        precentage: {
          value: getPercentageIncrease(
            Math.abs(previousValue),
            Math.abs(currentValue)
          ),
          status: currentValue > previousValue ? "positive" : "negative",
        },
      };
    }),
  };
}

type GetVaultParams = {
  teamId: string;
  path?: string;
};

export async function getVaultQuery(supabase: Client, params: GetVaultParams) {
  const { teamId, path } = params;

  const defaultFolders = path
    ? []
    : [
        { name: "exports", isFolder: true },
        { name: "inbox", isFolder: true },
        { name: "imports", isFolder: true },
        { name: "transactions", isFolder: true },
      ];

  let basePath = teamId;

  if (path) {
    basePath = `${basePath}/${path}`;
  }

  const { data } = await supabase.storage.from("vault").list(basePath, {
    sortBy: { column: "name", order: "asc" },
  });

  const filteredData =
    data
      ?.filter((file) => file.name !== EMPTY_FOLDER_PLACEHOLDER_FILE_NAME)
      .map((item) => ({ ...item, isFolder: !item.id })) ?? [];

  const mergedMap = new Map(
    [...defaultFolders, ...filteredData].map((obj) => [obj.name, obj])
  );

  const mergedArray = Array.from(mergedMap.values());

  return {
    data: mergedArray,
  };
}

export async function getVaultActivityQuery(supabase: Client, userId: string) {
  return supabase
    .from("objects")
    .select("*")
    .eq("owner_id", userId)
    .limit(20)
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
  params: GetVaultRecursiveParams
) {
  const { teamId, path, folder, limit = 10000, offset = 0 } = params;

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
      })
    )
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
      team:team_id(*)`
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
  params: GetUserInviteQueryParams
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
  status: "completed" | "archived";
  from?: number;
  to?: number;
};

export async function getInboxQuery(
  supabase: Client,
  params: GetInboxQueryParams
) {
  const { from = 0, to = 10, teamId, status } = params;

  const query = supabase
    .from("decrypted_inbox")
    .select(
      "*, subject:decrypted_subject, issuer_name:decrypted_issuer_name, name:decrypted_name, transaction:decrypted_transactions(id, amount, currency, name:decrypted_name, date)",
      {
        count: "exact",
      }
    )
    .eq("team_id", teamId)
    .eq("archived", false)
    .eq("trash", false)
    .order("created_at", { ascending: false });

  if (status === "completed") {
    query.not("transaction_id", "is", null);
  }

  const { data, count } = await query.range(from, to);

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
    count,
  };
}

type GetTrackerProjectsQueryParams = {
  teamId: string;
  to: number;
  from?: number;
  sort?: {
    column: string;
    value: "asc" | "desc";
  };
  search?: {
    query?: string;
    fuzzy?: boolean;
  };
  filter?: {
    status?: "in_progress" | "completed";
  };
};

export async function getTrackerProjectsQuery(
  supabase: Client,
  params: GetTrackerProjectsQueryParams
) {
  const { from = 0, to = 10, filter, sort, teamId, search } = params;
  const { status } = filter || {};

  const query = supabase
    .from("tracker_projects")
    .select("*, total_duration", { count: "exact" })
    .eq("team_id", teamId);

  if (status) {
    query.eq("status", status);
  }

  if (search?.query && search?.fuzzy) {
    query.ilike("name", `%${search.query}%`);
  }

  if (sort) {
    const [column, value] = sort;
    if (column === "time") {
      query.order("total_duration", { ascending: value === "asc" });
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

type GetTrackerRecordsByRangeParams = {
  teamId: string;
  from: string;
  to: string;
  projectId: string;
};

export async function getTrackerRecordsByRangeQuery(
  supabase: Client,
  params: GetTrackerRecordsByRangeParams
) {
  const query = supabase
    .from("tracker_entries")
    .select(
      "*, assigned:assigned_id(id, full_name, avatar_url), project:project_id(id, name)"
    )
    .eq("team_id", params.teamId)
    .gte("date", params.from)
    .lte("date", params.to)
    .order("created_at");

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
    (duration, item) => item.duration + duration,
    0
  );

  return {
    meta: {
      totalDuration,
      from: params.from,
      to: params.to,
    },
    data: result,
  };
}
