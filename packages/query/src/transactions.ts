import { createClient } from "@midday/supabase/client";
import type { Database } from "@midday/supabase/types";
import { useOffsetInfiniteScrollQuery } from "@supabase-cache-helpers/postgrest-swr";

const client = createClient();

export type Transaction = Database["public"]["Tables"]["transactions"]["Row"];

export type GetTransactionsParams = {
  teamId: string;
  to: number;
  from: number;
  pageSize?: number;
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

export const useTransactionsInfiniteQuery = (params: GetTransactionsParams) => {
  const query = client
    .from("transactions")
    .select(
      "id, date, amount, currency, method, status, note, manual, internal, recurring, frequency, name, description, assigned:assigned_id(*), category:transaction_categories(id, name, color, slug), bank_account:bank_accounts(id, name, currency, bank_connection:bank_connections(id, logo_url)), attachments:transaction_attachments(id, name, size, path, type), tags:transaction_tags(id, tag_id, tag:tags(id, name)), vat:calculated_vat",
    )
    .eq("team_id", params.teamId)
    .order("date", { ascending: false });

  return useOffsetInfiniteScrollQuery(query, {
    pageSize: params.pageSize || 50,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });
};
