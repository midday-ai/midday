import { AddTransactions } from "@/components/add-transactions";
import { DataTable } from "@/components/tables/transactions/data-table";
import { Loading } from "@/components/tables/transactions/loading";
import { TransactionTabs } from "@/components/transaction-tabs";
import { TransactionsColumnVisibility } from "@/components/transactions-column-visibility";
import { TransactionsSearchFilter } from "@/components/transactions-search-filter";
import { loadSortParams } from "@/hooks/use-sort-params";
import { loadTransactionFilterParams } from "@/hooks/use-transaction-filter-params";
import { loadTransactionTab } from "@/hooks/use-transaction-tab";
import { HydrateClient, getQueryClient, trpc } from "@/trpc/server";
import { getInitialTransactionsColumnVisibility } from "@/utils/columns";
import type { Metadata } from "next";
import type { SearchParams } from "nuqs/server";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Transactions | Midday",
};

type Props = {
  searchParams: Promise<SearchParams>;
};

export default async function Transactions(props: Props) {
  const queryClient = getQueryClient();
  const searchParams = await props.searchParams;

  const filter = loadTransactionFilterParams(searchParams);
  const { sort } = loadSortParams(searchParams);
  const { tab } = loadTransactionTab(searchParams);

  const columnVisibility = getInitialTransactionsColumnVisibility();

  // Change this to prefetch once this is fixed: https://github.com/trpc/trpc/issues/6632
  await queryClient.fetchInfiniteQuery(
    trpc.transactions.get.infiniteQueryOptions({
      ...filter,
      amountRange: filter.amount_range ?? null,
      sort,
    }),
  );

  // Prefetch review count for tabs
  queryClient.prefetchQuery(trpc.transactions.getReviewCount.queryOptions());

  return (
    <HydrateClient>
      <div className="flex justify-between items-center py-6">
        <TransactionsSearchFilter />
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2">
            <TransactionsColumnVisibility />
            <AddTransactions />
          </div>
          <TransactionTabs />
        </div>
      </div>

      <Suspense fallback={<Loading />}>
        <DataTable columnVisibility={columnVisibility} initialTab={tab} />
      </Suspense>
    </HydrateClient>
  );
}
