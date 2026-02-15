import type { Metadata } from "next";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import type { SearchParams } from "nuqs/server";
import { Suspense } from "react";
import { AddTransactions } from "@/components/add-transactions";
import { ErrorFallback } from "@/components/error-fallback";
import { ScrollableContent } from "@/components/scrollable-content";
import { DataTable } from "@/components/tables/transactions/data-table";
import { Loading } from "@/components/tables/transactions/loading";
import { TransactionTabs } from "@/components/transaction-tabs";
import { TransactionsColumnVisibility } from "@/components/transactions-column-visibility";
import { TransactionsSearchFilter } from "@/components/transactions-search-filter";
import { TransactionsUploadZone } from "@/components/transactions-upload-zone";
import { loadSortParams } from "@/hooks/use-sort-params";
import { loadTransactionFilterParams } from "@/hooks/use-transaction-filter-params";
import { loadTransactionTab } from "@/hooks/use-transaction-tab";
import { batchPrefetch, HydrateClient, trpc } from "@/trpc/server";
import { getInitialTableSettings } from "@/utils/columns";

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

  // Get unified table settings from cookie
  const initialSettings = await getInitialTableSettings("transactions");

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

  // Prefetch all data needed for instant experience
  batchPrefetch([
    // Transaction data for both tabs
    trpc.transactions.get.infiniteQueryOptions(allTabFilter),
    trpc.transactions.get.infiniteQueryOptions(reviewTabFilter),
    trpc.transactions.getReviewCount.queryOptions(),
    // Shared data used by table rows (assign user, tags)
    trpc.team.members.queryOptions(),
    trpc.tags.get.queryOptions(),
    // Apps for export bar (accounting providers)
    trpc.apps.get.queryOptions(),
  ]);

  return (
    <HydrateClient>
      <ScrollableContent>
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

        <ErrorBoundary errorComponent={ErrorFallback}>
          <Suspense
            fallback={
              <Loading
                columnVisibility={initialSettings.columns}
                columnSizing={initialSettings.sizing}
                columnOrder={initialSettings.order}
              />
            }
          >
            <TransactionsUploadZone>
              <DataTable initialSettings={initialSettings} initialTab={tab} />
            </TransactionsUploadZone>
          </Suspense>
        </ErrorBoundary>
      </ScrollableContent>
    </HydrateClient>
  );
}
