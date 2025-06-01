import { DataTable } from "@/components/tables/transactions/data-table";
import { Loading } from "@/components/tables/transactions/loading";
import { TransactionsActions } from "@/components/transactions-actions";
import { TransactionsSearchFilter } from "@/components/transactions-search-filter";
import { loadSortParams } from "@/hooks/use-sort-params";
import { loadTransactionFilterParams } from "@/hooks/use-transaction-filter-params";
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

  const columnVisibility = getInitialTransactionsColumnVisibility();

  // Change this to prefetch once this is fixed: https://github.com/trpc/trpc/issues/6632
  await queryClient.fetchInfiniteQuery(
    trpc.transactions.get.infiniteQueryOptions({
      ...filter,
      sort,
    }),
  );

  return (
    <HydrateClient>
      <div className="flex justify-between py-6">
        <TransactionsSearchFilter />
        <TransactionsActions />
      </div>

      <Suspense fallback={<Loading />}>
        <DataTable columnVisibility={columnVisibility} />
      </Suspense>
    </HydrateClient>
  );
}
