import {
  addMonths,
  addWeeks,
  differenceInMonths,
  differenceInWeeks,
  format,
  subYears,
} from "date-fns";
import { Client } from "../types";
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

export async function getSession(supabase: Client) {
  return supabase.auth.getSession();
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
    data: { session },
  } = await supabase.auth.getSession();

  return getUserQuery(supabase, session?.user?.id);
}

export async function getBankConnectionsByTeamIdQuery(
  supabase: Client,
  teamId: string
) {
  return supabase
    .from("bank_connections")
    .select("*")
    .eq("team_id", teamId)
    .throwOnError();
}

export async function getTeamBankAccountsQuery(
  supabase: Client,
  teamId: string
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
    .select(
      `
      id,
      role,
      user:users(id,full_name,avatar_url,email)
    `
    )
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
    .order("order", { ascending: false })
    .eq("team_id", params.teamId)
    .lt("amount", 0)
    .throwOnError();

  if (params.from && params.to) {
    query.gte("date", params.from);
    query.lte("date", params.to);
  }

  const { data, count } = await query.range(0, 10000000);
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
  filter: {
    search?: string;
    status?: "fullfilled" | "unfullfilled";
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
  const { from = 0, to, filter, sort, teamId } = params;
  const {
    date = {},
    search,
    status,
    attachments,
    categories,
    type,
  } = filter || {};

  const query = supabase
    .from("transactions")
    .select(
      `
      *,
      assigned:assigned_id(*),
      attachments(*)
    `,
      { count: "exact" }
    )
    .eq("team_id", teamId);

  if (sort) {
    const [column, value] = sort;
    query.order(column, { ascending: value === "asc" });
  } else {
    query.order("order", { ascending: false });
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

  if (attachments === "exclude" || status?.includes("unfullfilled")) {
    query.filter("attachments.id", "is", null);
  }

  if (status?.includes("fullfilled") || attachments === "include") {
    query.select(`
      *,
      assigned:assigned_id(*),
      attachments!inner(id,size,name)
    `);
  }

  if (categories) {
    query.select(
      `
      *,
      assigned:assigned_id(*),
      attachments(*)
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
  const totalAmount = filter
    ? (await query.limit(10000000))?.data?.reduce(
        (amount, item) => item.amount + amount,
        0
      )
    : 0;

  const totalMissingAttachments = data?.reduce((acc, currentItem) => {
    if (currentItem.attachments.length === 0) {
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
    .from("transactions")
    .select(
      `
      *,
      assigned:assigned_id(*),
      attachments(*)
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
    .from("transactions")
    .select("id, amount, team_id", { count: "exact" })
    .eq("name", name)
    .eq("team_id", teamId)
    .throwOnError();
}

type GetMetricsParams = {
  teamId: string;
  from: string;
  to: string;
  type?: "income" | "profit_loss";
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
    .order("order", { ascending: false })
    .limit(1000000)
    .gte("date", previousFromDate.toDateString())
    .lte("date", to)
    .neq("category", "transfer");

  if (type === "income") {
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

  const result = sum.reduce((acc, item) => {
    const key = format(new Date(item.date), "y");
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {});

  const [prevData, currentData] = Object.values(result);

  const prevTotal = prevData?.reduce((value, item) => item.value + value, 0);
  const currentTotal = currentData?.reduce(
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
      const current = currentData?.find((p) => p.key === currentKey);
      const currentValue = current?.value ?? 0;
      const previous = prevData?.find((p) => p.key === previousKey);
      const previousValue = previous?.value ?? 0;

      return {
        date: date.toDateString(),
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

  const defaultFolders = path ? [] : [{ name: "exports", isFolder: true }];

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
      .filter((file) => file.name !== "transactions")
      .map((item) => ({ ...item, isFolder: !item.id })) ?? [];

  const mergedMap = new Map(
    [...defaultFolders, ...filteredData].map((obj) => [obj.name, obj])
  );

  const mergedArray = Array.from(mergedMap.values());

  return {
    data: mergedArray,
  };
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
