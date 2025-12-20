import { AddTransactions } from "@/components/add-transactions";
import { DataTable } from "@/components/tables/transactions/data-table";
import { Loading } from "@/components/tables/transactions/loading";
import { TransactionTabs } from "@/components/transaction-tabs";
import { TransactionsColumnVisibility } from "@/components/transactions-column-visibility";
import { TransactionsSearchFilter } from "@/components/transactions-search-filter";
import { loadSortParams } from "@/hooks/use-sort-params";
import { loadTransactionFilterParams } from "@/hooks/use-transaction-filter-params";
import { loadTransactionTab } from "@/hooks/use-transaction-tab";
import { HydrateClient, batchPrefetch, trpc } from "@/trpc/server";
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
  const searchParams = await props.searchParams;

  const filter = loadTransactionFilterParams(searchParams);
  const { sort } = loadSortParams(searchParams);
  const { tab } = loadTransactionTab(searchParams);

  const columnVisibility = getInitialTransactionsColumnVisibility();

  // Build query filters for both tabs
  const allTabFilter = {
    ...filter,
    amountRange: filter.amount_range ?? null,
    sort,
  };

  const reviewTabFilter = {
    ...filter,
    amountRange: filter.amount_range ?? null,
    sort,
    fulfilled: true,
    exported: false,
    pageSize: 10000,
  };

  // Prefetch both tabs + review count in parallel
  batchPrefetch([
    trpc.transactions.get.infiniteQueryOptions(allTabFilter),
    trpc.transactions.get.infiniteQueryOptions(reviewTabFilter),
    trpc.transactions.getReviewCount.queryOptions(),
  ]);

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
