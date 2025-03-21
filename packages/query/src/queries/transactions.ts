import { UTCDate } from "@date-fns/utc";
import type { Client } from "@midday/supabase/types";

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

export async function getTransactions(
  supabase: Client,
  params?: GetTransactionsParams,
) {
  const { from = 0, to, filter, sort, teamId, searchQuery } = params || {};

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
    "internal",
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
    // NOTE: date can be on the same day (2020-01-01), so we need to order by id and amount to keep the order
    query
      .order("date", { ascending: false })
      .order("name", { ascending: false })
      .order("id", { ascending: false });
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
      query.textSearch("fts_vector", `${searchQuery.replaceAll(" ", "+")}:*`);
    }
  }

  if (statuses?.includes("uncompleted") || attachments === "exclude") {
    query.eq("is_fulfilled", false);
  } else if (statuses?.includes("completed") || attachments === "include") {
    query.eq("is_fulfilled", true);
  } else if (statuses?.includes("excluded")) {
    query.eq("internal", true);
  }

  if (statuses?.includes("archived")) {
    query.eq("status", "archived");
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
      // category: transactionCategory(transaction),
    })),
  };
}
