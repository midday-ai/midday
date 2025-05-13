import {
  endOfMonth,
  formatISO,
  parseISO,
  startOfMonth,
  subYears,
} from "date-fns";
import type { Client } from "../types";

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
    .order("created_at");

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
  cursor?: string | null;
  sort?: string[] | null;
  pageSize?: number;
  filter?: {
    q?: string | null;
    statuses?: string[] | null;
    attachments?: "include" | "exclude" | null;
    categories?: string[] | null;
    tags?: string[] | null;
    accounts?: string[] | null;
    assignees?: string[] | null;
    type?: "income" | "expense" | null;
    start?: string | null;
    end?: string | null;
    recurring?: string[] | null;
    amount_range?: number[] | null;
    amount?: string[] | null;
  };
};

export async function getTransactionsQuery(
  supabase: Client,
  params: GetTransactionsParams,
) {
  const { filter, sort, teamId, cursor, pageSize = 40 } = params;

  const {
    q,
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
    amount,
    amount_range,
  } = filter || {};

  const columns = `
      id,
      date,
      amount,
      currency,
      method,
      status,
      note,
      manual,
      internal,
      recurring,
      frequency,
      name,
      description,
      assigned:assigned_id(*),
      category:transaction_categories(id, name, color, slug),
      bank_account:bank_accounts(id, name, currency, bank_connection:bank_connections(id, logo_url)),
      attachments:transaction_attachments(id, name, size, path, type),
      tags:transaction_tags(id, tag_id, tag:tags(id, name)),
      vat:calculated_vat
    `;

  const query = supabase
    .from("transactions")
    .select(columns)
    .eq("team_id", teamId);

  // Apply sorting
  if (sort) {
    const [column, value] = sort;
    const ascending = value === "asc";

    if (column === "attachment") {
      query.order("is_fulfilled", { ascending });
      query.order("id", { ascending }); // Secondary sort for stability
    } else if (column === "assigned") {
      query.order("assigned(full_name)", { ascending });
      query.order("id", { ascending });
    } else if (column === "bank_account") {
      query.order("bank_account(name)", { ascending });
      query.order("id", { ascending });
    } else if (column === "category") {
      query.order("category(name)", { ascending });
      query.order("id", { ascending });
    } else if (column === "tags") {
      query.order("is_transaction_tagged", { ascending });
      query.order("id", { ascending });
    } else if (column) {
      query.order(column, { ascending });
      query.order("id", { ascending }); // Always include ID as secondary sort
    }
  } else {
    // Default sorting
    query.order("date", { ascending: false }).order("id", { ascending: false }); // Always include ID as secondary sort
  }

  if (start && end) {
    query.gte("date", start);
    query.lte("date", end);
  }

  if (q) {
    if (!Number.isNaN(Number.parseInt(q))) {
      query.eq("amount", Number(q));
    } else {
      query.textSearch("fts_vector", `${q.replaceAll(" ", "+")}:*`);
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
      .in("temp_filter_tags.tag_id", tags)
      .eq("team_id", teamId)
      .select(`${columns}, temp_filter_tags:transaction_tags!inner()`);
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

  // Convert cursor to offset
  const offset = cursor ? Number.parseInt(cursor, 10) : 0;

  // TODO: Use cursor instead of range
  const { data } = await query.range(offset, offset + pageSize - 1);

  // Generate next cursor (offset)
  const nextCursor =
    data && data.length === pageSize
      ? (offset + pageSize).toString()
      : undefined;

  return {
    meta: {
      cursor: nextCursor,
      hasPreviousPage: offset > 0,
      hasNextPage: data && data.length === pageSize,
    },
    data: data ?? [],
  };
}

export async function getTransactionQuery(supabase: Client, id: string) {
  const { data } = await supabase
    .from("transactions")
    .select(`
      *,
      assigned:assigned_id(*),
      attachments:transaction_attachments(*),
      category:transaction_categories(id, name, color, slug),
      tags:transaction_tags(id, tag:tags(id, name)),
      bank_account:bank_accounts(id, name, currency, bank_connection:bank_connections(id, logo_url)),
      vat:calculated_vat
    `)
    .eq("id", id)
    .single();

  return {
    data,
  };
}

type GetSimilarTransactionsParams = {
  name: string;
  teamId: string;
  categorySlug?: string;
  frequency?: "weekly" | "monthly" | "annually" | "irregular";
};

export async function getSimilarTransactions(
  supabase: Client,
  params: GetSimilarTransactionsParams,
) {
  const { name, teamId, categorySlug, frequency } = params;

  const query = supabase
    .from("transactions")
    .select("id, amount, team_id")
    .eq("team_id", teamId)
    .textSearch("fts_vector", `${name.replaceAll(" ", "+")}:*`);

  if (categorySlug) {
    query.neq("category_slug", categorySlug);
  }

  if (frequency) {
    query.eq("frequency", frequency);
  }

  return query;
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

  const { data } = await supabase.rpc("get_burn_rate_v4", {
    team_id: teamId,
    date_from: startOfMonth(parseISO(from)).toDateString(),
    date_to: endOfMonth(parseISO(to)).toDateString(),
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

  return supabase.rpc("get_runway_v4", {
    team_id: teamId,
    date_from: startOfMonth(parseISO(from)).toDateString(),
    date_to: endOfMonth(parseISO(to)).toDateString(),
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

  const [{ data: prevData }, { data: currentData }] = await Promise.all([
    supabase.rpc(rpc, {
      team_id: teamId,
      date_from: subYears(startOfMonth(parseISO(from)), 1).toDateString(),
      date_to: subYears(endOfMonth(parseISO(to)), 1).toDateString(),
      base_currency: currency,
    }),
    supabase.rpc(rpc, {
      team_id: teamId,
      date_from: startOfMonth(parseISO(from)).toDateString(),
      date_to: endOfMonth(parseISO(to)).toDateString(),
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

  const { data } = await supabase.rpc("get_expenses", {
    team_id: teamId,
    date_from: startOfMonth(parseISO(from)).toDateString(),
    date_to: endOfMonth(parseISO(to)).toDateString(),
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
    result: data?.map((item) => ({
      ...item,
      value: item.value,
      recurring: item.recurring_value,
      total: item.value + item.recurring_value,
    })),
  };
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

type GetTrackerProjectByIdQueryParams = {
  teamId: string;
  id: string;
};

export async function getTrackerProjectByIdQuery(
  supabase: Client,
  params: GetTrackerProjectByIdQueryParams,
) {
  return supabase
    .from("tracker_projects")
    .select("*, tags:tracker_project_tags(id, tag:tags(id, name))")
    .eq("id", params.id)
    .eq("team_id", params.teamId)
    .single();
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
    .order("name", { ascending: true })
    .range(0, limit);
}

export type GetInvoicesQueryParams = {
  teamId: string;
  cursor?: string | null;
  pageSize?: number;
  filter?: {
    q?: string | null;
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
  const { teamId, filter, sort, cursor, pageSize = 25 } = params;
  const { q, statuses, start, end, customers } = filter || {};

  const query = supabase
    .from("invoices")
    .select(
      `
      id,
      due_date,
      invoice_number,
      created_at,
      amount,
      currency,
      line_items,
      payment_details,
      customer_details,
      reminder_sent_at,
      updated_at,
      note,
      internal_note,
      paid_at,
      vat,
      tax,
      file_path,
      status,
      viewed_at,
      from_details,
      issue_date,
      sent_at,
      template,
      note_details,
      customer_name,
      token,
      sent_to,
      discount,
      subtotal,
      top_block,
      bottom_block,
      customer:customer_id(name, website, email),
      customer_id,
      team:team_id(name),
      vat,
      tax
    `,
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
    query.gte("due_date", start);
    query.lte("due_date", end);
  }

  if (customers?.length) {
    query.in("customer_id", customers);
  }

  if (q) {
    if (!Number.isNaN(Number.parseInt(q))) {
      query.eq("amount", Number(q));
    } else {
      query.textSearch("fts", `${q.replaceAll(" ", "+")}:*`);
    }
  }

  // Convert cursor to offset
  const offset = cursor ? Number.parseInt(cursor, 10) : 0;

  // TODO: Use cursor instead of range
  const { data } = await query.range(offset, offset + pageSize - 1);

  // Generate next cursor (offset)
  const nextCursor =
    data && data.length === pageSize
      ? (offset + pageSize).toString()
      : undefined;

  return {
    meta: {
      cursor: nextCursor,
      hasPreviousPage: offset > 0,
      hasNextPage: data && data.length === pageSize,
    },
    data,
  };
}

export type GetInvoiceSummaryParams = {
  teamId: string;
  status?: "paid" | "canceled" | "overdue" | "unpaid" | "draft";
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
  filter?: {
    q?: string | null;
  };
  sort?: string[] | null;
  cursor?: string | null;
  pageSize?: number;
};

export async function getCustomersQuery(
  supabase: Client,
  params: GetCustomersQueryParams,
) {
  const { teamId, filter, sort, cursor, pageSize = 25 } = params;

  const { q } = filter || {};

  const query = supabase
    .from("customers")
    .select(
      "*, invoices:invoices(id), projects:tracker_projects(id), tags:customer_tags(id, tag:tags(id, name))",
      { count: "exact" },
    )
    .eq("team_id", teamId);

  if (q) {
    query.textSearch("fts", `${q.replaceAll(" ", "+")}:*`);
  }

  if (sort?.length === 2) {
    const [column, value] = sort;
    const ascending = value === "asc";

    if (column === "invoices") {
      query.order("get_invoice_count", { ascending });
    } else if (column === "projects") {
      query.order("get_project_count", { ascending });
    } else if (column === "tags") {
      query.order("is_customer_tagged", { ascending });
    } else if (column) {
      query.order(column, { ascending });
    }
  } else {
    query.order("created_at", { ascending: false });
  }

  // Convert cursor to offset
  const offset = cursor ? Number.parseInt(cursor, 10) : 0;

  // TODO: Use cursor instead of range
  const { data } = await query.range(offset, offset + pageSize - 1);

  // Generate next cursor (offset)
  const nextCursor =
    data && data.length === pageSize
      ? (offset + pageSize).toString()
      : undefined;

  return {
    meta: {
      cursor: nextCursor,
      hasPreviousPage: offset > 0,
      hasNextPage: data && data.length === pageSize,
    },
    data: data ?? [],
  };
}

export async function getCustomerQuery(supabase: Client, customerId: string) {
  return supabase
    .from("customers")
    .select("*, tags:customer_tags(id, tag:tags(id, name))")
    .eq("id", customerId)
    .single();
}

export async function getInvoiceTemplateQuery(
  supabase: Client,
  teamId: string,
) {
  return supabase
    .from("invoice_templates")
    .select(`
      id,
      customer_label,
      from_label,
      invoice_no_label,
      issue_date_label,
      due_date_label,
      description_label,
      price_label,
      quantity_label,
      total_label,
      vat_label,
      tax_label,
      payment_label,
      note_label,
      logo_url,
      currency,
      subtotal_label,
      payment_details,
      from_details,
      size,
      date_format,
      include_vat,
      include_tax,
      tax_rate,
      delivery_type,
      discount_label,
      include_discount,
      include_decimals,
      include_qr,
      total_summary_label,
      title,
      vat_rate,
      include_units,
      include_pdf
    `)
    .eq("team_id", teamId)
    .single();
}

export async function getInvoiceByIdQuery(supabase: Client, id: string) {
  return supabase
    .from("invoices")
    .select(
      `
      id,
      due_date,
      invoice_number,
      amount,
      created_at,
      currency,
      line_items,
      payment_details,
      customer_details,
      reminder_sent_at,
      updated_at,
      status,
      note,
      internal_note,
      paid_at,
      vat,
      tax,
      file_path,
      viewed_at,
      from_details,
      issue_date,
      template,
      sent_at,
      note_details,
      customer_name,
      customer_id,
      token,
      sent_to,
      discount,
      subtotal,
      top_block,
      bottom_block,
      customer:customer_id(name, website, email),
      team:team_id(name),
      vat,
      tax
    `,
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
    .ilike("invoice_number", `%${params.query}`)
    .single();
}

export async function getNextInvoiceNumberQuery(
  supabase: Client,
  teamId: string,
) {
  return supabase.rpc("get_next_invoice_number", {
    team_id: teamId,
  });
}

export async function getTagsQuery(supabase: Client, teamId: string) {
  return supabase
    .from("tags")
    .select("*")
    .eq("team_id", teamId)
    .order("created_at", { ascending: false });
}

export async function getTeamLimitsMetricsQuery(
  supabase: Client,
  teamId: string,
) {
  return supabase
    .rpc("get_team_limits_metrics", {
      input_team_id: teamId,
    })
    .single();
}

export async function getTeamByIdQuery(supabase: Client, teamId: string) {
  return supabase.from("teams").select("*").eq("id", teamId).single();
}

export async function getInboxAccountsQuery(supabase: Client, teamId: string) {
  return supabase
    .from("inbox_accounts")
    .select("id, email, provider, last_accessed")
    .eq("team_id", teamId);
}

export async function getInboxAccountByIdQuery(supabase: Client, id: string) {
  return supabase
    .from("inbox_accounts")
    .select(
      "id, email, provider, access_token, refresh_token, expiry_date, last_accessed",
    )
    .eq("id", id)
    .single();
}

export async function getExistingInboxAttachmentsQuery(
  supabase: Client,
  inputArray: string[],
) {
  return supabase
    .from("inbox")
    .select("reference_id")
    .in("reference_id", inputArray);
}

export async function getAvailablePlansQuery(supabase: Client, teamId: string) {
  const [teamMembersResponse, bankConnectionsResponse] = await Promise.all([
    supabase.from("users_on_team").select("id").eq("team_id", teamId),
    supabase.from("bank_connections").select("id").eq("team_id", teamId),
  ]);

  const teamMembersCount = teamMembersResponse.data?.length ?? 0;
  const bankConnectionsCount = bankConnectionsResponse.data?.length ?? 0;

  // Can choose starter if team has 2 or fewer members and 2 or fewer bank connections
  const starter = teamMembersCount <= 2 && bankConnectionsCount <= 2;

  // Can always choose pro plan
  return {
    data: {
      starter,
      pro: true,
    },
  };
}

export type SearchTransactionMatchParams = {
  teamId: string;
  inboxId?: string;
  query?: string;
  maxResults?: number;
  minConfidenceScore?: number;
};

export async function searchTransactionMatchQuery(
  supabase: Client,
  params: SearchTransactionMatchParams,
) {
  const {
    teamId,
    query,
    inboxId,
    maxResults = 5,
    minConfidenceScore = 0.5,
  } = params;

  if (query) {
    return supabase.rpc("search_transactions_direct", {
      p_team_id: teamId,
      p_query: query,
      p_max_results: maxResults,
    });
  }

  if (inboxId) {
    return supabase.rpc("match_transactions_to_inbox", {
      p_team_id: teamId,
      p_inbox_id: inboxId,
      p_max_results: maxResults,
      p_min_confidence_score: minConfidenceScore,
    });
  }

  return {
    data: [],
  };
}

type GlobalSearchParams = {
  teamId: string;
  searchTerm?: string;
  limit?: number;
  itemsPerTableLimit?: number;
  language?: string;
  relevanceThreshold?: number;
};

export async function globalSearchQuery(
  supabase: Client,
  params: GlobalSearchParams,
) {
  return supabase.rpc("global_search", {
    p_search_term: params.searchTerm,
    p_team_id: params.teamId,
    p_search_lang: params.language,
    p_limit: params.limit,
    p_items_per_table_limit: params.itemsPerTableLimit,
    p_relevance_threshold: params.relevanceThreshold,
  });
}

type GlobalSemanticSearchParams = {
  teamId: string;
  searchTerm: string;
  itemsPerTableLimit?: number;
  language?: string;
  types?: string[];
  amount?: number;
  amount_min?: number;
  amount_max?: number;
  status?: string;
  currency?: string;
  start_date?: string;
  end_date?: string;
  due_date_start?: string;
  due_date_end?: string;
};

export async function globalSemanticSearchQuery(
  supabase: Client,
  params: GlobalSemanticSearchParams,
) {
  return supabase.rpc("global_semantic_search", {
    search_term: params.searchTerm,
    team_id: params.teamId,
    language: params.language,
    types: params.types,
    items_per_table_limit: params.itemsPerTableLimit,
    amount: params.amount,
    amount_min: params.amount_min,
    amount_max: params.amount_max,
    status: params.status,
    currency: params.currency,
    start_date: params.start_date,
    end_date: params.end_date,
    due_date_start: params.due_date_start,
    due_date_end: params.due_date_end,
  });
}
